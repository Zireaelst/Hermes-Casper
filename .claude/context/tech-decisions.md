# Architecture Decision Log (seed)

Lightweight ADRs. One entry per significant decision. Newest on top.
Format: **ADR-NNN — Title** · Status · Context · Decision · Consequences.

---

## ADR-006 — Payment token: deploy Hermes's own CEP-18 on testnet
- **Status:** Proposed — default, **review requested** (2026-07-05)
- **Context:** x402 settles CEP-18 tokens; the facilitator/server config needs a fixed `asset`
  (contract-package hash). We need a stable unit of account for testnet.
- **Options:** (a) deploy our own CEP-18 via `odra_modules::cep18`; (b) use an existing testnet token.
- **Decision:** Deploy **`HERMES` (CEP-18, 9 decimals)** via Odra as the unit of account on testnet;
  faucet-mint for demos. Revisit a stablecoin peg for mainnet.
- **Consequences:** Full control of supply/decimals/faucet for demos; one more contract to deploy +
  maintain. `X402_PAYMENT_TOKEN_CONTRACT` = its package hash.

## ADR-005 — x402 facilitator: single first-party Hermes-hosted service
- **Status:** Proposed — default, **review requested** (2026-07-05)
- **Context:** The facilitator is the only role holding a funded (gas-paying) Casper key and performs
  on-chain settlement. Someone must custody that key.
- **Options:** (a) one shared Hermes-hosted facilitator; (b) per-operator facilitators.
- **Decision:** Run **one shared, first-party facilitator** (from the `casper-x402` JS example) with its
  key in the platform secret vault/KMS. Multi-tenant/per-operator facilitators are a later concern.
- **Consequences:** Simple, controllable settlement + receipts; the facilitator is a settlement SPOF and
  a security-critical service (rate-limit, monitor, fund carefully). It is the trust boundary for gas.

## ADR-004 — Agent runtime: Python LangGraph service, isolated behind an API
- **Status:** Proposed — default, **review requested** (2026-07-05)
- **Context:** LangGraph's most mature surface (persistence, HITL, supervisor) is Python; the rest of the
  stack is TS (Next/Supabase) + Rust (Odra). Autonomous agents need durable, checkpointed graphs.
- **Options:** (a) Python LangGraph service; (b) TS `langgraphjs` inside the monorepo.
- **Decision:** Run agents in a **dedicated Python `services/agent-runtime`** exposing an internal HTTP +
  MCP boundary; keep language isolated behind that contract so the TS app never imports it. Checkpointer
  backed by Supabase Postgres.
- **Consequences:** Best-in-class orchestration; adds a 4th language + a service to deploy. Clean seam
  means we can swap to `langgraphjs` later without touching the app. Long-running graphs live here (not
  Supabase Edge Functions).

## ADR-003 — Autonomous agent signing: managed KMS-backed signer service
- **Status:** Proposed — default, **review requested** (2026-07-05)
- **Context:** Autonomous agents must sign x402 (EIP-712) payment authorizations with **no human
  present**; CSPR.click covers human-in-the-loop signing only. Raw keys must never touch app code.
- **Options:** (a) managed signer service holding agent operational keys in KMS/vault behind a policy
  gate; (b) CSPR.click only (blocks autonomy); (c) keys in the agent process (unsafe).
- **Decision:** A **Signer service** custodies per-agent operational keys in a KMS/vault and signs
  **only** after the LangGraph **policy gate** passes (budget + allowlist + HITL-above-threshold); every
  signature emits a Receipt. Humans still sign wallet actions via **CSPR.click** in the web app.
- **Consequences:** Enables autonomous payments with auditable, policy-bounded signing; introduces a
  high-value key-custody service that is security-critical (isolation, rate limits, spend caps, audit).

## ADR-002 — Casper MCP: use community server, opt-in
- **Status:** Accepted (2026-07-05)
- **Context:** The brief asks for an official Casper MCP. Verification shows **no first-party official
  server**; the AI Toolkit references community-built ones.
- **Decision:** Integrate `msanlisavas/casper-mcp` as an **opt-in, unverified-third-party** server
  (left out of the default `enabledMcpjsonServers`); treat it as read convenience, not truth. Revisit
  vs `Tairon-ai/casper-network-mcp` / CasperAgentKit in Phase 1.
- **Consequences:** On-chain behavior must be verified against docs/SDK/tests, never the MCP.

## ADR-001 — Project-scoped MCP via `.mcp.json`
- **Status:** Accepted (2026-07-05)
- **Context:** Team needs consistent, shareable tooling; brief prefers repo-level over global config.
- **Decision:** Commit `.mcp.json` at the repo root; secrets via local `.env`; personal overrides in
  git-ignored `.claude/settings.local.json`.
- **Consequences:** Reproducible toolchain; secrets stay local; setup documented in `docs/setup/mcp.md`.
