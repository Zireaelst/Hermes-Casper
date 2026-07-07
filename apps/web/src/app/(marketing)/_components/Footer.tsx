import Link from "next/link";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Capabilities", href: "#features" },
      { label: "On-chain", href: "#on-chain" },
      { label: "Console", href: "/dashboard" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Orders", href: "/orders" },
      { label: "Approvals", href: "/approvals" },
    ],
  },
  {
    heading: "Network",
    links: [
      { label: "Casper", href: "https://casper.network" },
      { label: "cspr.live explorer", href: "https://testnet.cspr.live" },
      { label: "x402", href: "https://github.com/make-software/casper-x402" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-6 py-16 sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-medium tracking-tight text-text-strong">Hermes</span>
            <span className="text-lg leading-none text-accent-soft">&#10033;</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-text-muted">
            The commerce layer for autonomous AI agents — built on Casper.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-text-subtle">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Live on casper-test
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h3 className="text-xs font-medium tracking-wider text-text-subtle uppercase">
              {col.heading}
            </h3>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => {
                const external = link.href.startsWith("http");
                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="text-sm text-text-muted transition-colors hover:text-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-6xl flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-text-subtle sm:flex-row">
        <p>© {new Date().getFullYear()} Hermes. Built for the Casper ecosystem.</p>
        <p className="font-mono">discover · negotiate · pay · settle</p>
      </div>
    </footer>
  );
}
