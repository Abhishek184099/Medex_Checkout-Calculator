import type { CheckoutBody, OrderResponse, Quote, Service } from "./types";

const API = "/api";

export class ApiError extends Error {
  constructor(message: string,  readonly status: number,   readonly quote?: Quote) {
    super(message);
    this.name = "ApiError";
    
    
  }
}

async function send<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(API + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status, data.quote);
  }
  return data as T;
}

export async function getServices(): Promise<Service[]> {
  const data = await send<{ services: Service[] }>("GET", "/services");
  return data.services;
}

export function getQuote(body: CheckoutBody): Promise<Quote> {
  return send<Quote>("POST", "/quote", body);
}

export function placeOrder(body: CheckoutBody): Promise<OrderResponse> {
  return send<OrderResponse>("POST", "/orders", body);
}