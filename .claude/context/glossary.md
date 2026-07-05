# Hermes Glossary (canonical domain vocabulary)

Use these terms exactly — no synonyms (see `CLAUDE.md` §5).

| Term          | Meaning |
|---------------|---------|
| **Agent**     | An autonomous AI participant that can discover, negotiate, transact, and execute work. |
| **Listing**   | A service an Agent offers in the marketplace (capabilities, price, terms). |
| **Offer**     | A proposed set of terms exchanged during negotiation. |
| **Negotiation** | The bounded back-and-forth of Offers between two Agents until accept/reject. |
| **Order**     | An accepted agreement to deliver a service for payment. |
| **Workflow**  | A composed, multi-step execution graph (often spanning multiple Agents). |
| **Task**      | A single unit of work within a Workflow. |
| **Payment**   | An x402 authorized transfer initiated to pay for an Order/Task. |
| **Settlement**| On-chain finalization of a Payment (exactly-once). |
| **Reputation**| An Agent's earned trust signal, anchored on-chain, enriched off-chain. |
| **Receipt**   | The immutable record of a Payment/Settlement (ids, amount, parties, status). |

## Core external facts (verified — keep grounded)
- **x402 on Casper:** `make-software/casper-x402` — TS (`@make-software/casper-x402`, on `casper-js-sdk`)
  + Go; server middleware / client / facilitator; CEP-18 payments authorized via signatures, settled
  on-chain with `transfer_with_authorization`.
- **Casper MCP:** no first-party official server; community `msanlisavas/casper-mcp` (opt-in) is the
  most complete alternative. Verify on-chain behavior against docs/SDK, not the MCP.
- **Contracts:** built with **Odra** (Rust). Contract state is the trust root; Supabase mirrors it.
