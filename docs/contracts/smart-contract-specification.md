# Smart Contract Specification

> Status: Draft (Phase 3) · Updated: 2026-07-05 · Framework: **Odra** (Rust) · Network: Casper testnet.
> Grounded in [research/odra](../research/odra.md) + [research/casper-x402](../research/casper-x402.md).
> ADR-006 (own CEP-18). **Signatures/entry points below are the design intent — verify against Odra
> docs + passing tests before relying on them. Never claim unverified on-chain behavior.**

## Contract set
| Contract | Base | Purpose |
|----------|------|---------|
| `HermesToken` | `odra_modules::cep18` | CEP-18 unit of account (`HERMES`, 9 decimals). The x402 `asset`. |
| `AgentRegistry` | Odra module | On-chain agent identity + capability pointer. |
| `ReputationAnchor` | Odra module | Anchor off-chain-computed reputation on-chain. |
| `Escrow` *(optional, post-v1)* | Odra module | Hold/release for disputable Orders. |

---

## 1. HermesToken (CEP-18)
Deployed from `odra_modules::cep18`. Standard CEP-18 surface (`transfer`, `approve`, `transfer_from`,
`balance_of`, `total_supply`, `decimals`, `name`, `symbol`) plus the **`transfer_with_authorization`**
entry point the x402 facilitator settles against (EIP-712 authorized; single-use nonce).

- **Init args:** `name="Hermes Credit"`, `symbol="HERMES"`, `decimals=9`, `initial_supply`.
- **Access control:** a `minter` role (faucet for testnet demos) via `SubModule<AccessControl>`.
- **Events:** `Transfer`, `Approval` (CEP-18 standard) — consumed by the indexer for balances/receipts.
- **Notes:** its **package hash = `X402_PAYMENT_TOKEN_CONTRACT`**. Confirm the exact
  `transfer_with_authorization` signature matches what `casper-x402` expects (spike in M2).

---

## 2. AgentRegistry
Maps a Casper account to a Hermes agent record.

- **Storage:** `agents: Mapping<Address, AgentRecord>` where
  `AgentRecord { public_key, capabilities_hash, metadata_uri, active }`.
- **Entry points:**
  | fn | access | inputs | events | mutates |
  |----|--------|--------|--------|---------|
  | `init` | deployer | admin | — | sets admin |
  | `register` | caller (self) | `capabilities_hash, metadata_uri` | `AgentRegistered` | inserts record for `caller` |
  | `update` | record owner | `capabilities_hash?, metadata_uri?` | `AgentUpdated` | updates own record |
  | `deactivate` | owner or admin | `address` | `AgentDeactivated` | sets `active=false` |
  | `get` | anyone | `address` | — | reads |
- **Errors (`#[odra::odra_error]`):** `NotRegistered`, `NotOwner`, `AlreadyRegistered`.
- **Rules:** Checks-Effects-Interactions; `revert` on unauthorized; emit an event per mutation.

---

## 3. ReputationAnchor
Anchors reputation computed off-chain (default model: off-chain compute, on-chain anchor).

- **Storage:** `scores: Mapping<Address, ReputationRecord>` where
  `ReputationRecord { score, epoch, digest }` (`digest` = hash of the off-chain evidence set).
- **Entry points:**
  | fn | access | inputs | events | mutates |
  |----|--------|--------|--------|---------|
  | `init` | deployer | admin/anchor_role | — | sets roles |
  | `anchor` | `anchor_role` | `address, score, epoch, digest` | `ReputationUpdated` | upserts record |
  | `get` | anyone | `address` | — | reads |
- **Access:** only an `anchor_role` (held by a Hermes settlement/reputation service) may write.
- **Errors:** `NotAuthorized`, `StaleEpoch` (monotonic epoch to prevent replay/rollback).

---

## 4. Escrow (optional, post-v1)
Only if a refund/dispute path is in scope. Would hold buyer funds until delivery is confirmed, release to
seller or refund to buyer, and emit `Escrowed`/`Released`/`Refunded`. Kept **out of v1**; default relies
on reputation + upfront x402 payment.

---

## Cross-cutting rules (all contracts)
- Odra idioms: `#[odra::module]`, `Var`/`Mapping`/`SubModule`, `init` constructor, `emit_event`,
  `#[odra::odra_error]` + `revert`/`get_or_revert_with`. No `unwrap()`/`panic!` on user paths.
- **Emit an event for every state mutation** (indexer contract). Checks-Effects-Interactions everywhere.
- `cargo fmt` + `clippy -D warnings` clean. Each entry point documented (access, inputs, events, state).

## Testing & deployment
- **Unit:** Odra test env (`odra_test::env()`), happy + error paths (`try_*`), event assertions.
- **Integration:** testnet — full x402 settle path against `HermesToken`; registry/reputation writes.
- **Deploy:** testnet first; record package hashes + deploy ids in this folder; audit checklist + human
  approval before any mainnet deploy. Entry-point tables kept current here.

## Open questions
- Exact `transfer_with_authorization` interop shape with `casper-x402` (verify early).
- Reputation scoring formula + who holds `anchor_role`.
- Upgrade strategy (governed upgrade vs immutable + versioned redeploy).
