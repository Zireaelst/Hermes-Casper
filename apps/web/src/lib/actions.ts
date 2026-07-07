"use server";

import type { PolicyGate } from "@hermes/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runAgent } from "./agent";
import { executePayment, publishService, purchaseService } from "./commerce";
import { clearApprovalDemo, getOrder, setOrderStatus } from "./data";

/** Marketplace "Buy now": create Order → policy gate → pay → settle (or park for HITL). */
export async function buyListing(formData: FormData): Promise<void> {
  const listingId = String(formData.get("listingId") ?? "");
  const outcome = await purchaseService(listingId);
  revalidatePath("/", "layout");
  redirect(`/orders/${outcome.orderId}`);
}

/** Approvals queue: a human approves a parked spend → gate is satisfied, pay proceeds. */
export async function approveSpend(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "");
  const order = await getOrder(orderId);
  if (!order || order.status !== "authorized") return;
  clearApprovalDemo(orderId);
  const humanApprovedGate: PolicyGate = { evaluate: async () => ({ kind: "approved" }) };
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

/** Marketplace: publish a new service (registers a seller agent if needed). */
export async function publishListingAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const capability = String(formData.get("capability") ?? "").trim();
  const agentName = String(formData.get("agentName") ?? "").trim();
  const priceHermes = Number(formData.get("price") ?? "0");
  if (!title || !capability || !agentName || !Number.isFinite(priceHermes) || priceHermes <= 0) {
    return;
  }
  // HERMES has 9 decimals; convert the human amount to base units.
  const priceAmount = BigInt(Math.round(priceHermes * 1e9)).toString();
  await publishService({ agentName, title, capability, priceAmount });
  revalidatePath("/", "layout");
  redirect("/marketplace");
}

/** Agent mode: run the autonomous buyer agent (discover → decide → settle). */
export async function runAgentAction(formData: FormData): Promise<void> {
  const goal = String(formData.get("goal") ?? "").trim();
  const budget = Number(formData.get("budget") ?? "0");
  const capability = String(formData.get("capability") ?? "").trim() || undefined;
  if (!goal || !Number.isFinite(budget) || budget <= 0) return;
  await runAgent({ goal, budgetHermes: budget, capability });
  revalidatePath("/", "layout");
  redirect("/agents");
}
