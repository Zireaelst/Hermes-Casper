import type { SpendPolicy } from "@hermes/types";
import type { PolicyDecision, PolicyGate, SpendRequest } from "./adapters";
import { compareAmounts, withinBudget } from "./money";

/**
 * Budget + allowlist + threshold gate. Every autonomous spend passes through
 * here BEFORE any signature is produced (docs/architecture/20-payment-flow.md).
 * Fail closed: anything not explicitly allowed is denied or escalated.
 */
export class BasicPolicyGate implements PolicyGate {
  constructor(
    private readonly loadPolicy: (agentId: string) => Promise<SpendPolicy | null>,
    private readonly spentToday: (agentId: string) => Promise<string>,
  ) {}

  async evaluate(request: SpendRequest): Promise<PolicyDecision> {
    const policy = await this.loadPolicy(request.agentId);
    if (!policy) {
      return { kind: "denied", reason: "no spend policy configured for agent" };
    }

    const { payees, assets } = policy.allowlist;
    if (payees.length > 0 && !payees.includes(request.payee)) {
      return { kind: "denied", reason: `payee ${request.payee} not in allowlist` };
    }
    if (assets.length > 0 && !assets.includes(request.asset)) {
      return { kind: "denied", reason: `asset ${request.asset} not in allowlist` };
    }

    const spent = await this.spentToday(request.agentId);
    const remaining = subtractClamped(policy.dailyBudget, spent);
    if (!withinBudget(remaining, request.amount)) {
      return {
        kind: "denied",
        reason: `daily budget exceeded (remaining ${remaining}, requested ${request.amount})`,
      };
    }

    if (compareAmounts(request.amount, policy.autoApproveLimit) === 1) {
      return {
        kind: "requires_human",
        reason: `amount ${request.amount} exceeds auto-approve limit ${policy.autoApproveLimit}`,
      };
    }

    return { kind: "approved" };
  }
}

function subtractClamped(budget: string, spent: string): string {
  const b = BigInt(budget);
  const s = BigInt(spent);
  return s >= b ? "0" : (b - s).toString();
}
