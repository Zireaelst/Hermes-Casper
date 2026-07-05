import { describe, expect, it } from "vitest";
import type {
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
import {
  PolicyDeniedError,
  RequiresHumanApprovalError,
  SettlementError,
} from "./errors";
import { payForOrder } from "./orchestrator";
import { BasicPolicyGate } from "./policy";
import {
  buildAuthorization,
  decodePaymentRequired,
  encodePaymentRequired,
} from "./x402-codec";

// ── fixtures ────────────────────────────────────────────────────────────────
const PAYEE = `00${"b".repeat(64)}`;
const BUYER = `00${"a".repeat(64)}`;
const ASSET = "c".repeat(64);

const requirements: PaymentRequirements = {
  scheme: "exact",
  network: "casper:casper-test",
  payTo: PAYEE,
  amount: "7500000000",
  asset: ASSET,
  extra: { name: "HERMES", version: "1", decimals: "9" },
  maxTimeoutSeconds: 900,
};

const order: Order = {
  id: "00000000-0000-4000-8000-000000000201",
  negotiationId: null,
  buyerAgentId: "00000000-0000-4000-8000-000000000002",
  sellerAgentId: "00000000-0000-4000-8000-000000000001",
  listingId: null,
  priceAmount: "7500000000",
  asset: ASSET,
  status: "quoted",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const policy: SpendPolicy = {
  id: "00000000-0000-4000-8000-000000000301",
  agentId: order.buyerAgentId,
  dailyBudget: "100000000000",
  autoApproveLimit: "10000000000",
  allowlist: { payees: [PAYEE], assets: [ASSET], endpoints: [] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function makeDeps(overrides?: {
  policy?: SpendPolicy | null;
  spent?: string;
  verify?: VerifyResult;
  settle?: SettleResult;
}) {
  const payments: Payment[] = [];
  const receipts: Receipt[] = [];
  const repo: Repo = {
    getOrder: async () => order,
    createPayment: async (p) => {
      if (payments.some((x) => x.nonce === p.nonce)) throw new Error("duplicate nonce");
      payments.push(p);
      return p;
    },
    markSettled: async (_id, r) => {
      receipts.push(r);
    },
  };
  const signer: SignerClient = {
    signAuthorization: async () => ({
      signature: "ab".repeat(65),
      publicKey: `01${"d".repeat(64)}`,
    }),
  };
  const facilitator: FacilitatorClient = {
    verify: async (_p: PaymentPayload) =>
      overrides?.verify ?? { isValid: true, payer: BUYER },
    settle: async () => ({
      ok: true as const,
      value:
        overrides?.settle ??
        ({
          success: true,
          transaction: "e".repeat(64),
          network: "casper:casper-test",
          payer: BUYER,
        } satisfies SettleResult),
    }),
  };
  const gate = new BasicPolicyGate(
    async () => (overrides?.policy === undefined ? policy : overrides.policy),
    async () => overrides?.spent ?? "0",
  );
  return {
    deps: {
      policyGate: gate,
      signer,
      facilitator,
      repo,
      requirements,
      buyerAccountHash: BUYER,
      agentKeyRef: "kms://demo",
    },
    payments,
    receipts,
  };
}

// ── x402 codec ──────────────────────────────────────────────────────────────
describe("x402 codec", () => {
  it("round-trips PaymentRequirements through the header encoding", () => {
    expect(decodePaymentRequired(encodePaymentRequired(requirements))).toEqual(requirements);
  });

  it("builds a valid authorization window with a fresh 32-byte nonce", () => {
    const auth = buildAuthorization({ from: BUYER, requirements, nowSeconds: 1_800_000_000 });
    expect(auth.to).toBe(PAYEE);
    expect(auth.value).toBe("7500000000");
    expect(Number(auth.validBefore) - 1_800_000_000).toBe(900);
    expect(auth.nonce).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ── policy gate ─────────────────────────────────────────────────────────────
describe("BasicPolicyGate", () => {
  it("denies with no policy, off-allowlist payee, and blown budget", async () => {
    const gate = new BasicPolicyGate(async () => null, async () => "0");
    expect((await gate.evaluate(spend("1"))).kind).toBe("denied");

    const gate2 = new BasicPolicyGate(async () => policy, async () => "0");
    const offList = await gate2.evaluate({ ...spend("1"), payee: `00${"f".repeat(64)}` });
    expect(offList.kind).toBe("denied");

    const gate3 = new BasicPolicyGate(async () => policy, async () => "100000000000");
    expect((await gate3.evaluate(spend("1"))).kind).toBe("denied");
  });

  it("escalates above the auto-approve limit, approves under it", async () => {
    const gate = new BasicPolicyGate(async () => policy, async () => "0");
    expect((await gate.evaluate(spend("10000000001"))).kind).toBe("requires_human");
    expect((await gate.evaluate(spend("7500000000"))).kind).toBe("approved");
  });

  function spend(amount: string) {
    return {
      agentId: order.buyerAgentId,
      amount,
      payee: PAYEE,
      asset: ASSET,
      network: "casper:casper-test" as const,
    };
  }
});

// ── orchestrator ────────────────────────────────────────────────────────────
describe("payForOrder", () => {
  it("settles the happy path and writes payment + receipt", async () => {
    const { deps, payments, receipts } = makeDeps();
    const result = await payForOrder(order, deps);
    expect(result.deployHash).toBe("e".repeat(64));
    expect(result.payment.status).toBe("settled");
    expect(payments).toHaveLength(1);
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.deployHash).toBe("e".repeat(64));
  });

  it("throws PolicyDeniedError before signing when denied", async () => {
    const { deps, payments } = makeDeps({ policy: null });
    await expect(payForOrder(order, deps)).rejects.toBeInstanceOf(PolicyDeniedError);
    expect(payments).toHaveLength(0); // no intent persisted, nothing signed
  });

  it("escalates to human above threshold", async () => {
    const { deps } = makeDeps({
      policy: { ...policy, autoApproveLimit: "1" },
    });
    await expect(payForOrder(order, deps)).rejects.toBeInstanceOf(RequiresHumanApprovalError);
  });

  it("fails closed when verification rejects", async () => {
    const { deps, receipts } = makeDeps({
      verify: { isValid: false, invalidReason: "invalid_signature" },
    });
    await expect(payForOrder(order, deps)).rejects.toBeInstanceOf(SettlementError);
    expect(receipts).toHaveLength(0);
  });

  it("fails closed when settlement reports failure", async () => {
    const { deps, receipts } = makeDeps({
      settle: {
        success: false,
        transaction: "",
        network: "casper:casper-test",
        errorReason: "put_deploy_failed",
      },
    });
    await expect(payForOrder(order, deps)).rejects.toBeInstanceOf(SettlementError);
    expect(receipts).toHaveLength(0);
  });
});
