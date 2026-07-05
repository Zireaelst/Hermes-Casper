import {
  BasicPolicyGate,
  DemoFacilitator,
  DemoRepo,
  DemoSigner,
  SettlementError,
  addAmounts,
} from "@hermes/shared";
import type { FacilitatorClient, PolicyGate, Repo, SignerClient } from "@hermes/shared";
import type { Agent, Listing, Order, Payment, Receipt, SpendPolicy } from "@hermes/types";
import { getStore } from "./store";
import { supabase, supabaseEnabled } from "./supabase";

const BUYER_AGENT_ID = "00000000-0000-4000-8000-000000000002";
const now = () => new Date().toISOString();

export interface Approval {
  orderId: string;
  reason: string;
  createdAt: string;
}

/** The aggregate every page reads. Same shape in demo and Supabase modes. */
export interface Aggregate {
  agents: Agent[];
  listings: Listing[];
  orders: Order[];
  payments: Payment[];
  receipts: Receipt[];
  approvals: Approval[];
  reputation: Record<string, number>;
  policy: SpendPolicy;
}

export interface Deps {
  repo: Repo;
  signer: SignerClient;
  facilitator: FacilitatorClient;
  policyGate: PolicyGate;
}

const APPROVAL_REASON = "Exceeds auto-approve limit — needs human approval";

// ── Row mappers (snake_case → domain camelCase). Amounts always coerced to string. ──
type Row = Record<string, unknown>;
const str = (v: unknown): string => String(v);

function mapAgent(r: Row): Agent {
  return {
    id: str(r.id),
    ownerUserId: (r.owner_user_id as string | null) ?? null,
    kind: r.kind as Agent["kind"],
    casperAccountHash: str(r.casper_account_hash) as Agent["casperAccountHash"],
    publicKey: str(r.public_key) as Agent["publicKey"],
    displayName: str(r.display_name),
    capabilities: (r.capabilities as string[]) ?? [],
    metadataUri: (r.metadata_uri as string | null) ?? null,
    status: str(r.status),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  };
}

function mapListing(r: Row): Listing {
  return {
    id: str(r.id),
    agentId: str(r.agent_id),
    title: str(r.title),
    capability: str(r.capability),
    priceAmount: str(r.price_amount),
    asset: str(r.asset),
    terms: (r.terms as Record<string, unknown>) ?? {},
    status: r.status as Listing["status"],
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  };
}

function mapOrder(r: Row): Order {
  return {
    id: str(r.id),
    negotiationId: (r.negotiation_id as string | null) ?? null,
    buyerAgentId: str(r.buyer_agent_id),
    sellerAgentId: str(r.seller_agent_id),
    listingId: (r.listing_id as string | null) ?? null,
    priceAmount: str(r.price_amount),
    asset: str(r.asset),
    status: r.status as Order["status"],
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  };
}

function mapPayment(r: Row): Payment {
  return {
    id: str(r.id),
    orderId: str(r.order_id),
    nonce: str(r.nonce) as Payment["nonce"],
    amount: str(r.amount),
    payer: str(r.payer) as Payment["payer"],
    payee: str(r.payee) as Payment["payee"],
    asset: str(r.asset),
    status: r.status as Payment["status"],
    deployHash: (r.deploy_hash as string | null) ?? null,
    validBefore: str(r.valid_before),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  };
}

function mapReceipt(r: Row): Receipt {
  return {
    id: str(r.id),
    paymentId: str(r.payment_id),
    deployHash: str(r.deploy_hash),
    amount: str(r.amount),
    payer: str(r.payer) as Receipt["payer"],
    payee: str(r.payee) as Receipt["payee"],
    settledAt: str(r.settled_at),
    raw: (r.raw as Record<string, unknown>) ?? {},
    createdAt: str(r.created_at),
  };
}

function mapPolicy(r: Row): SpendPolicy {
  const allow = (r.allowlist as Record<string, string[]>) ?? {};
  return {
    id: str(r.id),
    agentId: str(r.agent_id),
    dailyBudget: str(r.daily_budget),
    autoApproveLimit: str(r.auto_approve_limit),
    allowlist: {
      payees: (allow.payees as Agent["casperAccountHash"][]) ?? [],
      assets: allow.assets ?? [],
      endpoints: allow.endpoints ?? [],
    },
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  };
}

// ── Supabase-backed Repo (money path) ──
class SupabaseRepo implements Repo {
  async getOrder(id: string): Promise<Order | null> {
    const { data } = await supabase().from("orders").select("*").eq("id", id).maybeSingle();
    return data ? mapOrder(data) : null;
  }

  async createPayment(payment: Payment): Promise<Payment> {
    const { error } = await supabase().from("payments").insert({
      id: payment.id,
      order_id: payment.orderId,
      nonce: payment.nonce,
      amount: payment.amount,
      payer: payment.payer,
      payee: payment.payee,
      asset: payment.asset,
      status: payment.status,
      deploy_hash: payment.deployHash,
      valid_before: payment.validBefore,
    });
    if (error) {
      if (error.code === "23505") {
        throw new SettlementError("duplicate payment nonce", "nonce_reuse");
      }
      throw new SettlementError(error.message, "repo_error");
    }
    return payment;
  }

  async markSettled(paymentId: string, receipt: Receipt): Promise<void> {
    const db = supabase();
    const { data: payment } = await db
      .from("payments")
      .update({ status: "settled", deploy_hash: receipt.deployHash })
      .eq("id", paymentId)
      .select("order_id")
      .maybeSingle();
    await db.from("receipts").insert({
      id: receipt.id,
      payment_id: receipt.paymentId,
      deploy_hash: receipt.deployHash,
      amount: receipt.amount,
      payer: receipt.payer,
      payee: receipt.payee,
      settled_at: receipt.settledAt,
      raw: receipt.raw,
    });
    if (payment?.order_id) {
      await db.from("orders").update({ status: "settled" }).eq("id", payment.order_id);
    }
  }
}

// ── Public API (mode-aware) ──
export function getDeps(): Deps {
  if (!supabaseEnabled()) {
    const store = getStore();
    return {
      repo: new DemoRepo(store),
      signer: new DemoSigner(),
      facilitator: new DemoFacilitator(),
      policyGate: new BasicPolicyGate(
        async () => store.policy,
        async () =>
          store.payments
            .filter((p) => p.status === "settled")
            .reduce((acc, p) => addAmounts(acc, p.amount), "0"),
      ),
    };
  }
  return {
    repo: new SupabaseRepo(),
    signer: new DemoSigner(),
    facilitator: new DemoFacilitator(),
    policyGate: new BasicPolicyGate(getBuyerPolicy, getSpentToday),
  };
}

async function getBuyerPolicy(): Promise<SpendPolicy> {
  const { data } = await supabase()
    .from("spend_policies")
    .select("*")
    .eq("agent_id", BUYER_AGENT_ID)
    .maybeSingle();
  if (!data) throw new Error("spend policy not found for buyer agent");
  return mapPolicy(data);
}

async function getSpentToday(): Promise<string> {
  const { data } = await supabase().from("payments").select("amount").eq("status", "settled");
  return (data ?? []).reduce((acc: string, p: Row) => addAmounts(acc, str(p.amount)), "0");
}

export async function loadData(): Promise<Aggregate> {
  if (!supabaseEnabled()) {
    const s = getStore();
    return {
      agents: s.agents,
      listings: s.listings,
      orders: s.orders,
      payments: s.payments,
      receipts: s.receipts,
      approvals: s.approvals,
      reputation: s.reputation,
      policy: s.policy,
    };
  }
  const db = supabase();
  const [agents, listings, orders, payments, receipts, reputation, policy] = await Promise.all([
    db.from("agents").select("*"),
    db.from("listings").select("*").eq("status", "active"),
    db.from("orders").select("*").order("created_at", { ascending: false }),
    db.from("payments").select("*"),
    db.from("receipts").select("*"),
    db.from("reputation_scores").select("*"),
    getBuyerPolicy(),
  ]);
  const orderRows = (orders.data ?? []).map(mapOrder);
  return {
    agents: (agents.data ?? []).map(mapAgent),
    listings: (listings.data ?? []).map(mapListing),
    orders: orderRows,
    payments: (payments.data ?? []).map(mapPayment),
    receipts: (receipts.data ?? []).map(mapReceipt),
    approvals: orderRows
      .filter((o) => o.status === "authorized")
      .map((o) => ({ orderId: o.id, reason: APPROVAL_REASON, createdAt: o.updatedAt })),
    reputation: Object.fromEntries(
      (reputation.data ?? []).map((r: Row) => [str(r.agent_id), Number(r.score)]),
    ),
    policy,
  };
}

// ── Order/approval writes (mode-aware) ──
export async function createOrder(listingId: string): Promise<Order> {
  if (!supabaseEnabled()) {
    const store = getStore();
    const listing = store.listings.find((l) => l.id === listingId);
    if (!listing) throw new Error("listing not found");
    const order: Order = {
      id: crypto.randomUUID(),
      negotiationId: null,
      buyerAgentId: BUYER_AGENT_ID,
      sellerAgentId: listing.agentId,
      listingId: listing.id,
      priceAmount: listing.priceAmount,
      asset: listing.asset,
      status: "quoted",
      createdAt: now(),
      updatedAt: now(),
    };
    store.orders.unshift(order);
    return order;
  }
  const db = supabase();
  const { data: listing } = await db
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) throw new Error("listing not found");
  const { data, error } = await db
    .from("orders")
    .insert({
      buyer_agent_id: BUYER_AGENT_ID,
      seller_agent_id: str(listing.agent_id),
      listing_id: str(listing.id),
      price_amount: str(listing.price_amount),
      asset: str(listing.asset),
      status: "quoted",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "failed to create order");
  return mapOrder(data);
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!supabaseEnabled()) {
    return getStore().orders.find((o) => o.id === id) ?? null;
  }
  return new SupabaseRepo().getOrder(id);
}

export async function setOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
  if (!supabaseEnabled()) {
    const order = getStore().orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = now();
    }
    return;
  }
  await supabase().from("orders").update({ status }).eq("id", orderId);
}

/** Demo-mode only: record the parked-approval reason (Supabase derives it from status). */
export function parkApprovalDemo(orderId: string, reason: string): void {
  if (supabaseEnabled()) return;
  getStore().approvals.push({ orderId, reason, createdAt: now() });
}

export function clearApprovalDemo(orderId: string): void {
  if (supabaseEnabled()) return;
  const store = getStore();
  store.approvals = store.approvals.filter((a) => a.orderId !== orderId);
}
