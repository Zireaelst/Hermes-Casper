"use client";

// Shared CSPR.click client integration used by both the marketing hero and the
// console wallet button, so the CDN client is configured in exactly one place.

interface CsprClickAccount {
  public_key: string;
}
export interface CsprClickGlobal {
  signIn: () => void;
  signOut?: () => void;
  on: (event: string, cb: (evt: { account?: CsprClickAccount }) => void) => void;
  off: (event: string, cb: (evt: { account?: CsprClickAccount }) => void) => void;
}
declare global {
  interface Window {
    csprclick?: CsprClickGlobal;
    clickSDKOptions?: Record<string, unknown>;
    clickUIOptions?: Record<string, unknown>;
  }
}

export const CSPR_CLICK_APP_ID = process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID ?? "csprclick-template";
export const CSPR_CLICK_NETWORK = process.env.NEXT_PUBLIC_CASPER_NETWORK ?? "casper-test";
export const CSPR_CLICK_CDN = "https://cdn.cspr.click/ui/v2.0.0/csprclick-client-2.0.0.js";
export const CSPR_CLICK_UI_CONTAINER_ID = "csprclick-ui";
const STORAGE_KEY = "hermes:wallet";

/** Persisted connected account (public key), shared across landing + console. */
export function readAccount(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
export function persistAccount(publicKey: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, publicKey);
  } catch {
    /* ignore */
  }
}
export function clearAccount(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Inject the CSPR.click CDN client once. SDK + UI options must be set before the
 * script boots, so we always (re)assign them; the script is only appended once.
 */
export function ensureCsprClickLoaded(rootAppElement = "body"): void {
  if (typeof window === "undefined") return;
  window.clickSDKOptions = {
    appName: "Hermes",
    appId: CSPR_CLICK_APP_ID,
    contentMode: "iframe",
    chainName: CSPR_CLICK_NETWORK,
    providers: ["casper-wallet", "ledger", "metamask-snap"],
  };
  window.clickUIOptions = {
    uiContainer: CSPR_CLICK_UI_CONTAINER_ID,
    rootAppElement,
    defaultTheme: "light",
  };
  if (!document.getElementById("csprclick-script")) {
    const script = document.createElement("script");
    script.id = "csprclick-script";
    script.src = CSPR_CLICK_CDN;
    script.defer = true;
    document.head.appendChild(script);
  }
}

/** Short display form of a Casper public key. */
export function shortKey(publicKey: string): string {
  return publicKey.length > 12 ? `${publicKey.slice(0, 6)}…${publicKey.slice(-4)}` : publicKey;
}
