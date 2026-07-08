import "server-only";

import {
  DEMO_ASSET,
  DEMO_BUYER_ACCOUNT,
  PolicyDeniedError,
  RequiresHumanApprovalError,
  SettlementError,
  demoRequirementsFor,
  payForOrder,
  tokenAssetId,
} from "@hermes/shared";
import type { PolicyGate, Repo } from "@hermes/shared";
import type { Agent, Listing, Order, Payment, Receipt } from "@hermes/types";
import {
  createAgent,
  createListing,
  createOrder,
  getDeps,
  loadData,
  parkApprovalDemo,
  recordArtifact,
  setOrderStatus,
} from "./data";
import { chainSettlementEnabled, settleOrderOnChain, type ChainSettleResult } from "./x402-real";

const BUYER_AGENT_ID = "00000000-0000-4000-8000-000000000002";
const nowIso = () => new Date().toISOString();

export type PurchaseStatus = "settled" | "awaiting_approval" | "failed";

export interface PurchaseOutcome {
  status: PurchaseStatus;
  orderId: string;
  reason?: string;
  deployHash?: string;
  explorerUrl?: string;
  amount?: string;
}

/**
 * The shared money path: drive an Order through the policy gate and settlement
 * (real on-chain x402 or simulated), returning a structured outcome. Reused by
 * the console server actions, the HTTP agent API, and the autonomous agent — one
 * implementation, one set of guardrails.
 */
export async function executePayment(
  order: Order,
  gateOverride?: PolicyGate,
): Promise<PurchaseOutcome> {
  const data = await loadData();
  const listing = data.listings.find((l) => l.id === order.listingId);
  const seller = data.agents.find((a) => a.id === order.sellerAgentId);
  if (!listing || !seller) throw new Error("listing/seller missing");
  const deps = getDeps();

  await setOrderStatus(order.id, "settling");

  // Chain mode: real HERMES transfer_with_authorization via the x402 facilitator.
  if (chainSettlementEnabled()) {
    const gate = gateOverride ?? deps.policyGate;
    const decision = await gate.evaluate({
      agentId: BUYER_AGENT_ID,
      amount: order.priceAmount,
      payee: seller.casperAccountHash,
      asset: order.asset,
      network: "casper:casper-test",
    });
    if (decision.kind === "requires_human") {
      await setOrderStatus(order.id, "authorized");
      parkApprovalDemo(order.id, decision.reason);
      return { status: "awaiting_approval", orderId: order.id, reason: decision.reason };
    }
    if (decision.kind === "denied") {
      await setOrderStatus(order.id, "failed");
      return { status: "failed", orderId: order.id, reason: decision.reason };
    }
    try {
      const result = await settleOrderOnChain(order, seller.casperAccountHash);
      await recordChainSettlement(deps.repo, order, result);
      const explorerUrl = `https://testnet.cspr.live/deploy/${result.deployHash}`;
      await recordArtifact({
        kind: "settlement",
        label: listing.title,
        deployHash: result.deployHash,
        txHash: result.deployHash,
        contractPackageHash: order.asset ? `hash-${order.asset}` : null,
        amount: result.amount,
        asset: order.asset,
        orderId: order.id,
        simulated: false,
        metadata: {
          scheme: "exact",
          network: "casper:casper-test",
          onChain: true,
          payer: result.payer,
          payee: result.payee,
          nonce: result.nonce,
        },
      });
      return {
        status: "settled",
        orderId: order.id,
        deployHash: result.deployHash,
        explorerUrl,
        amount: result.amount,
      };
    } catch (error) {
      await setOrderStatus(order.id, "failed");
      console.error("chain settlement failed", error);
      await recordArtifact({
        kind: "settlement",
        label: listing.title,
        orderId: order.id,
        asset: order.asset,
        amount: order.priceAmount,
        simulated: false,
        metadata: {
          scheme: "exact",
          network: "casper:casper-test",
          onChain: true,
          status: "failed",
          error: errorMessage(error),
        },
      });
      return { status: "failed", orderId: order.id, reason: errorMessage(error) };
    }
  }

  // Demo mode: simulated signer + facilitator.
  try {
    await payForOrder(order, {
      policyGate: gateOverride ?? deps.policyGate,
      signer: deps.signer,
      facilitator: deps.facilitator,
      repo: deps.repo,
      requirements: demoRequirementsFor(listing, seller.casperAccountHash),
      buyerAccountHash: DEMO_BUYER_ACCOUNT,
      agentKeyRef: "kms://demo-buyer",
    });
    const deployHash = await recordSimulatedSettlement(order.id, listing.title);
    return { status: "settled", orderId: order.id, deployHash, amount: order.priceAmount };
  } catch (error) {
    if (error instanceof RequiresHumanApprovalError) {
      await setOrderStatus(order.id, "authorized");
      parkApprovalDemo(order.id, error.message);
      return { status: "awaiting_approval", orderId: order.id, reason: error.message };
    }
    await setOrderStatus(order.id, "failed");
    if (error instanceof SettlementError) {
      await recordArtifact({
        kind: "settlement",
        label: listing.title,
        orderId: order.id,
        asset: order.asset,
        amount: order.priceAmount,
        simulated: true,
        metadata: { scheme: "exact", onChain: false, status: "failed", error: errorMessage(error) },
      });
      return { status: "failed", orderId: order.id, reason: errorMessage(error) };
    }
    if (error instanceof PolicyDeniedError) {
      return { status: "failed", orderId: order.id, reason: error.message };
    }
    throw error;
  }
}

/** Create an Order from a listing, then run the money path. */
export async function purchaseService(
  listingId: string,
  gateOverride?: PolicyGate,
): Promise<PurchaseOutcome> {
  const order = await createOrder(listingId);
  return executePayment(order, gateOverride);
}

export interface ServiceView {
  listing: Listing;
  seller: Agent | undefined;
  reputation: number;
}

export interface DiscoverFilter {
  capability?: string;
  /** Max price in base units (string). */
  maxPrice?: string;
  /** Minimum reputation on the 0–500 (×100) scale. */
  minReputation?: number;
}

/** Discover active services, optionally filtered by capability / price / reputation. */
export async function discoverServices(filter: DiscoverFilter = {}): Promise<ServiceView[]> {
  const data = await loadData();
  return data.listings
    .filter((l) => l.status === "active")
    .map((listing) => {
      const seller = data.agents.find((a) => a.id === listing.agentId);
      return { listing, seller, reputation: seller ? (data.reputation[seller.id] ?? 0) : 0 };
    })
    .filter((s) => {
      if (filter.capability && !s.listing.capability.includes(filter.capability)) return false;
      if (filter.maxPrice && BigInt(s.listing.priceAmount) > BigInt(filter.maxPrice)) return false;
      if (filter.minReputation && s.reputation < filter.minReputation) return false;
      return true;
    });
}

export interface OrderDetail {
  order: Order;
  listing: Listing | undefined;
  seller: Agent | undefined;
  payment: Payment | undefined;
  receipt: Receipt | undefined;
}

/** Full order view (order + listing + seller + payment + receipt). */
export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const data = await loadData();
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) return null;
  const payment = data.payments.find((p) => p.orderId === order.id);
  return {
    order,
    listing: data.listings.find((l) => l.id === order.listingId),
    seller: data.agents.find((a) => a.id === order.sellerAgentId),
    payment,
    receipt: payment ? data.receipts.find((r) => r.paymentId === payment.id) : undefined,
  };
}

export interface PublishInput {
  /** Existing seller agent id, or omit to register a new agent. */
  agentId?: string;
  agentName?: string;
  title: string;
  capability: string;
  /** Price in base units (9 decimals). */
  priceAmount: string;
  terms?: Record<string, unknown>;
}

/** Publish a service: register a seller agent if needed, then create the listing. */
export async function publishService(
  input: PublishInput,
): Promise<{ agent: Agent | null; listing: Listing }> {
  let agentId = input.agentId;
  let agent: Agent | null = null;
  if (!agentId) {
    if (!input.agentName) throw new Error("agentName or agentId is required");
    agent = await createAgent({ displayName: input.agentName, capabilities: [input.capability] });
    agentId = agent.id;
  }
  const listing = await createListing({
    agentId,
    title: input.title,
    capability: input.capability,
    priceAmount: input.priceAmount,
    asset: tokenAssetId() ?? DEMO_ASSET,
    terms: input.terms,
  });
  return { agent, listing };
}

// ── Settlement persistence helpers ──

async function recordChainSettlement(
  repo: Repo,
  order: Order,
  result: ChainSettleResult,
): Promise<void> {
  const iso = nowIso();
  const payment: Payment = {
    id: crypto.randomUUID(),
    orderId: order.id,
    nonce: result.nonce,
    amount: result.amount,
    payer: result.payer as Payment["payer"],
    payee: result.payee as Payment["payee"],
    asset: order.asset,
    status: "authorized",
    deployHash: null,
    validBefore: iso,
    createdAt: iso,
    updatedAt: iso,
  };
  await repo.createPayment(payment);
  const receipt: Receipt = {
    id: crypto.randomUUID(),
    paymentId: payment.id,
    deployHash: result.deployHash,
    amount: result.amount,
    payer: result.payer as Receipt["payer"],
    payee: result.payee as Receipt["payee"],
    settledAt: iso,
    raw: {
      transaction: result.deployHash,
      network: "casper:casper-test",
      onChain: true,
      scheme: "exact",
      asset: order.asset,
      payer: result.payer,
      payee: result.payee,
      nonce: result.nonce,
      explorer: `https://testnet.cspr.live/deploy/${result.deployHash}`,
    },
    createdAt: iso,
  };
  await repo.markSettled(payment.id, receipt);
}

/** Record a simulated (off-chain) settlement in the artifact ledger; returns deploy hash. */
async function recordSimulatedSettlement(
  orderId: string,
  label: string,
): Promise<string | undefined> {
  const data = await loadData();
  const payment = data.payments.find((p) => p.orderId === orderId);
  const receipt = payment ? data.receipts.find((r) => r.paymentId === payment.id) : undefined;
  if (!receipt) return undefined;
  await recordArtifact({
    kind: "settlement",
    label,
    deployHash: receipt.deployHash,
    txHash: receipt.deployHash,
    amount: receipt.amount,
    asset: payment?.asset ?? null,
    orderId,
    paymentId: payment?.id ?? null,
    simulated: true,
    metadata: { scheme: "exact", network: "casper:casper-test", onChain: false, simulated: true },
  });
  return receipt.deployHash;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
