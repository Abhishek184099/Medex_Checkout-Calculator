import type { Coupon, Service } from "@prisma/client";
import { parseMoney } from "../lib/money";

export interface SeedService {
  id: string;
  title: string;
  type: string;
  providerId: number;
  providerName?: string;
  price: string;
}

export interface SeedCustomer {
  id: string;
  name: string;
  ordersCount: number;
}

export interface SeedCoupon {
  code: string;
  type: "percent" | "fixed";
  value: string;
  maxDiscount: string | null;
  minSpend: string;
  scope: { kind: "all" | "type" | "provider"; value?: string | number };
  startsOn: string | null;
  endsOn: string | null;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  usedBy: Record<string, number>;
  firstOrderOnly: boolean;
  stackable: boolean;
  status: string;
}

export interface ExampleRequest {
  lines: { serviceId: string; quantity: number }[];
  couponCodes: string[];
  customerId: string | null;
  at?: string;
}

export interface CheckoutData {
  services: SeedService[];
  customers: SeedCustomer[];
  coupons: SeedCoupon[];
  examples: { request: ExampleRequest; expected: unknown }[];
}

export function parsePercentThousandths(value: string): number {
  if (!/^\d+(\.\d{1,3})?$/.test(value)) throw new Error(`Invalid percent: ${value}`);
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
}

export function toServiceRow(s: SeedService): Service {
  return {
    id: s.id,
    name: s.title,
    type: s.type,
    providerId: String(s.providerId),
    priceSatang: parseMoney(s.price),
  };
}

export function toCouponRow(c: SeedCoupon): Coupon {
  return {
    code: c.code.trim().toUpperCase(),
    status: c.status,
    kind: c.type,
    value:
      c.type === "fixed"
        ? parseMoney(c.value)
        : parsePercentThousandths(c.value),
    maxDiscountSatang: c.maxDiscount ? parseMoney(c.maxDiscount) : null,
    scopeKind: c.scope.kind,
    scopeValue: c.scope.value === undefined ? null : String(c.scope.value),
    minSpendSatang: parseMoney(c.minSpend),
    startsOn: c.startsOn,
    endsOn: c.endsOn,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    perCustomerLimit: c.perCustomerLimit,
    firstOrderOnly: c.firstOrderOnly,
    stackable: c.stackable,
  };
}

export function toPriorUsage(coupons: SeedCoupon[], customerId: string): Record<string, number> {
  return Object.fromEntries(
    coupons.map((c) => [c.code.trim().toUpperCase(), c.usedBy[customerId] ?? 0])
  );
}