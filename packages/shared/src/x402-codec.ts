import {
  PaymentPayload,
  PaymentRequirements,
  SettleResult,
  type Authorization,
} from "@hermes/types";
import { ValidationError } from "./errors";

/**
 * x402 header codecs. Headers carry base64-encoded JSON:
 *   402 → PAYMENT-REQUIRED   (PaymentRequirements)
 *   retry → PAYMENT-SIGNATURE (PaymentPayload)
 *   200 → PAYMENT-RESPONSE   (SettleResult)
 * See docs/architecture/22-x402-flow.md.
 */

export const HEADER_PAYMENT_REQUIRED = "PAYMENT-REQUIRED";
export const HEADER_PAYMENT_SIGNATURE = "PAYMENT-SIGNATURE";
export const HEADER_PAYMENT_RESPONSE = "PAYMENT-RESPONSE";

function decodeB64Json(headerName: string, value: string): unknown {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch (cause) {
    throw new ValidationError(`malformed ${headerName} header`, { cause });
  }
}

function encodeB64Json(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

export function decodePaymentRequired(headerValue: string): PaymentRequirements {
  const parsed = PaymentRequirements.safeParse(
    decodeB64Json(HEADER_PAYMENT_REQUIRED, headerValue),
  );
  if (!parsed.success) {
    throw new ValidationError("invalid PaymentRequirements", parsed.error.flatten());
  }
  return parsed.data;
}

export function encodePaymentSignature(payload: PaymentPayload): string {
  return encodeB64Json(PaymentPayload.parse(payload));
}

export function decodePaymentResponse(headerValue: string): SettleResult {
  const parsed = SettleResult.safeParse(decodeB64Json(HEADER_PAYMENT_RESPONSE, headerValue));
  if (!parsed.success) {
    throw new ValidationError("invalid SettleResult", parsed.error.flatten());
  }
  return parsed.data;
}

/** Server-side helpers (for our paid endpoints). */
export function encodePaymentRequired(requirements: PaymentRequirements): string {
  return encodeB64Json(PaymentRequirements.parse(requirements));
}
export function decodePaymentSignature(headerValue: string): PaymentPayload {
  const parsed = PaymentPayload.safeParse(decodeB64Json(HEADER_PAYMENT_SIGNATURE, headerValue));
  if (!parsed.success) {
    throw new ValidationError("invalid PaymentPayload", parsed.error.flatten());
  }
  return parsed.data;
}
export function encodePaymentResponse(result: SettleResult): string {
  return encodeB64Json(SettleResult.parse(result));
}

/**
 * Build an x402 authorization for a payment requirement. The nonce doubles as
 * the off-chain idempotency key (payments.nonce UNIQUE).
 */
export function buildAuthorization(params: {
  from: string;
  requirements: PaymentRequirements;
  nowSeconds?: number;
  nonce?: string;
}): Authorization {
  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  const nonce = params.nonce ?? randomNonce();
  return {
    from: params.from as Authorization["from"],
    to: params.requirements.payTo,
    value: params.requirements.amount,
    validAfter: String(now - 10), // small clock-skew allowance
    validBefore: String(now + params.requirements.maxTimeoutSeconds),
    nonce: nonce as Authorization["nonce"],
  };
}

export function randomNonce(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
