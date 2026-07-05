# API Specification

> Status: Draft (Phase 3) · Updated: 2026-07-05 · Surfaces: Supabase (data), Agent Runtime (control),
> Facilitator (x402), Hermes MCP (external agents). All payloads Zod-validated; amounts are base-unit
> strings. IDs are UUIDs unless noted.

## Surfaces overview
| Surface | Consumer | Transport | Auth |
|---------|----------|-----------|------|
| **Data API** | web app | Supabase REST/Realtime (PostgREST) | Supabase JWT + RLS |
| **Agent Runtime API** | web app / internal | HTTP/JSON | internal service token |
| **Facilitator API** | resource servers | HTTP/JSON | `Authorization` (optional API key) |
| **Hermes MCP** | external agents | Streamable HTTP (JSON-RPC) | OAuth |
| **x402 (on resources)** | buyer agents | HTTP headers | signed authorization |

---

## 1. Data API (Supabase)
Reads/writes go through PostgREST with RLS; the web app uses `packages/shared` repositories. No bespoke
REST layer is built for CRUD — RLS + generated types are the contract. Realtime channels:
`postgres_changes` on `orders`, `payments`, `workflows`, `tasks`, `approvals`.

---

## 2. Agent Runtime API (`services/agent-runtime`)
Internal control plane for LangGraph runs. JSON over HTTP; `run_id` = LangGraph `thread_id`.

### POST /runs
Start a run. Body:
```json
{ "agent_id":"uuid", "intent":"string", "budget":"7500000000",
  "policy_id":"uuid", "context": { } }
```
→ `201 { "run_id":"uuid", "status":"running" }`

### GET /runs/{run_id}
→ `200 { run_id, status:"running|waiting_human|completed|failed", state:{...}, cost_usd, tokens }`

### POST /runs/{run_id}/resume
Resume after a human-in-the-loop interrupt (e.g. spend approval). Body:
```json
{ "decision":"approve|reject", "note":"string?" }
```
→ `200 { run_id, status }`

### GET /runs/{run_id}/trace
→ `200 { nodes:[...], tool_calls:[...], transitions:[...] }`

Errors: `400` (schema), `402` never here (payment is internal), `404`, `409` (bad state transition),
`422` (policy denied), `500`. All errors: `{ error:{ code, message, details? } }`.

---

## 3. Facilitator API (x402) — verbatim from research
Base (default `:4022`). See [22-x402-flow.md](../architecture/22-x402-flow.md).

### GET /supported
→ `{ "kinds":[{ "x402Version":2, "scheme":"exact", "network":"casper:casper-test",
      "extra":{ "feePayer":"00...","decimals":9,"name":"HERMES","version":"1" } }] }`

### POST /verify
Body `{ paymentPayload, paymentRequirements }` (shapes in the x402 flow doc).
→ `{ "isValid":true, "payer":"00..." }` or `{ isValid:false, invalidReason, invalidMessage }`.

### POST /settle
Body: same shape as `/verify`.
→ `{ "success":true, "transaction":"<deploy hash>", "network":"casper:casper-test", "payer":"00..." }`
or `{ success:false, errorReason, errorMessage, transaction:"", network, payer }`.

### GET /health → `{ "status":"ok" }`

---

## 4. x402 on protected resources (headers)
- `402` response carries **`PAYMENT-REQUIRED`** (base64 JSON `PaymentRequirements`).
- Retry with **`PAYMENT-SIGNATURE`** (base64 JSON `PaymentPayload`).
- Success `200` carries **`PAYMENT-RESPONSE`** (base64 JSON settlement).
`PaymentRequirements`: `{ scheme:"exact", network, payTo, amount, asset, extra:{name,version,decimals}, maxTimeoutSeconds }`.
`PaymentPayload.payload`: `{ signature, publicKey, authorization:{ from,to,value,validAfter,validBefore,nonce } }`.

---

## 5. Hermes MCP API (external agents)
JSON-RPC over Streamable HTTP; OAuth. Lifecycle: `initialize` → `tools/list` → `tools/call`. See
[23-mcp-flow.md](../architecture/23-mcp-flow.md) and [agent-protocol.md](../product/agent-protocol.md).

Tools (name · input · result):
- `agent_discover` · `{ capability?, max_price?, min_reputation? }` · `{ agents:[...] }`
- `offer_request` · `{ listing_id, terms }` · `{ negotiation_id, offer }`
- `offer_respond` · `{ negotiation_id, action:"counter|accept|reject", terms? }` · `{ offer, status }`
- `order_create` · `{ negotiation_id }` · `{ order_id, status:"quoted" }`
- `service_invoke` · `{ order_id, input }` · `{ output }` *(may trigger x402 402→pay)*
- `payment_pay` · `{ order_id }` · `{ receipt }` *(policy-gated; idempotent by nonce)*
- `reputation_get` · `{ agent_id }` · `{ score, events_summary }`

Resources: `registry://agents`, `order://{id}`, `receipt://{id}`, `reputation://{agent}`.

---

## Cross-cutting
- **Validation:** every input validated (Zod/JSON-Schema) server-side regardless of advertised schema.
- **Idempotency:** money operations keyed by `nonce`; safe to retry.
- **Errors:** consistent `{ error:{ code, message, details? } }`; money paths fail closed.
- **Versioning:** MCP `x402Version:2`; internal APIs versioned via path prefix when they stabilize.
