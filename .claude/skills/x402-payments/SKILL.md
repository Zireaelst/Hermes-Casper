---
name: x402-payments
description: Playbook for x402 HTTP-native payments on Casper using @make-software/casper-x402 — server middleware, client signing, facilitator settlement, headers, and retry flow. Use for any agent payment or paywalled-resource work.
---

# x402 Payments (Casper)

## Purpose
Implement autonomous agent payments the correct, verified way with Casper x402.

## Scope
The `make-software/casper-x402` monorepo: TypeScript (`@make-software/casper-x402`, on `casper-js-sdk`)
and Go implementations — server middleware, client, and facilitator. CEP-18 token payments authorized
via signatures and settled on-chain with `transfer_with_authorization`.

## Best Practices
- **Read the repo + verify via Context7** before coding; mirror its server/client/facilitator split.
- Server: protect a resource → return **HTTP 402** with payment requirements → verify the submitted
  payment authorization via the facilitator → release the resource.
- Client (agent): on 402, construct + sign the payment authorization, retry the request with the
  payment header, then proceed. Make the retry idempotent.
- Keep amounts, token contract, and facilitator URL in config/env — never hardcode.

## Constraints
- Every spend passes a policy gate (budget/allowlist/human interrupt) before signing — see `langgraph-agents`.
- Exactly-once settlement; safe retries; log a **Receipt** for every payment. Fail closed on ambiguity.
- Do not invent headers/flows — match the repo's actual header names and sequence; cite the source.

## Common Patterns
- **Paywalled agent service:** middleware guards an endpoint; agent client auto-pays and retries.
- **Facilitator settlement:** verify authorization → submit `transfer_with_authorization` → confirm.
- **Receipt trail:** persist payment id, tx/deploy id, amount, payer/payee, status in Supabase.

## Hermes notes
x402 is the core of Hermes commerce. Design the whole payment/settlement subsystem around it and keep
the on-chain contract semantics consistent with the `odra-contracts` skill.
