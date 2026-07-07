"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal shape of the CSPR.click client global we depend on. The full SDK is
// loaded from the CDN at runtime; we only touch the documented surface.
interface CsprClickAccount {
  public_key: string;
}
interface CsprClickGlobal {
  signIn: () => void;
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

// The hidden element CSPR.click renders its (unused) top bar into. Must exist
// in the DOM before the CDN script initializes.
export const CSPR_CLICK_UI_CONTAINER_ID = "csprclick-ui";

// CSPR.click appId — configurable per environment. Defaults to the public
// `csprclick-template` app, which functions on testnet; set
// NEXT_PUBLIC_CSPR_CLICK_APP_ID to the Hermes production appId from the
// CSPR.click dashboard when provisioned.
const CSPR_CLICK_APP_ID = process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID ?? "csprclick-template";
// Network the wallet flow targets (casper-test | casper). Drives which chain
// CSPR.click surfaces to the connected wallet.
const CSPR_CLICK_NETWORK = process.env.NEXT_PUBLIC_CASPER_NETWORK ?? "casper-test";
const CSPR_CLICK_CDN = "https://cdn.cspr.click/ui/v2.0.0/csprclick-client-2.0.0.js";

/**
 * Wallet connect via CSPR.click (wallet-flow doc, human-operator path A).
 * Injects the CDN client, wires the signed-in event to `onConnected`, and
 * exposes a `connect()` that opens the wallet selector. When the SDK never
 * becomes available (offline / blocked / demo), `connect()` degrades to the
 * demo entry so the landing → dashboard flow always works.
 */
export function useCsprClick(onConnected: (publicKey: string) => void) {
  const [ready, setReady] = useState(false);
  const onConnectedRef = useRef(onConnected);

  useEffect(() => {
    onConnectedRef.current = onConnected;
  }, [onConnected]);

  useEffect(() => {
    const scriptId = "csprclick-script";

    // SDK + UI options must both be set before the CDN script loads, or the
    // client aborts initialization (references clickUIOptions during boot).
    // Fields per CsprClickInitOptions (docs.cspr.click/reference/types): chainName
    // selects Mainnet vs Testnet; contentMode "iframe" keeps sign-in in-app.
    window.clickSDKOptions = {
      appName: "Hermes",
      appId: CSPR_CLICK_APP_ID,
      contentMode: "iframe",
      chainName: CSPR_CLICK_NETWORK,
      providers: ["casper-wallet", "ledger", "metamask-snap"],
    };
    window.clickUIOptions = {
      uiContainer: CSPR_CLICK_UI_CONTAINER_ID,
      rootAppElement: "#hermes-hero",
      defaultTheme: "light",
    };

    const onSignedIn = (evt: { account?: CsprClickAccount }) => {
      if (evt.account?.public_key) onConnectedRef.current(evt.account.public_key);
    };

    const addListeners = () => {
      window.csprclick?.on("csprclick:signed_in", onSignedIn);
      window.csprclick?.on("csprclick:switched_account", onSignedIn);
      setReady(true);
    };

    const onLoaded = () => addListeners();
    window.addEventListener("csprclick:loaded", onLoaded);

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = CSPR_CLICK_CDN;
      script.defer = true;
      document.head.appendChild(script);
    } else if (window.csprclick) {
      addListeners();
    }

    return () => {
      window.removeEventListener("csprclick:loaded", onLoaded);
      window.csprclick?.off("csprclick:signed_in", onSignedIn);
      window.csprclick?.off("csprclick:switched_account", onSignedIn);
    };
  }, []);

  const connect = useCallback(() => {
    if (window.csprclick) {
      window.csprclick.signIn();
    } else {
      // SDK unavailable — fall back to the demo console entry.
      onConnectedRef.current("demo");
    }
  }, []);

  return { connect, ready };
}
