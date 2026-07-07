import { chainSettlementEnabled } from "./x402-real";
import { supabaseEnabled } from "./supabase";

export interface RuntimeMode {
  /** True when real on-chain settlement (facilitator + token + buyer key) is wired. */
  onChain: boolean;
  /** Human label for the settlement path. */
  settlement: string;
  /** Where marketplace/order data is read from. */
  dataSource: string;
  /** Casper network the app is pointed at. */
  network: string;
}

/**
 * Resolves how the running app is configured (server-only). Drives the live
 * status chips in the console shell so what the demo shows matches reality —
 * on-chain vs simulated settlement, Supabase vs in-memory data.
 */
export function getRuntimeMode(): RuntimeMode {
  const onChain = chainSettlementEnabled();
  return {
    onChain,
    settlement: onChain ? "On-chain settlement" : "Simulated settlement",
    dataSource: supabaseEnabled() ? "Supabase" : "In-memory demo",
    network: (process.env.NEXT_PUBLIC_CASPER_NETWORK ?? "casper-test").replace("casper:", ""),
  };
}
