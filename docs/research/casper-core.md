# Research: Casper core (RPC, SDK, wallet, events)

> Sources: https://docs.casper.network · https://github.com/casper-ecosystem/casper-js-sdk ·
> CSPR.click + CSPR.cloud (make-software) · Reviewed: 2026-07-05.
> **Verify exact `casper-js-sdk` signatures via Context7 at implementation time** — the SDK had a major
> v5 rewrite; do not rely on memory for method names.

## Architecture
Casper is a PoS smart-contract chain. Accounts are keyed by ed25519/secp256k1 keypairs; addresses
appear as **public keys** and **account hashes** (`00`/`01`-prefixed 66-hex for the x402 flow). State
changes happen via **deploys/transactions** submitted to a node's **JSON-RPC**. Contracts (built with
**Odra**, see [[odra-contracts]]) store state in named keys/dictionaries and emit **events** consumed
off-chain. Two networks matter: **mainnet** (`casper`, CAIP-2 `casper:casper`) and **testnet**
(`casper-test`, `casper:casper-test`).

## Key components
- **`casper-js-sdk`** (TypeScript): build/sign/submit deploys, query state/balances, read deploy
  results, work with CLValues and keys. Used by `@make-software/casper-x402`. *(Exact API surface:
  confirm via Context7 — v5 differs significantly from v2.)*
- **JSON-RPC:** `put_deploy`/transaction submission, `info_get_deploy`/status, state queries, block info.
  Deploy lifecycle: **build → sign → put_deploy → poll status → confirm finality**.
- **CSPR.click** (make-software): browser wallet-connect + auth SDK — connect Casper Wallet et al.,
  request signatures, manage sessions. Used for human-in-the-loop signing in the web app.
- **CSPR.cloud** (make-software): hosted, indexed data API + streaming for accounts, deploys, contracts,
  CEP-18/CEP-78 assets, and events. Preferred for **reads** and event consumption (needs an API key).
- **Casper Wallet** + **casper-wallet-sdk** (make-software): self-custody wallet + dApp integration SDK.
- **Events:** contract-emitted events (Odra `emit_event`) surfaced via node SSE / CSPR.cloud streaming →
  normalized by the Hermes indexer → Supabase.

## Best Practices
- Isolate all chain access behind an **adapter interface** in `packages/shared`; UI never calls RPC directly.
- Parameterize network + node/cloud endpoints via env (`CASPER_NODE_RPC_URL`, `CASPER_NETWORK_NAME`,
  `CSPR_CLOUD_API_KEY`); default to **testnet** in development.
- **Never handle raw private keys in app code or logs.** Human signing → CSPR.click; autonomous agent
  signing → a dedicated, secured signer (see open questions).
- Validate every RPC/cloud response with Zod at the adapter boundary; handle deploy finality explicitly.
- Reads via CSPR.cloud (indexed) for convenience; treat the chain as source of truth for money paths.

## Common Patterns (Hermes)
- **Wallet flow:** CSPR.click connect → session → build deploy → user signs → submit → track status in UI.
- **Autonomous agent flow:** agent produces an x402 EIP-712 authorization (no gas); the Hermes
  **facilitator** submits the settlement deploy and pays gas (see [[x402-payments]]).
- **Event indexer:** subscribe (CSPR.cloud) → normalize contract events → upsert Supabase mirror →
  Realtime to UI.

## Limitations / Notes
- Deploy finality is not instant — design for pending/confirmed states and idempotent retries.
- The community **Casper MCP** (`msanlisavas/casper-mcp`) is read-convenience only; verify on-chain
  behavior against docs/SDK/tests, never the MCP (see `.claude/context/tech-decisions.md`).
- `casper-js-sdk` v5 rewrite: pin the version and verify signatures before coding.

## Integration Opportunities
- Reuse make-software libraries end-to-end (CSPR.click, CSPR.cloud, casper-js-sdk, casper-x402) for a
  coherent, supported stack — Hermes's x402 dependency already pulls `casper-js-sdk`.
- CSPR.cloud streaming as the backbone of the event system → Supabase mirror → React Flow canvas.

## Notes specific to Hermes
- CAIP-2 network ids must match the x402 config (`casper:casper-test`). Payee = 66-char account hash.
- The x402 `asset` is a **CEP-18 contract package hash** — Hermes deploys/selects that token (Odra `cep18`).

## Open Questions
- **Agent signing without a human:** how do autonomous agents sign x402 authorizations securely? Managed
  signer service? KMS-held keys? This is a core security decision (see security architecture).
- CSPR.click autonomous compatibility vs a headless signer for agents.
- Self-hosted node RPC vs relying on CSPR.cloud for reads/streaming (availability + rate limits).
