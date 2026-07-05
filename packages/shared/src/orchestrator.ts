import type { Order, Payment, PaymentPayload, PaymentRequirements } from "@hermes/types";
import type { FacilitatorClient, PolicyGate, Repo, SignerClient } from "./adapters";
import { PolicyDeniedError, RequiresHumanApprovalError, SettlementError } from "./errors";
import { buildAuthorization } from "./x402-codec";

/**
 * In-process purchase orchestrator (MVP scope cut: replaces the LangGraph
 * service — see NEXT_SESSION.md). Drives one Order through:
 *   policy gate → sign authorization → facilitator verify → settle → receipt.
 * Idempotent by payment nonce; fail-closed on every ambiguous step.
 */
export interface PayForOrderDeps {
  policyGate: PolicyGate;
  signer: SignerClient;
  facilitator: FacilitatorClient;
  repo: Repo;
  /** Payment requirements as challenged by the seller's 402 (or derived from the Order). */
  requirements: PaymentRequirements;
  buyerAccountHash: string;
  agentKeyRef: string;
  now?: () => Date;
}

export interface PayForOrderResult {
  payment: Payment;
  deployHash: string;
}

export async function payForOrder(
  order: Order,
  deps: PayForOrderDeps,
): Promise<PayForOrderResult> {
  const decision = await deps.policyGate.evaluate({
    agentId: order.buyerAgentId,
    amount: deps.requirements.amount,
    payee: deps.requirements.payTo,
    asset: deps.requirements.asset,
    network: deps.requirements.network,
  });
  if (decision.kind === "denied") {
    throw new PolicyDeniedError(decision.reason);
  }
  if (decision.kind === "requires_human") {
    throw new RequiresHumanApprovalError(decision.reason);
  }

  const authorization = buildAuthorization({
    from: deps.buyerAccountHash,
    requirements: deps.requirements,
    nowSeconds: deps.now ? Math.floor(deps.now().getTime() / 1000) : undefined,
  });

  // Persist intent BEFORE signing (auditable; nonce = idempotency key).
  const nowIso = (deps.now?.() ?? new Date()).toISOString();
  const payment = await deps.repo.createPayment({
    id: crypto.randomUUID(),
    orderId: order.id,
    nonce: authorization.nonce,
    amount: authorization.value,
    payer: authorization.from,
    payee: authorization.to,
    asset: deps.requirements.asset,
    status: "authorized",
    deployHash: null,
    validBefore: new Date(Number(authorization.validBefore) * 1000).toISOString(),
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  const { signature, publicKey } = await deps.signer.signAuthorization(
    deps.agentKeyRef,
    authorization,
  );

  const payload: PaymentPayload = {
    x402Version: 2,
    scheme: "exact",
    network: deps.requirements.network,
    payload: {
      signature: signature as PaymentPayload["payload"]["signature"],
      publicKey: publicKey as PaymentPayload["payload"]["publicKey"],
      authorization,
    },
  };

  const verify = await deps.facilitator.verify(payload, deps.requirements);
  if (!verify.isValid) {
    throw new SettlementError(
      verify.invalidMessage ?? "payment verification failed",
      verify.invalidReason ?? "verification_failed",
    );
  }

  const settled = await deps.facilitator.settle(payload, deps.requirements);
  if (!settled.ok) {
    throw settled.error;
  }
  if (!settled.value.success || settled.value.transaction === "") {
    throw new SettlementError(
      settled.value.errorMessage ?? "settlement failed",
      settled.value.errorReason ?? "settle_failed",
    );
  }

  const deployHash = settled.value.transaction;
  await deps.repo.markSettled(payment.id, {
    id: crypto.randomUUID(),
    paymentId: payment.id,
    deployHash,
    amount: payment.amount,
    payer: payment.payer,
    payee: payment.payee,
    settledAt: (deps.now?.() ?? new Date()).toISOString(),
    raw: settled.value as unknown as Record<string, unknown>,
    createdAt: (deps.now?.() ?? new Date()).toISOString(),
  });

  return { payment: { ...payment, status: "settled", deployHash }, deployHash };
}
