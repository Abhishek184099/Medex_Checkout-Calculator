import { useState, type KeyboardEvent } from "react";
import type { Quote } from "../types";

interface Props {
  codes: string[];
  quote: Quote | null;
  onAdd: (code: string) => void;
  onRemove: (index: number) => void;
}

export function CouponPanel({ codes, quote, onAdd, onRemove }: Props) {
  const [input, setInput] = useState("");

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    onAdd(input);
    setInput("");
  }

  const quoteIsCurrent = quote !== null && quote.coupons.length === codes.length;

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Coupon code, then press Enter"
        autoCapitalize="characters"
        autoComplete="off"
        enterKeyHint="done"
        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-teal-600 focus:outline-none"
      />

      <ul className="mt-3 space-y-2">
        {codes.map((code, index) => {
          const result = quoteIsCurrent ? quote!.coupons[index] : undefined;
          const label = result?.code ?? code;

          const background =
            result?.status === "applied"
              ? "bg-emerald-50"
              : result?.status === "rejected"
                ? "bg-red-50"
                : "bg-slate-100";

          return (
            <li key={`${code}-${index}`} className={`rounded-lg px-3 py-2 ${background}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{label}</span>
                <div className="flex items-center gap-2">
                  {result?.status === "applied" && (
                    <span className="text-sm text-emerald-700">−฿{result.discount}</span>
                  )}
                  <button
                    aria-label={`Remove ${label}`}
                    onClick={() => onRemove(index)}
                    className="flex size-11 items-center justify-center rounded-full text-xl text-slate-600"
                  >
                    ×
                  </button>
                </div>
              </div>

              {result?.status === "rejected" && (
                <p className="mt-1 text-sm text-red-700">{result.reason}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}