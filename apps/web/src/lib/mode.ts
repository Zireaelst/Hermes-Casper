import { chainSettlementEnabled, facilitatorHealthy } from "./x402-real";
import { supabaseEnabled } from "./supabase";

export type SettlementStatus = "on-chain" | "facilitator-offline" | "simulated";

export interface RuntimeMode {
  /** Real on-chain settlement is configured AND the facilitator is reachable. */
  onChain: boolean;
  /** Chain settlement env is present (facilitator + token + buyer key). */
  chainConfigured: boolean;
  /** Whether the facilitator responded to a health probe. */
  facilitatorOnline: boolean;
  status: SettlementStatus;
  /** Human label for the settlement path. */
  settlement: string;
  /** Where marketplace/order data is read from. */
  dataSource: string;
  /** Casper network the app is pointed at. */
  network: string;
}

// Short-lived cache so we don't probe the facilitator on every console navigation.
let cache: { value: RuntimeMode; at: number } | null = null;
const TTL_MS = 15_000;

/**
 * Resolves how the running app is configured (server-only). Drives the live
 * status chips so what the demo shows matches reality — on-chain vs simulated,
 * and whether the facilitator is actually reachable (not just configured).
 */
export async function getRuntimeMode(): Promise<RuntimeMode> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const chainConfigured = chainSettlementEnabled();
  const facilitatorOnline = chainConfigured ? await facilitatorHealthy() : false;

  const status: SettlementStatus = !chainConfigured
    ? "simulated"
    : facilitatorOnline
      ? "on-chain"
      : "facilitator-offline";

  const value: RuntimeMode = {
    onChain: status === "on-chain",
    chainConfigured,
    facilitatorOnline,
    status,
    settlement:
      status === "on-chain"
        ? "On-chain settlement"
        : status === "facilitator-offline"
          ? "Facilitator offline"
          : "Simulated settlement",
    dataSource: supabaseEnabled() ? "Supabase" : "In-memory demo",
    network: (process.env.NEXT_PUBLIC_CASPER_NETWORK ?? "casper-test").replace("casper:", ""),
  };

  cache = { value, at: Date.now() };
  return value;
}
