// Casper block-explorer links. The MVP settles on `casper-test`, so default to
// the testnet explorer; flip via NEXT_PUBLIC_CASPER_NETWORK when we go mainnet.
const NETWORK = process.env.NEXT_PUBLIC_CASPER_NETWORK ?? "casper-test";

const EXPLORER_BASE =
  NETWORK === "casper"
    ? "https://cspr.live"
    : "https://testnet.cspr.live";

/** Explorer URL for a settled deploy (transfer_with_authorization) hash. */
export function deployUrl(deployHash: string): string {
  return `${EXPLORER_BASE}/deploy/${deployHash}`;
}

/** Explorer URL for an account (by account hash or public key). */
export function accountUrl(accountHashOrKey: string): string {
  return `${EXPLORER_BASE}/account/${accountHashOrKey}`;
}

/** Explorer URL for a contract package (accepts a `hash-`-prefixed or bare hash). */
export function contractUrl(packageHash: string): string {
  return `${EXPLORER_BASE}/contract-package/${packageHash.replace(/^hash-/, "")}`;
}

/** The active Casper network id (e.g. "casper-test"). */
export const CASPER_NETWORK = NETWORK;

/** Truncate a long hash for display, keeping head + tail. */
export function shortHash(hash: string, head = 8, tail = 6): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}
