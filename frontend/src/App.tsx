import { useEffect, useState } from "react";
import { ApiError, getQuote, getServices, placeOrder } from "./api";
import { Card } from "./components/Card";
import { ServiceList } from "./components/ServiceList";
import { CartPanel } from "./components/CartPanel";
import { CouponPanel } from "./components/CouponPanel";
import { Totals } from "./components/Totals";
import { MAX_QUANTITY, type CartLine, type CheckoutBody, type Quote, type Service } from "./types";
import "./index.css";

// Matches data/checkout.json. Replace with a real login later.
const CUSTOMERS = [
  { id: "", label: "Guest" },
  { id: "C1", label: "Anong (C1)" },
  { id: "C2", label: "Bishal (C2)" },
  { id: "C3", label: "Chaya (C3)" },
];

function toRequest(cart: CartLine[], codes: string[], customerId: string | null): CheckoutBody {
  return { lines: cart, couponCodes: codes, customerId };
}

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [placing, setPlacing] = useState(false);
  const [confirmRequired, setConfirmRequired] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Load the service list once.
  useEffect(() => {
    getServices()
      .then(setServices)
      .catch((err: Error) => setServicesError(err.message));
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);

    getQuote(toRequest(cart, codes, customerId))
      .then((result) => {
        if (!cancelled) setQuote(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setQuoteError(err.message);
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cart, codes, customerId]);

  function addService(serviceId: string) {
    setCart((current) => {
      const existing = current.find((line) => line.serviceId === serviceId);
      if (!existing) return [...current, { serviceId, quantity: 1 }];
      return current.map((line) =>
        line.serviceId === serviceId
          ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY) }
          : line
      );
    });
    setOrderMessage(null);
  }

  function changeQuantity(serviceId: string, quantity: number) {
    const clamped = Math.min(Math.max(quantity, 1), MAX_QUANTITY);
    setCart((current) =>
      current.map((line) => (line.serviceId === serviceId ? { ...line, quantity: clamped } : line))
    );
  }

  function removeService(serviceId: string) {
    setCart((current) => current.filter((line) => line.serviceId !== serviceId));
  }

  function addCode(raw: string) {
    const code = raw.trim();
    if (code) setCodes((current) => [...current, code]);
  }

  function removeCode(index: number) {
    setCodes((current) => current.filter((_, i) => i !== index));
  }

  async function handlePlaceOrder() {
    if (!quote) return;
    setPlacing(true);
    setOrderMessage(null);

    // Send the codes the customer currently sees as applied. The server refuses the
    // order if any of them stopped applying.
    const expectedCouponCodes = quote.coupons
      .filter((c) => c.status === "applied")
      .map((c) => c.code);

    try {
      const result = await placeOrder({
        ...toRequest(cart, codes, customerId),
        expectedCouponCodes,
      });
      setOrderMessage({
        kind: "success",
        text: `Order ${result.orderId} placed. Total ฿${result.quote.total}.`,
      });
      setConfirmRequired(false);
      setCart([]);
      setCodes([]);
      setQuote(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.quote) {
        // Show the new quote, then ask the customer to confirm it.
        setQuote(err.quote);
        setConfirmRequired(true);
        setOrderMessage({
          kind: "error",
          text: `${err.message} Check the new total, then confirm.`,
        });
      } else {
        setConfirmRequired(false);
        setOrderMessage({ kind: "error", text: (err as Error).message });
      }
    } finally {
      setPlacing(false);
    }
  }

  const canPlaceOrder = cart.length > 0 && quote !== null && !quoteLoading && !quoteError && !placing;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <main className="mx-auto max-w-xl px-4 pb-4 pt-4">
        <h1 className="mb-4 text-2xl font-bold">MedEx Checkout</h1>

        <Card>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Customer</span>
            <select
              value={customerId ?? ""}
              onChange={(e) => setCustomerId(e.target.value || null)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base"
            >
              {CUSTOMERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </Card>

        <Card title="Services">
          {servicesError && <p className="text-red-700">Could not load services: {servicesError}</p>}
          {!servicesError && services.length === 0 && (
            <p className="text-slate-500">Loading services…</p>
          )}
          <ServiceList services={services} onAdd={addService} />
        </Card>

        <Card title="Your cart">
          <CartPanel
            services={services}
            cart={cart}
            quote={quote}
            onChangeQuantity={changeQuantity}
            onRemove={removeService}
          />
        </Card>

        <Card title="Coupons">
          <CouponPanel codes={codes} quote={quote} onAdd={addCode} onRemove={removeCode} />
        </Card>

        <Card title="Summary">
          {quoteLoading && <p className="text-sm text-slate-500">Updating…</p>}
          {quoteError && <p className="text-red-700">Could not calculate: {quoteError}</p>}
          {quote && !quoteError && <Totals quote={quote} />}
          {!quote && cart.length === 0 && (
            <p className="text-sm text-slate-500">Add a service to see your total.</p>
          )}
        </Card>
      </main>

      {/* Sticky footer keeps the order button reachable on a 375 px screen. */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 shadow-lg">
        <div className="mx-auto max-w-xl">
          {orderMessage && (
            <p
              className={`mb-2 text-sm ${
                orderMessage.kind === "success" ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {orderMessage.text}
            </p>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={!canPlaceOrder}
            className="min-h-12 w-full rounded-lg bg-teal-700 font-semibold text-white active:bg-teal-800 disabled:opacity-50"
          >
            {placing
              ? "Placing order…"
              : confirmRequired
                ? "Confirm and place order"
                : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}