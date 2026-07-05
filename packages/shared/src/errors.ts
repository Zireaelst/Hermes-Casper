/** Typed error classes for the domain. Never throw bare strings. */

export class HermesError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** External input (HTTP/RPC/DB/LLM) failed Zod validation at a boundary. */
export class ValidationError extends HermesError {
  constructor(message: string, details?: unknown) {
    super(message, "validation_error", details);
  }
}

/** A spend was rejected by the policy gate (budget/allowlist). */
export class PolicyDeniedError extends HermesError {
  constructor(message: string, details?: unknown) {
    super(message, "policy_denied", details);
  }
}

/** A spend requires human approval (HITL) before it can proceed. */
export class RequiresHumanApprovalError extends HermesError {
  constructor(message: string, details?: unknown) {
    super(message, "requires_human_approval", details);
  }
}

/** x402 verification or on-chain settlement failed. */
export class SettlementError extends HermesError {
  constructor(
    message: string,
    readonly reason: string,
    details?: unknown,
  ) {
    super(message, "settlement_error", details);
  }
}
