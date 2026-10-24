import type { ReactNode } from "react";

interface Props {
  title?: string;
  children: ReactNode;
}

export function Card({ title, children }: Props) {
  return (
    <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}