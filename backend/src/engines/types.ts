export type Scope =
  | { kind: "all" }
  | { kind: "serviceType" | "providerId"; value: string };

export interface EngineService {
  id: string;
  type: string;
  providerId: string;
  priceSatang: number;
}


export interface EngineCoupon {
  code: string;
  status: string;
  kind: "percent" | "fixed";
  value: number;               
  maxDiscountSatang: number | null;
  scope: Scope;
  minSpendSatang: number;
  startsOn: string | null;    
  endsOn: string | null;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  firstOrderOnly: boolean;
  stackable: boolean;
}

export interface EngineCustomer {
  id: string;
  ordersCount: number;
  priorUsage: Record<string, number>;   
}


export interface QuoteInput {
  lines: { service: EngineService; quantity: number }[];
  couponCodes: string[];
  coupons: Map<string, EngineCoupon>; 
  customer: EngineCustomer | null;    
  today: string;                      
}


export interface QuoteLine {
  serviceId: string;
  quantity: number;
  amount: number;
  discounts: Record<string, number>;
  amountAfterDiscounts: number;
}

export type CouponResult =
  | { code: string; status: "applied"; discount: number }
  | { code: string; status: "rejected"; reason: string };

export interface QuoteResult {
  lines: QuoteLine[];
  coupons: CouponResult[];
  subtotal: number;
  discountTotal: number;
  netAmount: number;
  vat: number;
  total: number;
}


