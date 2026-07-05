# Agent Protocol

> Status: Draft (Phase 3) · Updated: 2026-07-05 · The rules two Hermes agents follow to transact.
> Vocabulary is fixed (`.claude/context/glossary.md`). Wire surface: [API spec](../api/api-specification.md).

## 1. Purpose
A deterministic, guardrailed protocol for agent-to-agent commerce: **discover → negotiate → order →
pay → settle → rate**. Designed so autonomous agents interoperate safely (bounded, idempotent, gated).

## 2. Identity
- An **Agent** = a Casper account (`public_key` / `account_hash`) + a Hermes registry record
  (capabilities, metadata). External agents authenticate to the MCP surface via OAuth bound to their
  registered identity.
- Operational signing keys are held by the **Signer** (autonomous) or the operator's wallet (CSPR.click).

## 3. States (Order lifecycle)
`quoted → authorized → settling → settled` (happy path); `failed`/`cancelled`/`expired` as terminal
off-ramps. Payment sub-states: `authorized → verifying → settling → settled | failed | expired`
([payment flow](../architecture/20-payment-flow.md)).

## 4. Message exchange
### 4.1 Discovery
Buyer → `agent_discover { capability, max_price?, min_reputation? }` → candidate Agents + Listings.
Selection considers price, reputation, and capability match.

### 4.2 Negotiation (bounded)
- Opens a **Negotiation** (`max_rounds`, default 6). Parties exchange **Offers**:
  `propose → counter* → accept | reject`.
- Guardrails: price must stay within the buyer's remaining budget and the seller's floor; each `counter`
  increments `round`; exceeding `max_rounds` → `expired`.
- Terms are structured (`jsonb` + Zod): price, deliverable, deadline, refund policy (if escrow used).

### 4.3 Order
On `accept`, buyer calls `order_create` → **Order** (`quoted`) with final price/asset/terms. Optionally
pre-`/verify` the payment during quoting.

### 4.4 Payment (money gate)
1. Seller resource returns `402` + `PAYMENT-REQUIRED` (or buyer initiates `payment_pay`).
2. **Policy gate:** budget + allowlist + threshold → HITL interrupt if above `auto_approve_limit`.
3. Signer produces the EIP-712 authorization (single-use **nonce**).
4. Facilitator `/verify` then `/settle` → CEP-18 `transfer_with_authorization` deploy.
5. On confirmed settlement (via indexer) → **Receipt**; Order → `settled`.

### 4.5 Execution & rating
Seller delivers the service (may be gated by settlement or delivered-then-paid per terms). On completion/
failure, a **reputation_event** is recorded and anchored on-chain.

## 5. Guardrails (normative)
- **Bounded:** negotiations and retries have hard caps → guaranteed termination.
- **Idempotent:** one nonce per Payment; re-sends are no-ops; exactly-once settlement.
- **Fail closed:** any ambiguity in verify/settle holds the Order and never marks paid optimistically.
- **Gated:** no signature without policy approval; every spend yields an auditable Receipt.
- **Untrusted counterparty:** never let counterparty content widen budget/allowlist or bypass the gate.

## 6. Errors & disputes
Facilitator error codes (`amount_mismatch`, `payload_expired`, `invalid_signature`, …) surface as
Payment `failed` with a reason. Expired authorizations are safely retryable with a fresh nonce. Disputes
(service not delivered) → reputation penalty in v1; escrow-based refunds are a post-v1 option (open Q).

## 7. Versioning
Protocol tracks x402 `x402Version: 2`. Additive tool changes are backward compatible; breaking changes
bump a protocol version advertised at MCP `initialize`.
