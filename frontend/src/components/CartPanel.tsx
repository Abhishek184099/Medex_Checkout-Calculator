import { MAX_QUANTITY, type CartLine, type Quote, type Service } from "../types";

interface Props {
  services: Service[];
  cart: CartLine[];
  quote: Quote | null;
  onChangeQuantity: (serviceId: string, quantity: number) => void;
  onRemove: (serviceId: string) => void;
}

const stepButton =
  "flex size-11 items-center justify-center rounded-lg border border-slate-300 text-lg font-medium active:bg-slate-100 disabled:opacity-40";

export function CartPanel({ services, cart, quote, onChangeQuantity, onRemove }: Props) {
  if (cart.length === 0) {
    return <p className="text-sm text-slate-500">Your cart is empty.</p>;
  }

  return (
    <ul className="space-y-3">
      {cart.map((line) => {
        const service = services.find((s) => s.id === line.serviceId);
        const quoteLine = quote?.lines.find((l) => l.serviceId === line.serviceId);

        return (
          <li key={line.serviceId} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 wrap-break-word font-medium">
                {service?.name ?? line.serviceId}
              </p>
              <button
                onClick={() => onRemove(line.serviceId)}
                className="min-h-11 shrink-0 px-2 text-sm text-red-700"
              >
                Remove
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2" role="group" aria-label="Quantity">
                <button
                  aria-label="Decrease quantity"
                  className={stepButton}
                  disabled={line.quantity <= 1}
                  onClick={() => onChangeQuantity(line.serviceId, line.quantity - 1)}
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{line.quantity}</span>
                <button
                  aria-label="Increase quantity"
                  className={stepButton}
                  disabled={line.quantity >= MAX_QUANTITY}
                  onClick={() => onChangeQuantity(line.serviceId, line.quantity + 1)}
                >
                  +
                </button>
              </div>

              {quoteLine && <span className="font-medium">฿{quoteLine.amount}</span>}
            </div>

            {quoteLine && (
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-sm">
                {Object.entries(quoteLine.discounts).map(([code, value]) => (
                  <div key={code} className="flex justify-between gap-2 text-slate-500">
                    <span>{code}</span>
                    <span>−฿{value}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-2 font-semibold">
                  <span>After discounts</span>
                  <span>฿{quoteLine.amountAfterDiscounts}</span>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}