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
import {
  clearApprovalDemo,
  createOrder,
  getDeps,
  getOrder,
  loadData,
  parkApprovalDemo,
  setOrderStatus,
} from "./data";

async function executePayment(order: Order, gateOverride?: PolicyGate): Promise<void> {
  const data = await loadData();
  const listing = data.listings.find((l) => l.id === order.listingId);
  const seller = data.agents.find((a) => a.id === order.sellerAgentId);
  if (!listing || !seller) throw new Error("listing/seller missing");
  const deps = getDeps();

  await setOrderStatus(order.id, "settling");
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
  } catch (error) {
    if (error instanceof RequiresHumanApprovalError) {
      await setOrderStatus(order.id, "authorized"); // parked awaiting human approval
      parkApprovalDemo(order.id, error.message);
      return;
    }
    await setOrderStatus(order.id, "failed");
    if (error instanceof PolicyDeniedError || error instanceof SettlementError) return;
    throw error;
  }
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
