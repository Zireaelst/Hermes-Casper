import { z } from "zod";
import { Amount, Uuid } from "./common";

/**
 * Hermes MCP tool input schemas. Mirror docs/api/api-specification.md §5 and
 * docs/product/agent-protocol.md. Every external tool call is validated with these.
 */

export const AgentDiscoverInput = z.object({
  capability: z.string().optional(),
  maxPrice: Amount.optional(),
  minReputation: z.number().optional(),
});
export type AgentDiscoverInput = z.infer<typeof AgentDiscoverInput>;

export const OfferRequestInput = z.object({
  listingId: Uuid,
  terms: z.record(z.unknown()),
});
export type OfferRequestInput = z.infer<typeof OfferRequestInput>;

export const OfferRespondInput = z.object({
  negotiationId: Uuid,
  action: z.enum(["counter", "accept", "reject"]),
  terms: z.record(z.unknown()).optional(),
});
export type OfferRespondInput = z.infer<typeof OfferRespondInput>;

export const OrderCreateInput = z.object({
  negotiationId: Uuid,
});
export type OrderCreateInput = z.infer<typeof OrderCreateInput>;

export const ServiceInvokeInput = z.object({
  orderId: Uuid,
  input: z.record(z.unknown()),
});
export type ServiceInvokeInput = z.infer<typeof ServiceInvokeInput>;

export const PaymentPayInput = z.object({
  orderId: Uuid,
});
export type PaymentPayInput = z.infer<typeof PaymentPayInput>;

export const ReputationGetInput = z.object({
  agentId: Uuid,
});
export type ReputationGetInput = z.infer<typeof ReputationGetInput>;

/** Registry of tool name → input schema, for the MCP server + runtime. */
export const toolInputSchemas = {
  agent_discover: AgentDiscoverInput,
  offer_request: OfferRequestInput,
  offer_respond: OfferRespondInput,
  order_create: OrderCreateInput,
  service_invoke: ServiceInvokeInput,
  payment_pay: PaymentPayInput,
  reputation_get: ReputationGetInput,
} as const;

export type ToolName = keyof typeof toolInputSchemas;
