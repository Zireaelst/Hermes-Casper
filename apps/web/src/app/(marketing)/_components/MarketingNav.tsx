"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Agents", href: "/dashboard" },
  { label: "Workflows", href: "/dashboard" },
  { label: "Orders", href: "/orders" },
];

export function MarketingNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-10 flex flex-row items-center justify-between bg-transparent px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/" className="flex flex-row items-center gap-3">
          <span className="text-[21px] font-medium tracking-tight text-text-strong select-none sm:text-[26px]">
            Hermes&reg;
          </span>
          <span className="mb-1 text-[25px] leading-none font-medium tracking-[-0.02em] text-text-strong select-none sm:text-[30px]">
            &#10033;
          </span>
        </Link>

        <nav className="hidden flex-row text-[23px] text-text-strong md:flex">
          {NAV_LINKS.map((link, i) => (
            <span key={link.label} className="flex flex-row">
              <Link href={link.href} className="transition-opacity hover:opacity-60">
                {link.label}
              </Link>
              {i < NAV_LINKS.length - 1 && (
                <span className="opacity-40">,&nbsp;</span>
              )}
            </span>
          ))}
        </nav>

        <Link
          href="/dashboard"
          className="hidden text-[23px] text-text-strong underline underline-offset-2 transition-opacity hover:opacity-60 md:block"
        >
          Enter app
        </Link>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className="flex flex-col gap-[5px] md:hidden"
        >
          <span
            className={`h-[2px] w-6 bg-text-strong transition-all duration-300 ${isMobileMenuOpen ? "translate-y-[7px] rotate-45" : ""}`}
          />
          <span
            className={`h-[2px] w-6 bg-text-strong transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`h-[2px] w-6 bg-text-strong transition-all duration-300 ${isMobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
          />
        </button>
      </header>

      <div
        className={`fixed inset-0 z-[9] flex flex-col items-center justify-center gap-8 bg-surface/95 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-3xl font-medium text-text-strong"
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/dashboard"
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-3xl font-medium text-text-strong underline underline-offset-4"
        >
          Enter app
        </Link>
      </div>
    </>
  );
}
