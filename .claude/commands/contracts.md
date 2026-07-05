---
description: Design, implement, or test Casper/Odra smart contracts.
argument-hint: <task, e.g. "escrow settlement contract" | "reputation anchor entry point">
---

Contract task: **$ARGUMENTS**

Use the **smart-contract** subagent and the `odra-contracts` + `x402-payments` skills. Rules:
- Verify Odra/Casper/x402 behavior via **Context7**/official docs or a passing test — never assume.
- Checks-Effects-Interactions; explicit access control; Odra error enums (+`revert`), no `unwrap()`/`panic!`.
- Emit an event per state mutation; align settlement with x402 `transfer_with_authorization`.
- Write unit + integration (Odra test env / testnet) tests. `cargo fmt` + `cargo clippy -D warnings`.
- Document entry points (access, inputs, events, state) in `/docs/contracts`. Testnet before mainnet.
- Report results truthfully. No mainnet deploy without the audit checklist and my approval.
