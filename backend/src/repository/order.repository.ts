import type{Order} from "@prisma/client"
import type{Db} from "../config/prisma"
import type {QuoteResult} from "../engines/types"

export class OrderRepository {
  constructor(private readonly db: Db) {}

  create(userId: string | null, quote: QuoteResult): Promise<Order> {
    return this.db.order.create({
      data: {
        userId,
        subtotalSatang: quote.subtotal,
        discountSatang: quote.discountTotal,
        netSatang: quote.netAmount,
        vatSatang: quote.vat,
        totalSatang: quote.total,
        lines: {
          create: quote.lines.map((l) => ({
            serviceId: l.serviceId,
            quantity: l.quantity,
            amountSatang: l.amount,
            afterSatang: l.amountAfterDiscounts,
            discounts: l.discounts,
          })),
        },
        coupons: {
          create: quote.coupons.flatMap((c) =>
            c.status === "applied"
              ? [{ couponCode: c.code, discountSatang: c.discount }]
              : []
          ),
        },
      },
    });
  }
}
