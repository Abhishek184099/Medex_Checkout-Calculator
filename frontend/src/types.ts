export interface Service {
  id: string;
  name: string;
  type: string;
  providerId: string;
  price: string;
}

export interface QuoteLine {
  serviceId: string;
  quantity: number;
  amount: string;
  discounts: Record<string, string>;
  amountAfterDiscounts: string;
}

export type CouponResult =
  | { code: string; status: "applied"; discount: string }
  | { code: string; status: "rejected"; reason: string };

export interface Quote {
  lines: QuoteLine[];
  coupons: CouponResult[];
  subtotal: string;
  discountTotal: string;
  netAmount: string;
  vat: string;
  total: string;
}

export interface CartLine {
  serviceId: string;
  quantity: number;
}

export interface CheckoutBody {
  lines: CartLine[];
  couponCodes: string[];
  customerId: string | null;
  expectedCouponCodes?: string[];
}

export interface OrderResponse {
  orderId: string;
  quote: Quote;
}

export const MAX_QUANTITY = 20;