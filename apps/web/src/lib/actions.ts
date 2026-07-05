"use server";

import {
  DEMO_BUYER_ACCOUNT,
  PolicyDeniedError,
  RequiresHumanApprovalError,
  SettlementError,
  demoRequirementsFor,
  payForOrder,
} from "@hermes/shared";
import type { PolicyGate } from "@hermes/shared";
import type { Order } from "@hermes/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDeps, getStore } from "./store";

const BUYER_AGENT_ID = "00000000-0000-4000-8000-000000000002";
const nowIso = () => new Date().toISOString();

function createOrder(listingId: string): Order {
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
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  store.orders.unshift(order);
  return order;
}

async function executePayment(order: Order, gateOverride?: PolicyGate): Promise<void> {
  const store = getStore();
  const deps = getDeps();
  const listing = store.listings.find((l) => l.id === order.listingId);
  const seller = store.agents.find((a) => a.id === order.sellerAgentId);
  if (!listing || !seller) throw new Error("listing/seller missing");

  order.status = "settling";
  order.updatedAt = nowIso();
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
    // repo.markSettled set order/payment to settled
  } catch (error) {
    if (error instanceof RequiresHumanApprovalError) {
      order.status = "authorized"; // parked awaiting human approval
      order.updatedAt = nowIso();
      store.approvals.push({
        orderId: order.id,
        reason: error.message,
        createdAt: nowIso(),
      });
      return;
    }
    order.status = "failed";
    order.updatedAt = nowIso();
    if (error instanceof PolicyDeniedError || error instanceof SettlementError) return;
    throw error;
  }
}

/** Marketplace "Buy now": create Order → policy gate → pay → settle (or park for HITL). */
export async function buyListing(formData: FormData): Promise<void> {
  const listingId = String(formData.get("listingId") ?? "");
  const order = createOrder(listingId);
  await executePayment(order);
  revalidatePath("/", "layout");
  redirect(`/orders/${order.id}`);
}

/** Approvals queue: a human approves a parked spend → gate is satisfied, pay proceeds. */
export async function approveSpend(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "");
  const store = getStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (!order || order.status !== "authorized") return;
  store.approvals = store.approvals.filter((a) => a.orderId !== orderId);
  const humanApprovedGate: PolicyGate = {
    evaluate: async () => ({ kind: "approved" }),
  };
  await executePayment(order, humanApprovedGate);
  revalidatePath("/", "layout");
  redirect(`/orders/${order.id}`);
}

/** Approvals queue: reject a parked spend. */
export async function rejectSpend(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "");
  const store = getStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (order && order.status === "authorized") {
    order.status = "cancelled";
    order.updatedAt = nowIso();
  }
  store.approvals = store.approvals.filter((a) => a.orderId !== orderId);
  revalidatePath("/", "layout");
}
