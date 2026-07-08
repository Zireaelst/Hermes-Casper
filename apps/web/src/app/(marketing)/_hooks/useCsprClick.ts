"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CSPR_CLICK_UI_CONTAINER_ID,
  ensureCsprClickLoaded,
  persistAccount,
} from "@/lib/csprclick";

export { CSPR_CLICK_UI_CONTAINER_ID };

/**
 * Wallet connect via CSPR.click (wallet-flow doc, human-operator path A).
 * Loads the shared CDN client, wires the signed-in event to `onConnected` (and
 * persists the account so the console reflects it), and exposes a `connect()`
 * that opens the wallet selector. When the SDK never becomes available (offline
 * / blocked / demo), `connect()` degrades to the demo entry so the landing →
 * dashboard flow always works.
 */
export function useCsprClick(onConnected: (publicKey: string) => void) {
  const [ready, setReady] = useState(false);
  const onConnectedRef = useRef(onConnected);

  useEffect(() => {
    onConnectedRef.current = onConnected;
  }, [onConnected]);

  useEffect(() => {
    ensureCsprClickLoaded("#hermes-hero");

    const onSignedIn = (evt: { account?: { public_key: string } }) => {
      if (evt.account?.public_key) {
        persistAccount(evt.account.public_key);
        onConnectedRef.current(evt.account.public_key);
      }
    };

    const addListeners = () => {
      window.csprclick?.on("csprclick:signed_in", onSignedIn);
      window.csprclick?.on("csprclick:switched_account", onSignedIn);
      setReady(true);
    };

    const onLoaded = () => addListeners();
    window.addEventListener("csprclick:loaded", onLoaded);
    if (window.csprclick) addListeners();

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
      onConnectedRef.current("demo");
    }
  }, []);

  return { connect, ready };
}
