"use server";

import {
  DEMO_BUYER_ACCOUNT,
  PolicyDeniedError,
  RequiresHumanApprovalError,
  SettlementError,
  demoRequirementsFor,
  payForOrder,
} from "@hermes/shared";
import type { PolicyGate, Repo } from "@hermes/shared";
import type { Order, Payment, Receipt } from "@hermes/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearApprovalDemo,
  createOrder,
  getDeps,
  getOrder,
  loadData,
  parkApprovalDemo,
  recordArtifact,
  setOrderStatus,
} from "./data";
import { chainSettlementEnabled, settleOrderOnChain, type ChainSettleResult } from "./x402-real";

const BUYER_AGENT_ID = "00000000-0000-4000-8000-000000000002";
const nowIso = () => new Date().toISOString();

async function executePayment(order: Order, gateOverride?: PolicyGate): Promise<void> {
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
      return;
    }
    if (decision.kind === "denied") {
      await setOrderStatus(order.id, "failed");
      return;
    }
    try {
      const result = await settleOrderOnChain(order, seller.casperAccountHash);
      await recordChainSettlement(deps.repo, order, result);
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
    }
    return;
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
    // repo.markSettled set order + payment to settled
    await recordSimulatedSettlement(order.id, listing.title);
  } catch (error) {
    if (error instanceof RequiresHumanApprovalError) {
      await setOrderStatus(order.id, "authorized"); // parked awaiting human approval
      parkApprovalDemo(order.id, error.message);
      return;
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
      return;
    }
    if (error instanceof PolicyDeniedError) return;
    throw error;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Persist a real on-chain settlement as Payment + Receipt (marks order settled). */
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

/** Record a simulated (off-chain) settlement in the artifact ledger. */
async function recordSimulatedSettlement(orderId: string, label: string): Promise<void> {
  const data = await loadData();
  const payment = data.payments.find((p) => p.orderId === orderId);
  const receipt = payment
    ? data.receipts.find((r) => r.paymentId === payment.id)
    : undefined;
  if (!receipt) return;
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
}

/** Marketplace "Buy now": create Order → policy gate → pay → settle (or park for HITL). */
export async function buyListing(formData: FormData): Promise<void> {
  const listingId = String(formData.get("listingId") ?? "");
  const order = await createOrder(listingId);
  await executePayment(order);
  revalidatePath("/", "layout");
  redirect(`/orders/${order.id}`);
}

/** Approvals queue: a human approves a parked spend → gate is satisfied, pay proceeds. */
export async function approveSpend(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "");
  const order = await getOrder(orderId);
  if (!order || order.status !== "authorized") return;
  clearApprovalDemo(orderId);
  const humanApprovedGate: PolicyGate = {
    evaluate: async () => ({ kind: "approved" }),
  };
  await executePayment(order, humanApprovedGate);
  revalidatePath("/", "layout");
  redirect(`/orders/${order.id}`);
}

/** Order detail: re-attempt settlement for a failed order (fresh nonce, no double-spend). */
export async function retryOrder(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "");
  const order = await getOrder(orderId);
  if (!order || order.status !== "failed") return;
  await executePayment(order);
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}`);
}

/** Approvals queue: reject a parked spend. */
export async function rejectSpend(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "");
  const order = await getOrder(orderId);
  if (order && order.status === "authorized") {
    await setOrderStatus(orderId, "cancelled");
  }
  clearApprovalDemo(orderId);
  revalidatePath("/", "layout");
}
