// Marketing surface — light-first design system (design-system.md §2).
// `theme-light` scopes the light token values to this subtree; the dark console
// keeps the root palette. Inter is applied via --font-sans inside .theme-light.
export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="theme-light relative flex min-h-screen flex-col overflow-x-hidden bg-surface font-sans text-text antialiased lg:block">
      {children}
    </div>
  );
}
