import { z } from "zod";
import { AccountHash, Amount, Nonce, PublicKey, Timestamp, Uuid } from "./common.js";

/**
 * Domain entities. Shapes mirror the DDL in docs/product/database-schema.md.
 * Canonical vocabulary: .claude/context/glossary.md — do not introduce synonyms.
 */

// ── Status enums ────────────────────────────────────────────────────────────
export const AgentKind = z.enum(["operator_owned", "external"]);
export const ListingStatus = z.enum(["draft", "active", "paused", "retired"]);
export const NegotiationStatus = z.enum(["open", "accepted", "rejected", "expired"]);
export const OfferStatus = z.enum([
  "proposed",
  "countered",
  "accepted",
  "rejected",
  "withdrawn",
]);
export const OrderStatus = z.enum([
  "quoted",
  "authorized",
  "settling",
  "settled",
  "failed",
  "cancelled",
]);
export const PaymentStatus = z.enum([
  "authorized",
  "verifying",
  "settling",
  "settled",
  "failed",
  "expired",
]);
export const ReputationKind = z.enum(["completed", "failed", "disputed"]);

export type OrderStatus = z.infer<typeof OrderStatus>;
export type PaymentStatus = z.infer<typeof PaymentStatus>;

// ── Entities ────────────────────────────────────────────────────────────────
export const Agent = z.object({
  id: Uuid,
  ownerUserId: Uuid.nullable(),
  kind: AgentKind,
  casperAccountHash: AccountHash,
  publicKey: PublicKey,
  displayName: z.string().min(1),
  capabilities: z.array(z.string()),
  metadataUri: z.string().url().nullable(),
  status: z.string(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type Agent = z.infer<typeof Agent>;

export const Listing = z.object({
  id: Uuid,
  agentId: Uuid,
  title: z.string().min(1),
  capability: z.string().min(1),
  priceAmount: Amount,
  asset: z.string().min(1),
  terms: z.record(z.unknown()),
  status: ListingStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type Listing = z.infer<typeof Listing>;

export const Offer = z.object({
  id: Uuid,
  negotiationId: Uuid,
  fromAgentId: Uuid,
  priceAmount: Amount,
  terms: z.record(z.unknown()),
  status: OfferStatus,
  round: z.number().int().nonnegative(),
  createdAt: Timestamp,
});
export type Offer = z.infer<typeof Offer>;

export const Negotiation = z.object({
  id: Uuid,
  buyerAgentId: Uuid,
  sellerAgentId: Uuid,
  listingId: Uuid.nullable(),
  status: NegotiationStatus,
  maxRounds: z.number().int().positive(),
  round: z.number().int().nonnegative(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type Negotiation = z.infer<typeof Negotiation>;

export const Order = z.object({
  id: Uuid,
  negotiationId: Uuid.nullable(),
  buyerAgentId: Uuid,
  sellerAgentId: Uuid,
  listingId: Uuid.nullable(),
  priceAmount: Amount,
  asset: z.string().min(1),
  status: OrderStatus,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type Order = z.infer<typeof Order>;

export const Payment = z.object({
  id: Uuid,
  orderId: Uuid,
  nonce: Nonce,
  amount: Amount,
  payer: AccountHash,
  payee: AccountHash,
  asset: z.string().min(1),
  status: PaymentStatus,
  deployHash: z.string().nullable(),
  validBefore: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type Payment = z.infer<typeof Payment>;

export const Receipt = z.object({
  id: Uuid,
  paymentId: Uuid,
  deployHash: z.string().min(1),
  amount: Amount,
  payer: AccountHash,
  payee: AccountHash,
  settledAt: Timestamp,
  raw: z.record(z.unknown()),
  createdAt: Timestamp,
});
export type Receipt = z.infer<typeof Receipt>;

// ── Spend policy (gates every autonomous payment) ───────────────────────────
export const SpendPolicy = z.object({
  id: Uuid,
  agentId: Uuid,
  dailyBudget: Amount,
  autoApproveLimit: Amount,
  allowlist: z.object({
    payees: z.array(AccountHash).default([]),
    assets: z.array(z.string()).default([]),
    endpoints: z.array(z.string()).default([]),
  }),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type SpendPolicy = z.infer<typeof SpendPolicy>;
