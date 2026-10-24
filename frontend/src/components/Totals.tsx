import type { Quote } from "../types";

interface Props {
  quote: Quote;
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between gap-4 ${className}`}>
      <dt className="text-slate-600">{label}</dt>
      <dd className="whitespace-nowrap font-medium">{value}</dd>
    </div>
  );
}

export function Totals({ quote }: Props) {
  return (
    <dl className="space-y-2">
      <Row label="Subtotal" value={`฿${quote.subtotal}`} />
      <Row label="Discounts" value={`−฿${quote.discountTotal}`} />
      <Row label="Net" value={`฿${quote.netAmount}`} />
      <Row label="VAT (7%)" value={`฿${quote.vat}`} />
      <Row label="Total" value={`฿${quote.total}`} className="border-t border-slate-200 pt-3 text-lg font-bold" />
    </dl>
  );
}