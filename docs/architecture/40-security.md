# Architecture: Security

> Status: Draft (Phase 2) · Updated: 2026-07-05 · Money paths are the crown jewels.

## Threat model (what we protect)
1. **Agent operational keys** (Signer/KMS) — theft = fund drain.
2. **Facilitator gas key** — theft = gas drain / griefing (settlement SPOF, ADR-005).
3. **Autonomous spend** — a compromised/manipulated agent overspending.
4. **Data integrity** — mirror tampering diverging from chain truth.
5. **Prompt injection** — malicious content steering an agent into unauthorized actions/payments.

## Controls by layer
### Keys & signing (ADR-003)
- Operational keys in **KMS/vault**, never in app code/logs/env of `apps/web`. Signer returns signatures,
  never keys. Per-agent isolation; rotation + revocation supported.
- Signer signs **only** on a policy-gate-approved request; enforces its own **spend caps + rate limits**
  (defense in depth). Every signature is an auditable event linked to a `run_id` + Order.

### Spend policy gate
Budget + allowlist (payee/asset/endpoint) + threshold → **HITL interrupt** above limit. Emit a `payment`
intent row *before* signing. Bounded negotiation/retry loops. Fail closed on any ambiguity.

### Prompt-injection & tool safety
- LLM output is **untrusted**: no free-form shell/network/SQL; only Zod-validated registered tools.
- Money tools require the policy gate regardless of what the model "decided". Treat retrieved/counterparty
  content as hostile; never let it widen allowlists or budgets.

### Data & access
- **RLS deny-by-default** on every table; service-role key server-side only. `payments/receipts` write =
  service role (indexer/settlement) only.
- Chain is authoritative; the indexer reconciles the mirror; on-chain single-use nonce = exactly-once.
- Secrets per-service (gas key, KMS creds, service-role) — never in the client or `apps/web` bundle.

### Transport & identity
- MCP provider over Streamable HTTP + **OAuth**; per-tool authorization; rate limits on write/paid tools.
- Human auth via Supabase (+ CSPR.click wallet binding). External agent identity ↔ Casper account.

### Contracts
- Access control on privileged entry points (`SubModule<AccessControl>`); Checks-Effects-Interactions;
  no `unwrap`/`panic`; audit checklist + testnet-first before mainnet.

## Auditability
Every spend traceable: run → policy decision → signature → facilitator settle → deploy hash → Receipt.
Traces persisted and surfaced in the console.

## Fail-closed doctrine
On uncertainty in any money/settlement step: **stop, hold, alert** — never optimistically complete.

## Open questions
- KMS/HSM choice + key-derivation model (HD per agent vs discrete keys).
- Facilitator hardening (allowlist of assets/payees, per-key gas caps, anomaly detection).
- Formal review/audit scope before any mainnet exposure.
