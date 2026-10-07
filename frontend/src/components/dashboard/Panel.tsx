import type { ReactNode } from "react";

export function Panel({ title, code, children, className = "" }: { title: string; code: string; children: ReactNode; className?: string }) {
  return (
    <section className={`instrument-panel ${className}`}>
      <header className="panel-header"><span>{title}</span><code>{code}</code></header>
      {children}
    </section>
  );
}