---
name: testing
description: Playbook for testing Hermes — unit/integration (Vitest), E2E (Playwright), contract tests (Odra), fixtures, and money-path/idempotency testing. Use when adding coverage or verifying behavior.
---

# Testing

## Purpose
Prove correctness — especially on money and settlement paths — before anything ships.

## Scope
Vitest (unit/integration for `packages/*` + edge functions), Playwright E2E (via MCP), Odra contract
tests, fixtures/factories, and CI wiring.

## Best Practices
- Test behavior and boundaries first: invalid input, retries, partial failures, concurrency.
- **Money/settlement:** explicit idempotency + exactly-once settlement + retry-safety tests.
- Validate the Zod boundaries; assert on structured errors, not just happy paths.
- E2E covers real user + agent journeys; capture screenshots for demo verification.
- Keep tests deterministic (seed data, control time/randomness, no live network in unit tests).

## Constraints
- Never weaken assertions or delete failing tests to go green. Report failures with output.
- Required-green CI (lint + typecheck + test + contract build) before merge.

## Common Patterns
- **Adapter fakes:** in-memory fakes for Supabase/RPC/x402 to isolate domain logic.
- **Contract harness:** Odra test env for entry points + events; testnet integration for the full path.
- **E2E flow:** Playwright drives discovery → negotiate → pay → settle and asserts on-chain/UI state.

## Hermes notes
Coordinate with the `qa` agent; testing is part of Definition of Done in `CLAUDE.md`.
