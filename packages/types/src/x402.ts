import { z } from "zod";
import { AccountHash, Amount, Caip2, Nonce, PublicKey } from "./common";

/**
 * x402 wire shapes for Casper. Verbatim from docs/research/casper-x402.md and
 * docs/architecture/22-x402-flow.md. Only the `exact` scheme is implemented.
 * Do NOT invent fields — these mirror @make-software/casper-x402.
 */

export const Scheme = z.literal("exact");

/** EIP-712 authorized transfer over CEP-18 `transfer_with_authorization`. */
export const Authorization = z.object({
  from: AccountHash,
  to: AccountHash,
  value: Amount,
  validAfter: z.string().regex(/^\d+$/), // unix seconds
  validBefore: z.string().regex(/^\d+$/),
  nonce: Nonce,
});
export type Authorization = z.infer<typeof Authorization>;

/** Returned on the 402 (base64 JSON of the `PAYMENT-REQUIRED` header). */
export const PaymentRequirements = z.object({
  scheme: Scheme,
  network: Caip2,
  payTo: AccountHash,
  amount: Amount,
  asset: z.string().regex(/^[0-9a-fA-F]{64}$/, "expected a 64-hex CEP-18 package hash"),
  extra: z.object({
    name: z.string().min(1),
    version: z.string().min(1),
    decimals: z.string().regex(/^\d+$/),
  }),
  maxTimeoutSeconds: z.number().int().positive(),
});
export type PaymentRequirements = z.infer<typeof PaymentRequirements>;

/** Sent by the client on retry (base64 JSON of the `PAYMENT-SIGNATURE` header). */
export const PaymentPayload = z.object({
  x402Version: z.literal(2),
  scheme: Scheme,
  network: Caip2,
  payload: z.object({
    signature: z.string().regex(/^[0-9a-fA-F]{130}$/, "expected a 65-byte hex signature"),
    publicKey: PublicKey,
    authorization: Authorization,
  }),
});
export type PaymentPayload = z.infer<typeof PaymentPayload>;

/** Facilitator `/verify` result. */
export const VerifyResult = z.object({
  isValid: z.boolean(),
  payer: AccountHash.optional(),
  invalidReason: z.string().optional(),
  invalidMessage: z.string().optional(),
});
export type VerifyResult = z.infer<typeof VerifyResult>;

/** Facilitator `/settle` result (base64 JSON of the `PAYMENT-RESPONSE` header on success). */
export const SettleResult = z.object({
  success: z.boolean(),
  transaction: z.string(), // Casper deploy hash ("" on failure)
  network: Caip2,
  payer: AccountHash.optional(),
  errorReason: z.string().optional(),
  errorMessage: z.string().optional(),
});
export type SettleResult = z.infer<typeof SettleResult>;
