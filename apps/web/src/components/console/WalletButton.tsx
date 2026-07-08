"use client";

import { LogOut, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CSPR_CLICK_UI_CONTAINER_ID,
  clearAccount,
  ensureCsprClickLoaded,
  persistAccount,
  readAccount,
  shortKey,
} from "@/lib/csprclick";
import { cn } from "@/lib/utils";

/**
 * Console wallet control (CSPR.click). Lets users connect their Casper wallet
 * from anywhere in the app — not just the landing page — and reflects the
 * connected account. Falls back gracefully when the SDK is unavailable.
 */
export function WalletButton() {
  const [account, setAccount] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const accountRef = useRef<string | null>(null);

  useEffect(() => {
    ensureCsprClickLoaded("body");

    // Hydrate persisted account after mount (avoids setState-in-effect churn).
    const hydrate = setTimeout(() => {
      const existing = readAccount();
      if (existing) {
        accountRef.current = existing;
        setAccount(existing);
      }
    }, 0);

    const onSignedIn = (evt: { account?: { public_key: string } }) => {
      const pk = evt.account?.public_key;
      if (!pk) return;
      persistAccount(pk);
      accountRef.current = pk;
      setAccount(pk);
    };
    const onSignedOut = () => {
      clearAccount();
      accountRef.current = null;
      setAccount(null);
    };

    const addListeners = () => {
      window.csprclick?.on("csprclick:signed_in", onSignedIn);
      window.csprclick?.on("csprclick:switched_account", onSignedIn);
      window.csprclick?.on("csprclick:signed_out", onSignedOut);
    };
    const onLoaded = () => addListeners();
    window.addEventListener("csprclick:loaded", onLoaded);
    if (window.csprclick) addListeners();

    return () => {
      clearTimeout(hydrate);
      window.removeEventListener("csprclick:loaded", onLoaded);
      window.csprclick?.off("csprclick:signed_in", onSignedIn);
      window.csprclick?.off("csprclick:switched_account", onSignedIn);
      window.csprclick?.off("csprclick:signed_out", onSignedOut);
    };
  }, []);

  const connect = useCallback(() => {
    if (window.csprclick) window.csprclick.signIn();
  }, []);

  const disconnect = useCallback(() => {
    window.csprclick?.signOut?.();
    clearAccount();
    accountRef.current = null;
    setAccount(null);
    setMenuOpen(false);
  }, []);

  if (!account) {
    return (
      <>
        <button
          type="button"
          onClick={connect}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-transform hover:-translate-y-0.5"
        >
          <Wallet className="size-3.5" aria-hidden />
          Connect wallet
        </button>
        <div id={CSPR_CLICK_UI_CONTAINER_ID} className="hidden" />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-hover",
        )}
      >
        <span className="size-1.5 rounded-full bg-success" aria-hidden />
        <span className="font-mono">{shortKey(account)}</span>
      </button>
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-surface-overlay p-2 shadow-pop">
            <div className="px-2 py-1.5">
              <div className="text-xs text-text-subtle">Connected wallet</div>
              <div className="mt-0.5 font-mono text-xs break-all text-text">{account}</div>
            </div>
            <button
              type="button"
              onClick={disconnect}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-danger transition-colors hover:bg-danger/10"
            >
              <LogOut className="size-3.5" aria-hidden />
              Disconnect
            </button>
          </div>
        </>
      )}
      <div id={CSPR_CLICK_UI_CONTAINER_ID} className="hidden" />
    </div>
  );
}
