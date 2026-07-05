# Research: Model Context Protocol (MCP)

> Source: https://modelcontextprotocol.io (architecture overview + spec) · Protocol version seen:
> `2025-06-18` · Reviewed: 2026-07-05.

## Architecture
Client–server over **JSON-RPC 2.0**. An **MCP Host** (AI app — e.g. Claude Code) spawns one **MCP
Client** per **MCP Server**, each with a dedicated connection. Two layers:
- **Data layer** — JSON-RPC protocol: lifecycle, capability negotiation, primitives, notifications.
- **Transport layer** — connection, framing, auth. Two transports: **stdio** (local process) and
  **Streamable HTTP** (remote; HTTP POST + optional SSE; supports bearer/API-key/custom headers; OAuth recommended).

## Lifecycle
Stateful. Handshake: client → `initialize` (with `protocolVersion`, `capabilities`, `clientInfo`) →
server responds with its `capabilities` + `serverInfo` → client sends `notifications/initialized`.
Capability negotiation declares which primitives + features (e.g. `listChanged`) each side supports;
incompatible versions terminate the connection.

## Primitives (the important part)
**Server → client (three core):**
- **Tools** — executable functions the model can invoke (`tools/list`, `tools/call`). Each has `name`
  (unique), `title`, `description`, and a JSON-Schema **`inputSchema`**. Results are a `content[]` array
  (text/image/resource types).
- **Resources** — contextual data (`resources/list`, `resources/read`); file contents, DB records, etc.
- **Prompts** — reusable interaction templates (`prompts/list`, `prompts/get`); system prompts, few-shots.

Discovery/retrieval/execution follow `*/list`, `*/get`/`*/read`, `tools/call`. Listings are dynamic.

**Client → server (richer interactions):**
- **Sampling** (`sampling/createMessage`) — server requests an LLM completion from the host (model-agnostic servers).
- **Elicitation** (`elicitation/create`) — server requests input/confirmation from the user.
- **Logging** — server sends log messages to the client.

**Utility:** **Notifications** (JSON-RPC, no `id`/response) e.g. `notifications/tools/list_changed`
(only if server declared `listChanged:true`); progress tracking; experimental durable **Tasks**.

## Example (verbatim shapes)
- `tools/call` params: `{ name, arguments }`; response: `{ content: [{ type:"text", text:"..." }] }`.
- Tool metadata: `{ name, title, description, inputSchema: { type:"object", properties, required } }`.

## Best Practices
- Give tools clear, namespaced `name`s (`agent_discover`, not `discover`) + precise `inputSchema`
  (drives validation and model accuracy).
- Prefer stdio for local dev servers; Streamable HTTP + OAuth for remote/multi-tenant servers.
- Use `listChanged` notifications when a server's tool set is dynamic (e.g. per-tenant capabilities).
- Validate all tool inputs server-side even though `inputSchema` is advertised; never trust the caller.
- Keep servers focused; expose Resources for read context and Tools for actions.

## Limitations / Notes
- MCP defines context exchange only — not how the host uses the LLM or manages context.
- Sampling/elicitation require host support; don't assume every host implements client primitives.
- Streamable HTTP superseded the older HTTP+SSE transport; target Streamable HTTP for remote servers.

## Integration Opportunities (Hermes)
- **Hermes-as-MCP-server:** expose agent-commerce capabilities (discover Listings, request Offers,
  place Orders, pay via x402, fetch Reputation) as MCP **tools** so any MCP host/agent can transact.
- Expose Resources for read context (agent registry, order status, receipts) and Prompts for common
  negotiation/onboarding flows.
- Wrap **x402-protected** paid tools (a tool call that triggers a 402 → pay → retry) — combine MCP tool
  discovery with the x402 payment flow (see [[x402-payments]]).
- The repo already consumes MCP servers (filesystem, context7, sequential-thinking, playwright,
  github, supabase, community casper) for development — see `docs/setup/mcp.md`.

## Notes specific to Hermes
- Our LangGraph agents ([[langgraph-agents]]) call tools; those tools can be local functions or MCP
  tools. Standardize on Zod/JSON-Schema-validated tool contracts and a policy gate on money tools.
- Protocol/tool schemas belong in `packages/types`; server implementation in `packages/shared` + an app.

## Open Questions
- Do we ship Hermes as a remote (Streamable HTTP + OAuth) MCP server, an SDK, or both?
- Which capabilities are free vs x402-paywalled at the tool level?
- Auth model for external agents connecting to the Hermes MCP server (OAuth scopes ↔ Casper identity)?
