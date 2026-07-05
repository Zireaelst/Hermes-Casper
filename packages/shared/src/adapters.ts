import type {
  AccountHash,
  Amount,
  Authorization,
  Caip2,
  Order,
  Payment,
  PaymentPayload,
  PaymentRequirements,
  Receipt,
  SettleResult,
  VerifyResult,
} from "@hermes/types";
import type { Result } from "./result.js";
import type { SettlementError } from "./errors.js";

/**
 * Edge adapter interfaces (hexagonal boundaries). Implementations live in the
 * relevant service/package and are wired at the edges — domain logic depends only
 * on these interfaces. See docs/architecture/02-backend.md.
 */

/** Reads/writes against the Casper chain (behind casper-js-sdk / CSPR.cloud). */
export interface CasperAdapter {
  getDeployStatus(deployHash: string): Promise<"pending" | "success" | "failed" | "unknown">;
  getTokenBalance(account: AccountHash, assetPackageHash: string): Promise<Amount>;
}

/** Builds/parses x402 headers on the client side. */
export interface X402Client {
  parsePaymentRequired(headerB64: string): PaymentRequirements;
  buildPaymentSignature(payload: PaymentPayload): string; // base64 for PAYMENT-SIGNATURE
}

/** Talks to the x402 facilitator (/verify, /settle). */
export interface FacilitatorClient {
  verify(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<VerifyResult>;
  settle(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<Result<SettleResult, SettlementError>>;
}

/** Requests a policy-approved signature; NEVER returns raw keys (ADR-003). */
export interface SignerClient {
  signAuthorization(agentKeyRef: string, authorization: Authorization): Promise<{
    signature: string;
    publicKey: string;
  }>;
}

/** Outcome of evaluating a spend against policy. */
export type PolicyDecision =
  | { kind: "approved" }
  | { kind: "denied"; reason: string }
  | { kind: "requires_human"; reason: string };

export interface SpendRequest {
  agentId: string;
  amount: Amount;
  payee: AccountHash;
  asset: string;
  network: Caip2;
}

/** Budget + allowlist + threshold gate on every spend (docs/architecture/20-payment-flow.md). */
export interface PolicyGate {
  evaluate(request: SpendRequest): Promise<PolicyDecision>;
}

/** Typed persistence over the Supabase mirror (one method set per aggregate as needed). */
export interface Repo {
  getOrder(id: string): Promise<Order | null>;
  createPayment(payment: Payment): Promise<Payment>;
  markSettled(paymentId: string, receipt: Receipt): Promise<void>;
}
