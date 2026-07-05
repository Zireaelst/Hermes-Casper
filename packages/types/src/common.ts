import { z } from "zod";

/** UUID primary key (Supabase rows). */
export const Uuid = z.string().uuid();
export type Uuid = z.infer<typeof Uuid>;

/**
 * Casper account hash as used by the x402 flow: `00`/`01` algo prefix + 64 hex chars = 66 chars.
 * See docs/research/casper-x402.md.
 */
export const AccountHash = z
  .string()
  .regex(/^0[01][0-9a-fA-F]{64}$/, "expected a 66-char Casper account hash");
export type AccountHash = z.infer<typeof AccountHash>;

/** Casper public key: algorithm-prefixed hex (`01` ed25519 / `02` secp256k1). */
export const PublicKey = z
  .string()
  .regex(/^0[12][0-9a-fA-F]+$/, "expected an algorithm-prefixed Casper public key");
export type PublicKey = z.infer<typeof PublicKey>;

/**
 * A token amount in **base units** as a decimal integer string (no floats, ever).
 * CEP-18 HERMES uses 9 decimals — e.g. "7500000000" = 7.5 HERMES.
 */
export const Amount = z.string().regex(/^\d+$/, "expected a base-unit integer string");
export type Amount = z.infer<typeof Amount>;

/** CAIP-2 network identifiers for Casper. */
export const Caip2 = z.enum(["casper:casper", "casper:casper-test", "casper:casper-net-1"]);
export type Caip2 = z.infer<typeof Caip2>;

/** 32-byte hex nonce (single-use; x402 replay protection + off-chain idempotency key). */
export const Nonce = z.string().regex(/^[0-9a-fA-F]{64}$/, "expected a 32-byte hex nonce");
export type Nonce = z.infer<typeof Nonce>;

/** ISO-8601 timestamp. */
export const Timestamp = z.string().datetime();

/** Fields present on every persisted row. */
export const Timestamps = z.object({
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
