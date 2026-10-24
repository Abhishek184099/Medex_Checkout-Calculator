import type { Service } from "@prisma/client";
import type { QuoteResult } from "../engines/types";
import { formatMoney } from "../lib/money";

const money = (satang : number) => formatMoney(satang); 

export function presentService(s : Service){
   return{
    id : s.id,
    name: s.name,
    type: s.type,
    providerId: s.providerId,
    price: money(s.priceSatang),
   }
}

export function presentQuote(q: QuoteResult) {
  return {
    lines: q.lines.map((l) => ({
      serviceId: l.serviceId,
      quantity: l.quantity,
      amount: money(l.amount),
      discounts: Object.fromEntries(
        Object.entries(l.discounts).map(([code, value]) => [code, money(value)])
      ),
      amountAfterDiscounts: money(l.amountAfterDiscounts),
    })),
    coupons: q.coupons.map((c) =>
      c.status === "applied"
        ? { code: c.code, status: c.status, discount: money(c.discount) }
        : { code: c.code, status: c.status, reason: c.reason }
    ),
    subtotal: money(q.subtotal),
    discountTotal: money(q.discountTotal),
    netAmount: money(q.netAmount),
    vat: money(q.vat),
    total: money(q.total),
  };
}
