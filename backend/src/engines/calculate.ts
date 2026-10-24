import { formatMoney, roundDiv } from "../lib/money";
import type {
  CouponResult, EngineCoupon, QuoteInput, QuoteLine, QuoteResult, Scope,
} from "./types";

export const MAX_CODES = 2;
export const VAT_PERCENT = 7;

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

interface WorkLine {
  serviceId: string;
  quantity: number;
  type: string;
  providerId: string;
  amount: number;          
  remaining: number;       
  discounts: Record<string, number>;
}

interface State {
  input: QuoteInput;
  lines: WorkLine[];
  appliedNonStackable: string | null;
}

type Check =
  | { ok: true; coupon: EngineCoupon; eligible: WorkLine[] }
  | { ok: false; reason: string };

interface Entry {
  code: string;
  reason?: string; 
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const lines: WorkLine[] = input.lines.map(({ service, quantity }) => {
    const amount = service.priceSatang * quantity;
    return {
      serviceId: service.id,
      quantity,
      type: service.type,
      providerId: service.providerId,
      amount,
      remaining: amount,
      discounts: {},  
    };
  });
  const state: State = { input, lines, appliedNonStackable: null };

  const entries = classifyEntries(input.couponCodes);
  const candidates = entries.filter((e) => !e.reason).map((e) => e.code);
  const results = new Map<string, CouponResult>();

  for (const code of evaluationOrder(candidates, input.coupons)) {
    const check = runChecks(code, state);
    if (!check.ok) {
      results.set(code, { code, status: "rejected", reason: check.reason });
      continue;
    }
    const discount = applyCoupon(check.coupon, check.eligible);
    if (!check.coupon.stackable) state.appliedNonStackable = code;
    results.set(code, { code, status: "applied", discount });
  }

  const coupons: CouponResult[] = entries.map((e) =>
    e.reason
      ? { code: e.code, status: "rejected", reason: e.reason }
      : results.get(e.code)!
  );

  const quoteLines: QuoteLine[] = lines.map((l) => ({
    serviceId: l.serviceId,
    quantity: l.quantity,
    amount: l.amount,
    discounts: l.discounts,
    amountAfterDiscounts: l.remaining,
  }));

  const subtotal = sum(lines.map((l) => l.amount));
  const discountTotal = sum(
    coupons.flatMap((c) => (c.status === "applied" ? [c.discount] : []))
  );
  const netAmount = subtotal - discountTotal;
  const vat = roundDiv(netAmount * VAT_PERCENT, 100);

  return {
    lines: quoteLines,
    coupons,
    subtotal,
    discountTotal,
    netAmount,
    vat,
    total: netAmount + vat,
  };
}

function classifyEntries(rawCodes: string[]): Entry[] {
  const seen = new Set<string>();
  return rawCodes.map((raw) => {
    const code = normalizeCode(raw);
    if (seen.has(code)) return { code, reason: "This code is already applied." };
    if (seen.size >= MAX_CODES) {
      return { code, reason: `You can use up to ${MAX_CODES} codes per order.` };
    }
    seen.add(code);
    return { code };
  });
}

function evaluationOrder(codes: string[], coupons: Map<string, EngineCoupon>): string[] {
  const isStackable = (code: string) => coupons.get(code)?.stackable ?? true;
  return [...codes.filter((c) => !isStackable(c)), ...codes.filter(isStackable)];
}

function runChecks(code: string, state: State): Check {
  const { coupons, customer, today } = state.input;
  const coupon = coupons.get(code);

  if (!coupon) return fail("We don't recognise this code.");
  if (coupon.status !== "active") return fail("This code is no longer active.");
  if (coupon.startsOn && today < coupon.startsOn) {
    return fail(`This code starts on ${coupon.startsOn}.`);
  }
  if (coupon.endsOn && today > coupon.endsOn) {
    return fail(`This code expired on ${coupon.endsOn}.`);
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return fail("This code has been fully used.");
  }

  const needsLogin = coupon.perCustomerLimit !== null || coupon.firstOrderOnly;
  if (needsLogin && !customer) return fail("Log in to use this code.");
  if (
    customer &&
    coupon.perCustomerLimit !== null &&
    (customer.priorUsage[code] ?? 0) >= coupon.perCustomerLimit
  ) {
    return fail("You've already used this code.");
  }
  if (customer && coupon.firstOrderOnly && customer.ordersCount > 0) {
    return fail("This code is only for your first order.");
  }

  if (!coupon.stackable && state.appliedNonStackable) {
    return fail(`This code can't be combined with ${state.appliedNonStackable}.`);
  }

  const eligible = state.lines.filter((l) => inScope(l, coupon.scope));
  if (eligible.length === 0) {
    return fail("No items in your cart qualify for this code.");
  }

  const eligibleAmount = sum(eligible.map((l) => l.remaining));
  if (eligibleAmount < coupon.minSpendSatang) {
    const missing = formatMoney(coupon.minSpendSatang - eligibleAmount);
    return fail(`Spend ฿${missing} more on eligible items to use this code.`);
  }

  return { ok: true, coupon, eligible };
}

function applyCoupon(coupon: EngineCoupon, eligible: WorkLine[]): number {
  const eligibleAmount = sum(eligible.map((l) => l.remaining));

  let discount =
    coupon.kind === "percent"
      ? roundDiv(eligibleAmount * coupon.value, 100)
      : coupon.value;
  if (coupon.kind === "percent" && coupon.maxDiscountSatang !== null) {
    discount = Math.min(discount, coupon.maxDiscountSatang);
  }
  discount = Math.min(discount, eligibleAmount);

  spreadDiscount(eligible, discount, coupon.code, eligibleAmount);
  return discount;
}


function spreadDiscount(
  lines: WorkLine[],
  discount: number,
  code: string,
  eligibleAmount: number
): void {
  const shares = lines.map((l) =>
    eligibleAmount === 0 ? 0 : roundDiv(discount * l.remaining, eligibleAmount)
  );
  const difference = discount - sum(shares);

  let largest = 0;
  lines.forEach((l, i) => {
    if (l.remaining > lines[largest].remaining) largest = i;
  });
  shares[largest] += difference;

  lines.forEach((l, i) => {
    l.remaining -= shares[i];
    l.discounts[code] = shares[i];
  });
}

function inScope(line: WorkLine, scope: Scope): boolean {
  if (scope.kind === "all") return true;
  if (scope.kind === "serviceType") return line.type === scope.value;
  return line.providerId === scope.value;
}

function fail(reason: string): Check {
  return { ok: false, reason };
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}