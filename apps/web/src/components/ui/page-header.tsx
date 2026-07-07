/** Page title + optional subtitle for console routes. */
export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {sub ? <p className="mt-1 text-sm text-text-muted">{sub}</p> : null}
    </header>
  );
}
