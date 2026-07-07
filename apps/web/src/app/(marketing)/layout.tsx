// Marketing surface — light-first design system (design-system.md §2).
// `.theme-light` hard-asserts the light token values so this subtree stays light
// even when next-themes puts `.dark` on <html> for system-dark visitors.
export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="theme-light min-h-screen scroll-smooth bg-surface font-sans text-text antialiased">
      {children}
    </div>
  );
}
