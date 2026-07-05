import type {
  Agent,
  Listing,
  Order,
  Payment,
  PaymentPayload,
  PaymentRequirements,
  Receipt,
  SettleResult,
  SpendPolicy,
  VerifyResult,
} from "@hermes/types";
import type { FacilitatorClient, Repo, SignerClient } from "./adapters";
import { SettlementError } from "./errors";
import { ok, type Result } from "./result";

/**
 * Demo mode: in-memory marketplace + simulated signer/facilitator so the full
 * discover→order→pay→settle flow works end-to-end before Supabase (session D)
 * and testnet (session J) are wired. Clearly a pre-production stand-in — the
 * real adapters implement the same interfaces.
 */

export const DEMO_ASSET = "c".repeat(64);
export const DEMO_BUYER_ACCOUNT = `00${"a".repeat(64)}`;
const DEMO_SELLER_ACCOUNT = `00${"b".repeat(64)}`;

const now = () => new Date().toISOString();

export interface DemoStore {
  agents: Agent[];
  listings: Listing[];
  orders: Order[];
  payments: Payment[];
  receipts: Receipt[];
  policy: SpendPolicy;
  approvals: { orderId: string; reason: string; createdAt: string }[];
}

export function createDemoStore(): DemoStore {
  const seller: Agent = {
    id: "00000000-0000-4000-8000-000000000001",
    ownerUserId: null,
    kind: "external",
    casperAccountHash: DEMO_SELLER_ACCOUNT,
    publicKey: `01${"b".repeat(64)}`,
    displayName: "Translator Agent",
    capabilities: ["translate.text"],
    metadataUri: null,
    status: "active",
    createdAt: now(),
    updatedAt: now(),
  };
  const buyer: Agent = {
    ...seller,
    id: "00000000-0000-4000-8000-000000000002",
    casperAccountHash: DEMO_BUYER_ACCOUNT,
    publicKey: `01${"a".repeat(64)}`,
    displayName: "Research Agent",
    capabilities: ["research.web"],
  };
  const scout: Agent = {
    ...seller,
    id: "00000000-0000-4000-8000-000000000003",
    casperAccountHash: `00${"d".repeat(64)}`,
    publicKey: `01${"d".repeat(64)}`,
    displayName: "Data Scout",
    capabilities: ["scrape.web", "summarize.text"],
  };

  const listings: Listing[] = [
    {
      id: "00000000-0000-4000-8000-000000000101",
      agentId: seller.id,
      title: "Translate up to 1k words",
      capability: "translate.text",
      priceAmount: "7500000000",
      asset: DEMO_ASSET,
      terms: { turnaround: "5m" },
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      agentId: scout.id,
      title: "Web research brief (10 sources)",
      capability: "research.web",
      priceAmount: "12000000000",
      asset: DEMO_ASSET,
      terms: { depth: "10 sources", format: "markdown" },
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "00000000-0000-4000-8000-000000000103",
      agentId: scout.id,
      title: "Summarize a 50-page PDF",
      capability: "summarize.text",
      priceAmount: "45000000000",
      asset: DEMO_ASSET,
      terms: { maxPages: 50 },
      status: "active",
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  return {
    agents: [seller, buyer, scout],
    listings,
    orders: [],
    payments: [],
    receipts: [],
    approvals: [],
    policy: {
      id: "00000000-0000-4000-8000-000000000301",
      agentId: buyer.id,
      dailyBudget: "100000000000", // 100 HERMES
      autoApproveLimit: "20000000000", // 20 HERMES → the 45-HERMES listing triggers HITL
      allowlist: { payees: [], assets: [], endpoints: [] }, // empty = allow all (demo)
      createdAt: now(),
      updatedAt: now(),
    },
  };
}

export function demoRequirementsFor(listing: Listing, payTo: string): PaymentRequirements {
  return {
    scheme: "exact",
    network: "casper:casper-test",
    payTo: payTo as PaymentRequirements["payTo"],
    amount: listing.priceAmount,
    asset: listing.asset,
    extra: { name: "HERMES", version: "1", decimals: "9" },
    maxTimeoutSeconds: 900,
  };
}

/** Signs with a deterministic fake signature (structure-valid, not chain-valid). */
export class DemoSigner implements SignerClient {
  async signAuthorization(): Promise<{ signature: string; publicKey: string }> {
    return { signature: "ab".repeat(65), publicKey: `01${"a".repeat(64)}` };
  }
}

/** Simulates verify+settle with realistic latency and a fake deploy hash. */
export class DemoFacilitator implements FacilitatorClient {
  async verify(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<VerifyResult> {
    if (payload.payload.authorization.value !== requirements.amount) {
      return { isValid: false, invalidReason: "amount_mismatch" };
    }
    return { isValid: true, payer: payload.payload.authorization.from };
  }

  async settle(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<Result<SettleResult, SettlementError>> {
    await new Promise((r) => setTimeout(r, 400)); // simulated finality
    const deployHash = payload.payload.authorization.nonce; // deterministic per payment
    return ok({
      success: true,
      transaction: deployHash,
      network: requirements.network,
      payer: payload.payload.authorization.from,
    });
  }
}

export class DemoRepo implements Repo {
  constructor(private readonly store: DemoStore) {}

  async getOrder(id: string): Promise<Order | null> {
    return this.store.orders.find((o) => o.id === id) ?? null;
  }

  async createPayment(payment: Payment): Promise<Payment> {
    if (this.store.payments.some((p) => p.nonce === payment.nonce)) {
      throw new SettlementError("duplicate payment nonce", "nonce_reuse");
    }
    this.store.payments.push(payment);
    return payment;
  }

  async markSettled(paymentId: string, receipt: Receipt): Promise<void> {
    const payment = this.store.payments.find((p) => p.id === paymentId);
    if (payment) {
      payment.status = "settled";
      payment.deployHash = receipt.deployHash;
      payment.updatedAt = now();
    }
    this.store.receipts.push(receipt);
    const order = this.store.orders.find((o) => o.id === payment?.orderId);
    if (order) {
      order.status = "settled";
      order.updatedAt = now();
    }
  }
}
