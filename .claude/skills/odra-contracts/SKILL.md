---
name: odra-contracts
description: Playbook for writing, testing, and deploying Casper smart contracts with the Odra (Rust) framework. Use for any on-chain contract work — modules, storage, entry points, events, errors, and tests.
---

# Odra Contracts

## Purpose
Build correct, auditable Casper contracts with Odra, aligned to x402 settlement.

## Scope
Odra modules, storage (`Var`, `Mapping`, `List`), entry points, events, error enums, access control,
Odra test environment, and testnet integration for Hermes payment/escrow/reputation/registry logic.

## Best Practices
- **Verify Odra APIs via Context7 / official Odra docs** and confirm behavior with a passing test.
- Checks-Effects-Interactions; validate all inputs; explicit access control per entry point.
- Model errors as an Odra error enum and `revert` — never `unwrap()`/`panic!` on user paths.
- Emit a domain event for every state mutation (consumed by the off-chain indexer).
- Keep contracts small and composable; document each entry point (access, inputs, events, state).

## Constraints
- `cargo fmt` + `cargo clippy -D warnings` must be clean. Deterministic, gas-aware code.
- No mainnet deploy without the audit checklist; testnet-first with integration tests.
- Money paths fail closed and are idempotent (align with x402 `transfer_with_authorization`).

## Common Patterns
- **Module + storage + events:** a module struct with typed storage, entry points, and event emits.
- **Escrow/settlement:** hold/authorize → verify signature/authorization → settle → emit `Settled`.
- **Reputation anchor:** store hashes/scores on-chain; rich metadata off-chain in Supabase.

## Hermes notes
Contracts are the trust root. Entry-point tables + specs live in `/docs/contracts`. Coordinate token
authorization semantics with the `x402-payments` skill.
