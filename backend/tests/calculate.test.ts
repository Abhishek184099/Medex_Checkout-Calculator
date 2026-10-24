import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calculateQuote } from "../src/engines/calculate";
import { toEngineCoupon, toEngineService } from "../src/engines/adapters";
import type { EngineCoupon, QuoteInput } from "../src/engines/types";
import { presentQuote } from "../src/presenters/checkout.presenter";
import { bangkokDate } from "../src/lib/date";
import { roundDiv, parseMoney } from "../src/lib/money";
import {
  parsePercentThousandths,
  toCouponRow,
  toPriorUsage,
  toServiceRow,
  type CheckoutData,
} from "../src/data/mapping";
const data = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "src/data/checkout.json"), "utf8")
) as CheckoutData;


const services = new Map(data.services.map((s) => [s.id, toServiceRow(s)]));

const coupons = new Map<string, EngineCoupon>(
  data.coupons.map((c) => {
    const row = toCouponRow(c);
    return [row.code, toEngineCoupon(row)];
  })
);

function quoteFor(options: {
  serviceIds: string[];
  couponCodes: string[];
  customerId?: string | null;
  today?: string;
}) {
  const customerRecord = options.customerId
    ? data.customers.find((c) => c.id === options.customerId)
    : undefined;

  const input: QuoteInput = {
    lines: options.serviceIds.map((id) => ({
      service: toEngineService(services.get(id)!),
      quantity: 1,
    })),
    couponCodes: options.couponCodes,
    coupons,
    customer: customerRecord
      ? {
          id: customerRecord.id,
          ordersCount: customerRecord.ordersCount,
          priorUsage: toPriorUsage(data.coupons, customerRecord.id),
        }
      : null,
    today: options.today ?? "2026-11-02",
  };

  return calculateQuote(input);
}

describe("data/checkout.json examples", () => {
  data.examples.forEach((example, i) => {
    it(`example ${i + 1} matches the expected response`, () => {
      const req = example.request;
      const customerRecord = req.customerId
        ? data.customers.find((c) => c.id === req.customerId)
        : undefined;

      const quote = calculateQuote({
        lines: req.lines.map((l) => ({
          service: toEngineService(services.get(l.serviceId)!),
          quantity: l.quantity,
        })),
        couponCodes: req.couponCodes,
        coupons,
        customer: customerRecord
          ? {
              id: customerRecord.id,
              ordersCount: customerRecord.ordersCount,
              priorUsage: toPriorUsage(data.coupons, customerRecord.id),
            }
          : null,
        today: bangkokDate(new Date(req.at!)),
      });

      expect(presentQuote(quote)).toEqual(example.expected);
    });
  });
});



describe("money", () => {
  it("parses money strings to satang without float error", () => {
    expect(parseMoney("0.10") + parseMoney("0.20")).toBe(30);
    expect(parseMoney("3450.50")).toBe(345050);
  });

  it("rounds half up", () => {
    expect(roundDiv(25, 2)).toBe(13); 
    expect(roundDiv(24, 2)).toBe(12); 
  });
});

describe("percent values", () => {
  it("stores percent × 1000 so 33.333 becomes 33333", () => {
    expect(parsePercentThousandths("33.333")).toBe(33333);
    expect(parsePercentThousandths("10")).toBe(10000);
  });

  it("gives 33.33 THB off a 100.00 THB line with THIRD", () => {
    const quote = quoteFor({ serviceIds: ["S6"], couponCodes: [] });
    expect(quote.subtotal).toBe(10);

    const big = quoteFor({ serviceIds: ["S1"], couponCodes: ["THIRD"] });
    expect(big.discountTotal).toBe(40000);
  });
});



describe("coupon checks", () => {
  it("rejects an inactive code", () => {
    const quote = quoteFor({ serviceIds: ["S1"], couponCodes: ["OLDCODE"] });
    expect(quote.coupons[0]).toEqual({
      code: "OLDCODE",
      status: "rejected",
      reason: "This code is no longer active.",
    });
  });

  it("rejects an unknown code", () => {
    const quote = quoteFor({ serviceIds: ["S1"], couponCodes: ["NOPE"] });
    expect(quote.coupons[0]).toMatchObject({
      status: "rejected",
      reason: "We don't recognise this code.",
    });
  });

  it("applies a code on its end date and rejects it the day after", () => {
    const onDay = quoteFor({ serviceIds: ["S1"], couponCodes: ["FLASH25"], today: "2026-10-07" });
    expect(onDay.coupons[0].status).toBe("applied");

    const after = quoteFor({ serviceIds: ["S1"], couponCodes: ["FLASH25"], today: "2026-10-08" });
    expect(after.coupons[0]).toMatchObject({
      status: "rejected",
      reason: "This code expired on 2026-10-07.",
    });
  });

  it("rejects a code before its start date", () => {
    const quote = quoteFor({ serviceIds: ["S1"], couponCodes: ["NEWYEAR"], today: "2026-12-31" });
    expect(quote.coupons[0]).toMatchObject({
      status: "rejected",
      reason: "This code starts on 2027-01-01.",
    });
  });

  it("rejects a code that has been fully used", () => {
    const quote = quoteFor({ serviceIds: ["S1"], couponCodes: ["LIMITED"] });
    expect(quote.coupons[0]).toMatchObject({
      status: "rejected",
      reason: "This code has been fully used.",
    });
  });

  it("still applies a code with one use left", () => {
    const quote = quoteFor({ serviceIds: ["S1"], couponCodes: ["LASTONE"] });
    expect(quote.coupons[0].status).toBe("applied");
  });

  it("rejects a per-customer code the customer has already used", () => {
    const quote = quoteFor({ serviceIds: ["S1"], couponCodes: ["ONCE"], customerId: "C2" });
    expect(quote.coupons[0]).toMatchObject({
      status: "rejected",
      reason: "You've already used this code.",
    });
  });

  it("asks a guest to log in for a per-customer code", () => {
    const quote = quoteFor({ serviceIds: ["S1"], couponCodes: ["ONCE"] });
    expect(quote.coupons[0]).toMatchObject({
      status: "rejected",
      reason: "Log in to use this code.",
    });
  });

  it("rejects a first-order code for a customer with orders", () => {
    const quote = quoteFor({ serviceIds: ["S1"], couponCodes: ["WELCOME10"], customerId: "C2" });
    expect(quote.coupons[0]).toMatchObject({
      status: "rejected",
      reason: "This code is only for your first order.",
    });
  });
});



describe("code entry rules", () => {
  it("rejects a repeated code and matches case and spaces", () => {
    const quote = quoteFor({ serviceIds: ["S1"], couponCodes: ["lab15", " LAB15 "] });
    expect(quote.coupons[1]).toEqual({
      code: "LAB15",
      status: "rejected",
      reason: "This code is already applied.",
    });
  });

  it("rejects a third code", () => {
    const quote = quoteFor({
      serviceIds: ["S1"],
      couponCodes: ["WELCOME10", "LAB15", "RIVER200"],
    });
    expect(quote.coupons[2]).toMatchObject({
      status: "rejected",
      reason: "You can use up to 2 codes per order.",
    });
  });
});