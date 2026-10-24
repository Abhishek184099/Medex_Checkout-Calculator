import { prisma, type Db } from "../config/prisma";
import { bangkokDate } from "../lib/date";
import { AppError, ConflictError, QuoteChangedError } from "../lib/error";
import { formatMoney } from "../lib/money";
import { calculateQuote, normalizeCode } from "../engines/calculate";
import { toEngineCoupon, toEngineService } from "../engines/adapters";
import type { EngineCustomer, QuoteResult } from "../engines/types";
import { presentQuote } from "../presenters/checkout.presenter";
import { ServiceRepository } from "../repository/service.repository";
import { UserRepository } from "../repository/user.repository";
import { CouponRepository } from "../repository/coupon.repository";
import { OrderRepository } from "../repository/order.repository";
import type { CheckoutRequest } from "../validation/checkout.schema";

export class CheckoutService {
  quote(req: CheckoutRequest): Promise<QuoteResult> {
    return this.calculate(prisma, req);
  }

  async placeOrder(req: CheckoutRequest) {
    try {
      const { orderId, quote } = await prisma.$transaction((tx) =>
        this.commitOrder(tx, req)
      );
      return { orderId, quote: presentQuote(quote) };
    } catch (err) {
      if (!(err instanceof QuoteChangedError)) throw err;
      const fresh = await this.quote(req);
      throw new ConflictError(changeMessage(err.lostCodes, fresh), {
        quote: presentQuote(fresh),
      });
    }
  }

  private async commitOrder(tx: Db, req: CheckoutRequest) {
    const users = new UserRepository(tx);
    const coupons = new CouponRepository(tx);
    const orders = new OrderRepository(tx);

    if (req.customerId) await users.lockById(req.customerId);

    const quote = await this.calculate(tx, req);
    const applied = quote.coupons.flatMap((c) =>
      c.status === "applied" ? [c.code] : []
    );

    const lost = (req.expectedCouponCodes ?? [])
      .map(normalizeCode)
      .filter((code) => !applied.includes(code));
    if (lost.length > 0) throw new QuoteChangedError(lost);

    for (const code of applied) {
      if (!(await coupons.consumeOne(code))) throw new QuoteChangedError([code]);
    }

    if (req.customerId) {
      await users.incrementOrders(req.customerId);
      for (const code of applied) {
        await coupons.incrementRedemption(req.customerId, code);
      }
    }

    const order = await orders.create(req.customerId, quote);
    return { orderId: order.id, quote };
  }

  private async calculate(db: Db, req: CheckoutRequest): Promise<QuoteResult> {
    const serviceIds = [...new Set(req.lines.map((l) => l.serviceId))];
    const services = new Map(
      (await new ServiceRepository(db).findByIds(serviceIds)).map((s) => [s.id, s])
    );
    const unknown = serviceIds.find((id) => !services.has(id));
    if (unknown) throw new AppError(400, `Unknown serviceId: ${unknown}`);

    const codes = [...new Set(req.couponCodes.map(normalizeCode))];
    const couponRepo = new CouponRepository(db);
    const couponRows = await couponRepo.findByCodes(codes);

    let customer: EngineCustomer | null = null;
    if (req.customerId) {
      const user = await new UserRepository(db).findById(req.customerId);
      if (!user) throw new AppError(400, `Unknown customerId: ${req.customerId}`);
      customer = {
        id: user.id,
        ordersCount: user.ordersCount,
        priorUsage: await couponRepo.findRedemptions(user.id, codes),
      };
    }

    return calculateQuote({
      lines: req.lines.map((l) => ({
        service: toEngineService(services.get(l.serviceId)!),
        quantity: l.quantity,
      })),
      couponCodes: req.couponCodes,
      coupons: new Map(
        Array.from(couponRows, ([code, row]) => [code, toEngineCoupon(row)] as const)
      ),
      customer,
      today: bangkokDate(req.at ?? new Date()),
    });
  }
}

function changeMessage(lostCodes: string[], fresh: QuoteResult): string {
  const verb = lostCodes.length > 1 ? "are" : "is";
  const total = formatMoney(fresh.total);
  return `${lostCodes.join(", ")} ${verb} no longer available; your total is now ฿${total}`;
}