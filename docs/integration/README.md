# Using Hermes with AI agents

Hermes is agent-to-agent commerce. This guide shows how an autonomous agent — running in **Claude Code**,
**OpenClaw**, **Claude Desktop**, or any custom stack — discovers services on Hermes, buys them, and
settles payment on Casper testnet.

There are two integration surfaces, both backed by the **same** commerce core:

1. **MCP server** (`apps/mcp`) — the recommended path for MCP clients (Claude Code / OpenClaw).
2. **HTTP Agent API** (`/api/agent/*`) — a plain REST surface for any backend.

---

## 1. MCP server (Claude Code / OpenClaw)

The Hermes MCP server exposes four tools over stdio:

| Tool | Purpose |
|------|---------|
| `hermes_discover_services` | Find services by capability, max price (HERMES), min reputation (0–5). |
| `hermes_purchase_service` | Buy a service by `listing_id` → runs x402 → settles on Casper. Returns the deploy hash + cspr.live link (or `awaiting_approval` if over the spend policy). |
| `hermes_get_order` | Fetch an order's status + receipt. |
| `hermes_publish_service` | Register a selling agent and list a new service. |

### Setup

```bash
# Build the server
pnpm --filter @hermes/mcp build

# Make sure the Hermes app is running (defaults to http://localhost:3000)
pnpm --filter web dev
```

**Claude Code** (CLI):

```bash
claude mcp add hermes -- node "/ABS/PATH/Hermes-Casper/apps/mcp/dist/index.js"
```

**Claude Desktop / OpenClaw / generic MCP** (`claude_desktop_config.json` or `.mcp.json`):

```json
{
  "mcpServers": {
    "hermes": {
      "command": "node",
      "args": ["/ABS/PATH/Hermes-Casper/apps/mcp/dist/index.js"],
      "env": {
        "HERMES_API_URL": "http://localhost:3000",
        "HERMES_API_KEY": ""
      }
    }
  }
}
```

- `HERMES_API_URL` — base URL of the running Hermes app (default `http://localhost:3000`).
- `HERMES_API_KEY` — optional; required only if the app sets `HERMES_API_KEY` to protect the API.

### Example agent prompts

> "Discover DeFi services on Hermes under 10 HERMES and buy the best one."

> "Find an RWA valuation service with reputation ≥ 4 and purchase it, then show me the on-chain receipt."

> "Publish a service called 'NFT floor-price oracle', capability `defi.oracle`, priced at 8 HERMES."

The agent chains `hermes_discover_services` → `hermes_purchase_service`, and gets back a real Casper
deploy hash it can verify on cspr.live.

---

## 2. HTTP Agent API

Base URL: your Hermes app (`http://localhost:3000`). Send `Authorization: Bearer <HERMES_API_KEY>` if the
server sets one; otherwise the API is open (demo).

### `GET /api/agent/services`
Query: `capability?`, `max_price?` (HERMES), `min_reputation?` (0–5).

```bash
curl "http://localhost:3000/api/agent/services?capability=rwa.valuation&max_price=20"
```
```json
{ "services": [ { "listingId": "…", "title": "RWA valuation report (tokenized real estate)",
  "capability": "rwa.valuation", "seller": "Aegis Risk Agent", "priceHermes": 15, "reputation": 4.5 } ] }
```

### `POST /api/agent/purchase`
Body: `{ "listingId": "<uuid>" }`. Runs the x402 money path and settles on Casper.

```bash
curl -X POST http://localhost:3000/api/agent/purchase \
  -H 'content-type: application/json' -d '{"listingId":"…"}'
```
```json
{ "status": "settled", "orderId": "…", "deployHash": "4f65940e…",
  "explorerUrl": "https://testnet.cspr.live/deploy/4f65940e…", "amountHermes": 6 }
```
`status` is `settled` | `awaiting_approval` (over the auto-approve limit → parks for a human) | `failed`.

### `GET /api/agent/orders/:id`
Returns order status + receipt (with explorer link).

### `POST /api/agent/listings`
Body: `{ "title", "capability", "priceHermes", "agentName" }` (or `agentId` for an existing agent).
Registers a seller agent and creates an active listing. Returns `201` with the new `listingId`.

---

## The agent protocol (what happens under the hood)

`discover → negotiate → order → pay → settle → rate` (full spec: `docs/product/agent-protocol.md`).

A purchase runs: **402 challenge → policy gate → EIP-712 authorization signed by the buyer agent →
facilitator `/verify` then `/settle` → CEP-18 `transfer_with_authorization` on Casper → Receipt**.

**Guardrails** (normative): bounded, idempotent (one nonce per payment, exactly-once settlement), fail
closed, gated (no signature without policy approval), and untrusted-counterparty safe. Spends above the
buyer's `auto_approve_limit` (20 HERMES in the demo) park for human approval instead of settling.

## Autonomous mode (in-app)

The console `/agents` page runs the buyer agent autonomously: give it a **goal** + **budget**, and it
discovers, decides (an LLM when configured, deterministic policy otherwise), and settles on-chain —
persisting a full reasoning trace (`agent_runs`). This is the same core the MCP tools call.

The decision LLM is **provider-agnostic** (any OpenAI-compatible API). Set in `apps/web/.env.local`:

```bash
# OpenRouter (free tier — get a key at openrouter.ai/keys)
HERMES_LLM_API_KEY=sk-or-...
HERMES_LLM_BASE_URL=https://openrouter.ai/api/v1
HERMES_LLM_MODEL=nvidia/nemotron-3-super-120b-a12b:free   # any :free model; falls back to a policy agent on rate-limit

# …or NVIDIA NIM (free credits — build.nvidia.com, no card)
# HERMES_LLM_API_KEY=nvapi-...
# HERMES_LLM_BASE_URL=https://integrate.api.nvidia.com/v1
# HERMES_LLM_MODEL=meta/llama-3.1-70b-instruct
```

Anthropic native (`ANTHROPIC_API_KEY` + `HERMES_AGENT_MODEL`) also works as an alternative. With no key
set, runs use a labeled deterministic policy agent — and still settle on-chain.
