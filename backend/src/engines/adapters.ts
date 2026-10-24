import type { Coupon, Service } from "@prisma/client";
import type { EngineCoupon, EngineService } from "./types";

export function toEngineService(row: Service): EngineService {
  return {
    id: row.id,
    type: row.type,
    providerId: row.providerId,
    priceSatang: row.priceSatang,
  };
}

export function toEngineCoupon(row: Coupon): EngineCoupon {
  return {
    code: row.code,
    status: row.status,
    kind: row.kind as "percent" | "fixed",
    value: row.value,
    maxDiscountSatang: row.maxDiscountSatang,
    scope:
       row.scopeKind === "all"
    ? { kind: "all" }
    : {
        kind: row.scopeKind === "type" ? "serviceType" : "providerId",
        value: row.scopeValue ?? "",
      },
    minSpendSatang: row.minSpendSatang,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    perCustomerLimit: row.perCustomerLimit,
    firstOrderOnly: row.firstOrderOnly,
    stackable: row.stackable,
  };
}