import {
  BasicPolicyGate,
  DemoFacilitator,
  DemoRepo,
  DemoSigner,
  SettlementError,
  addAmounts,
  deploymentFor,
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

// ── Agent + Listing creation (publish flow, mode-aware) ──
const rand64 = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");

export interface NewAgentInput {
  displayName: string;
  capabilities: string[];
  casperAccountHash?: string;
  publicKey?: string;
}

export async function createAgent(input: NewAgentInput): Promise<Agent> {
  const accountHash = (input.casperAccountHash ?? `00${rand64()}`) as Agent["casperAccountHash"];
  const publicKey = (input.publicKey ?? `02${rand64()}`) as Agent["publicKey"];
  if (!supabaseEnabled()) {
    const agent: Agent = {
      id: crypto.randomUUID(),
      ownerUserId: null,
      kind: "external",
      casperAccountHash: accountHash,
      publicKey,
      displayName: input.displayName,
      capabilities: input.capabilities,
      metadataUri: null,
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    };
    const store = getStore();
    store.agents.push(agent);
    store.reputation[agent.id] = 300; // neutral starting reputation (×100)
    return agent;
  }
  const { data, error } = await supabase()
    .from("agents")
    .insert({
      kind: "external",
      casper_account_hash: accountHash,
      public_key: publicKey,
      display_name: input.displayName,
      capabilities: input.capabilities,
      status: "active",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "failed to create agent");
  await supabase()
    .from("reputation_scores")
    .upsert({ agent_id: str(data.id), score: 300 });
  return mapAgent(data);
}

export interface NewListingInput {
  agentId: string;
  title: string;
  capability: string;
  priceAmount: string;
  asset: string;
  terms?: Record<string, unknown>;
}

export async function createListing(input: NewListingInput): Promise<Listing> {
  if (!supabaseEnabled()) {
    const listing: Listing = {
      id: crypto.randomUUID(),
      agentId: input.agentId,
      title: input.title,
      capability: input.capability,
      priceAmount: input.priceAmount,
      asset: input.asset,
      terms: input.terms ?? {},
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    };
    getStore().listings.push(listing);
    return listing;
  }
  const { data, error } = await supabase()
    .from("listings")
    .insert({
      agent_id: input.agentId,
      title: input.title,
      capability: input.capability,
      price_amount: input.priceAmount,
      asset: input.asset,
      terms: input.terms ?? {},
      status: "active",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "failed to create listing");
  return mapListing(data);
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

// ── On-chain artifact ledger ──────────────────────────────────────────────────
// Durable record of deploys / on-chain actions. Backed by the `onchain_artifacts`
// table in Supabase mode; falls back to the committed registry (deployments.ts)
// when the table isn't migrated yet, and augments demo mode with in-memory
// settlements so nothing on-chain is treated as throwaway demo state.

const CASPER_NETWORK = process.env.NEXT_PUBLIC_CASPER_NETWORK ?? "casper-test";

export type OnChainArtifactKind =
  | "contract_deploy"
  | "settlement"
  | "mint"
  | "registry_write"
  | "reputation_anchor";

export interface OnChainArtifact {
  id: string;
  kind: OnChainArtifactKind;
  label: string;
  network: string;
  contractPackageHash: string | null;
  deployHash: string | null;
  txHash: string | null;
  address: string | null;
  amount: string | null;
  asset: string | null;
  orderId: string | null;
  paymentId: string | null;
  simulated: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RecordArtifactInput {
  kind: OnChainArtifactKind;
  label: string;
  deployHash?: string | null;
  txHash?: string | null;
  contractPackageHash?: string | null;
  address?: string | null;
  amount?: string | null;
  asset?: string | null;
  orderId?: string | null;
  paymentId?: string | null;
  simulated?: boolean;
  metadata?: Record<string, unknown>;
}

const byCreatedDesc = (a: OnChainArtifact, b: OnChainArtifact) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

/** Deploys + proven settlement from the committed registry (the durable fallback). */
function registryArtifacts(): OnChainArtifact[] {
  const reg = deploymentFor(CASPER_NETWORK);
  const arts: OnChainArtifact[] = reg.contracts.map((c) => ({
    id: `contract:${c.name}`,
    kind: "contract_deploy",
    label: c.name,
    network: reg.network,
    contractPackageHash: c.packageHash,
    deployHash: null,
    txHash: null,
    address: c.packageHash,
    amount: null,
    asset: null,
    orderId: null,
    paymentId: null,
    simulated: false,
    metadata: { standards: c.standards, role: c.role, deployTx: c.deployTxShort ?? null },
    createdAt: reg.deployedAt ?? now(),
  }));
  if (reg.provenSettlementTx) {
    const token = reg.contracts.find((c) => c.name === "HermesToken");
    arts.push({
      id: `settlement:${reg.provenSettlementTx}`,
      kind: "settlement",
      label: "Proven x402 settlement",
      network: reg.network,
      contractPackageHash: token?.packageHash ?? null,
      deployHash: reg.provenSettlementTx,
      txHash: reg.provenSettlementTx,
      address: null,
      amount: "7500000000",
      asset: token ? token.packageHash.replace(/^hash-/, "") : null,
      orderId: null,
      paymentId: null,
      simulated: false,
      metadata: {
        scheme: "exact",
        onChain: true,
        note: "transfer_with_authorization proven end-to-end.",
      },
      createdAt: reg.deployedAt ?? now(),
    });
  }
  return arts;
}

const gArtifacts = globalThis as unknown as { __hermesArtifacts?: OnChainArtifact[] };
function demoArtifactStore(): OnChainArtifact[] {
  gArtifacts.__hermesArtifacts ??= [];
  return gArtifacts.__hermesArtifacts;
}

function mapArtifact(r: Row): OnChainArtifact {
  return {
    id: str(r.id),
    kind: r.kind as OnChainArtifactKind,
    label: str(r.label),
    network: str(r.network),
    contractPackageHash: (r.contract_package_hash as string | null) ?? null,
    deployHash: (r.deploy_hash as string | null) ?? null,
    txHash: (r.tx_hash as string | null) ?? null,
    address: (r.address as string | null) ?? null,
    amount: r.amount != null ? str(r.amount) : null,
    asset: (r.asset as string | null) ?? null,
    orderId: (r.order_id as string | null) ?? null,
    paymentId: (r.payment_id as string | null) ?? null,
    simulated: Boolean(r.simulated),
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: str(r.created_at),
  };
}

/** All recorded on-chain artifacts, newest first. Resilient to a missing table. */
export async function loadArtifacts(): Promise<OnChainArtifact[]> {
  if (!supabaseEnabled()) {
    return [...registryArtifacts(), ...demoArtifactStore()].sort(byCreatedDesc);
  }
  try {
    const { data, error } = await supabase()
      .from("onchain_artifacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapArtifact);
  } catch {
    // Table not migrated yet (or transient) — fall back to the committed registry.
    return [...registryArtifacts()].sort(byCreatedDesc);
  }
}

// ── Autonomous agent runs (trace of a buyer agent acting on its own) ──
const BUYER_AGENT = "00000000-0000-4000-8000-000000000002";

export type AgentRunStatus = "settled" | "awaiting_approval" | "failed";

export interface AgentRunRecord {
  id: string;
  status: AgentRunStatus;
  trace: Record<string, unknown>;
  orderId: string | null;
  createdAt: string;
}

// run_status enum in Postgres: running | waiting_human | completed | failed.
const RUN_STATUS: Record<AgentRunStatus, string> = {
  settled: "completed",
  awaiting_approval: "waiting_human",
  failed: "failed",
};
const RUN_STATUS_INV: Record<string, AgentRunStatus> = {
  completed: "settled",
  waiting_human: "awaiting_approval",
  failed: "failed",
  running: "failed",
};

const gRuns = globalThis as unknown as { __hermesRuns?: AgentRunRecord[] };
function demoRuns(): AgentRunRecord[] {
  gRuns.__hermesRuns ??= [];
  return gRuns.__hermesRuns;
}

export async function recordAgentRun(input: {
  status: AgentRunStatus;
  trace: Record<string, unknown>;
  orderId?: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  if (!supabaseEnabled()) {
    demoRuns().unshift({
      id,
      status: input.status,
      trace: input.trace,
      orderId: input.orderId ?? null,
      createdAt: now(),
    });
    return id;
  }
  try {
    const { data, error } = await supabase()
      .from("agent_runs")
      .insert({
        agent_id: BUYER_AGENT,
        status: RUN_STATUS[input.status],
        trace: { ...input.trace, orderId: input.orderId ?? null },
      })
      .select("id")
      .single();
    if (error) throw error;
    return data ? str(data.id) : id;
  } catch (error) {
    console.error("recordAgentRun failed", error);
    return id;
  }
}

export async function loadAgentRuns(limit = 20): Promise<AgentRunRecord[]> {
  if (!supabaseEnabled()) return demoRuns().slice(0, limit);
  try {
    const { data, error } = await supabase()
      .from("agent_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r: Row) => {
      const trace = (r.trace as Record<string, unknown>) ?? {};
      return {
        id: str(r.id),
        status: RUN_STATUS_INV[str(r.status)] ?? "failed",
        trace,
        orderId: (trace.orderId as string | null) ?? null,
        createdAt: str(r.created_at),
      };
    });
  } catch {
    return [];
  }
}

/** Artifacts recorded for a single order (settlement attempts), newest first. */
export async function artifactsForOrder(orderId: string): Promise<OnChainArtifact[]> {
  if (!supabaseEnabled()) {
    return demoArtifactStore()
      .filter((a) => a.orderId === orderId)
      .sort(byCreatedDesc);
  }
  try {
    const { data, error } = await supabase()
      .from("onchain_artifacts")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapArtifact);
  } catch {
    return [];
  }
}

/** Persist a deploy / on-chain action. Never throws — logs and continues. */
export async function recordArtifact(input: RecordArtifactInput): Promise<void> {
  if (!supabaseEnabled()) {
    demoArtifactStore().unshift({
      id: crypto.randomUUID(),
      kind: input.kind,
      label: input.label,
      network: CASPER_NETWORK,
      contractPackageHash: input.contractPackageHash ?? null,
      deployHash: input.deployHash ?? null,
      txHash: input.txHash ?? input.deployHash ?? null,
      address: input.address ?? null,
      amount: input.amount ?? null,
      asset: input.asset ?? null,
      orderId: input.orderId ?? null,
      paymentId: input.paymentId ?? null,
      simulated: input.simulated ?? false,
      metadata: input.metadata ?? {},
      createdAt: now(),
    });
    return;
  }
  try {
    const { error } = await supabase().from("onchain_artifacts").insert({
      kind: input.kind,
      label: input.label,
      network: CASPER_NETWORK,
      contract_package_hash: input.contractPackageHash ?? null,
      deploy_hash: input.deployHash ?? null,
      tx_hash: input.txHash ?? input.deployHash ?? null,
      address: input.address ?? null,
      amount: input.amount ?? null,
      asset: input.asset ?? null,
      order_id: input.orderId ?? null,
      payment_id: input.paymentId ?? null,
      simulated: input.simulated ?? false,
      metadata: input.metadata ?? {},
    });
    if (error && error.code !== "23505") {
      // 23505 = duplicate deploy_hash (already recorded) — safe to ignore.
      console.error("recordArtifact insert failed", error.message);
    }
  } catch (error) {
    console.error("recordArtifact failed (table not migrated?)", error);
  }
}
