# Architecture: Smart Contracts (Odra)

> Status: Draft (Phase 2) · Updated: 2026-07-05 · Grounded in [[odra]], [[casper-x402]]. ADR-006 (own CEP-18).

## Purpose
The on-chain trust root: the payment token, agent identity/registry, settlement consistency, and
reputation anchoring. Everything money- or trust-critical is authoritative here.

## Contract set
| Contract | Built with | Responsibility |
|----------|-----------|----------------|
| **HermesToken** | `odra_modules::cep18` | CEP-18 unit of account (`HERMES`, 9 decimals). The x402 `asset`. Testnet faucet-mint for demos. |
| **AgentRegistry** | Odra module | `Mapping<AccountHash, AgentRecord>`; register/update capabilities + metadata pointer; events on change. |
| **ReputationAnchor** | Odra module | Stores per-agent score/hash (`Mapping`); off-chain-computed scores anchored on-chain; events on update. |
| **(optional) Escrow** | Odra module | Hold/release for disputable orders — only if refund/dispute path is in scope (open question). |

> **Settlement itself** is the x402 facilitator calling CEP-18 `transfer_with_authorization` — we do not
> reimplement transfer logic. Keep semantics identical to [[casper-x402]]; do not invent a settlement path.

## Odra idioms (per research)
- `#[odra::module]` structs with `Var`/`Mapping`/`SubModule`; `init` constructor.
- Access control via `SubModule<AccessControl>` (admin/operator roles) on privileged entry points.
- Errors via `#[odra::odra_error]` enum + `revert`/`get_or_revert_with` — no `unwrap()`/`panic!`.
- **Emit an event for every state mutation** (drives the indexer). Checks-Effects-Interactions.

## Events (consumed by the indexer)
`AgentRegistered/Updated`, `ReputationUpdated`, token `Transfer` (CEP-18), and (if used) `Escrowed/Released`.
Each carries the keys the indexer needs (`account_hash`, amounts, `deploy` context).

## Testing & deploy
- Odra test env: happy + error paths (`try_*`), event assertions, in the fast backend first.
- Testnet integration for the full x402 settle path against `HermesToken`.
- `cargo fmt` + `clippy -D warnings`; entry-point tables + gas/allowance notes in `/docs/contracts`.
- **Testnet before mainnet**; audit checklist + human approval before any mainnet deploy.

## Consistency with off-chain
`HermesToken` package hash = `X402_PAYMENT_TOKEN_CONTRACT`. Registry/reputation events are the source of
truth mirrored into Supabase. Single-use nonce (x402) enforces exactly-once settlement.

## Open questions
- Escrow needed for v1, or is reputation + upfront x402 payment sufficient?
- Reputation scoring model + who can write anchors (registry admin vs settlement-triggered).
- Upgrade strategy (governed upgrade vs immutable + versioned redeploy) for registry/reputation.
