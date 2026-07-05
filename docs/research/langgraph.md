# Research: LangGraph (agent orchestration)

> Source: https://langchain-ai.github.io/langgraph + https://reference.langchain.com +
> https://github.com/langchain-ai/langgraph-supervisor-py · Reviewed: 2026-07-05.
> Note: the JS-rendered docs site resists scraping; API names below confirmed via reference docs/search.

## Architecture
LangGraph models agents as **state machines / graphs**, not ad-hoc chains. Core object is a
**`StateGraph`**: typed shared **State**, **nodes** (functions that read state → return partial
updates), and **edges** (fixed or **conditional**) between `START` and `END`. You `compile()` the graph
(optionally with a **checkpointer**) into a runnable. Checkpointing persists state after every node,
enabling multi-turn memory, fault tolerance, and human-in-the-loop **interrupts**.

## Core APIs
- **`StateGraph(State)`** → `.add_node()`, `.add_edge()`, `.add_conditional_edges()`, `START`, `END`,
  `.compile(checkpointer=?, store=?)`.
- **State + reducers:** typed dict / schema with reducers (e.g. `add_messages`) so concurrent node
  updates merge deterministically instead of overwriting.
- **Prebuilt agents:** `create_react_agent` (standard tool-calling ReAct loop) — *being superseded by
  `create_agent` (langchain package) with a middleware system*; start with the prebuilt, drop to a
  manual `StateGraph` when you need parallelism, custom branching, or multi-agent coordination.
- **Supervisor:** `create_supervisor` (`langgraph-supervisor`) returns a `StateGraph` you `.compile()`.
- **Handoffs / control flow:** return `Command(goto=<node>, update={...})` from a node to route + update
  state in one step (used for agent handoffs).
- **Persistence:** checkpointers (`MemorySaver` for dev; Postgres/SQLite savers for prod), keyed by a
  `thread_id` in the run config. Pairs naturally with Supabase Postgres.
- **Human-in-the-loop:** `interrupt(...)` pauses a node awaiting external input; resume with a `Command`.

## Multi-agent patterns (built-in)
- **Supervisor** — a router node owns the conversation and dispatches to specialist worker nodes that
  return to the supervisor. *(Hermes default.)*
- **Swarm** — workers hand off directly to each other without a central router.
- **Hierarchical** — supervisors of supervisors (teams of teams).

## Best Practices
- Model state explicitly and keep nodes pure/testable; use reducers for message/accumulator fields.
- Use a durable checkpointer in prod (Postgres) so runs survive restarts and support HITL.
- Put **interrupts on high-impact steps** — spend, settlement, irreversible actions.
- Every capability is a **registered, schema-validated tool**; treat LLM output as untrusted (validate
  before acting). No free-form shell/network/SQL from the model.
- Trace runs (run id, node transitions, tool calls, tokens/cost) for observability + cost control.
- Bound loops (max negotiation rounds, max retries) to guarantee termination.

## Common Patterns (Hermes)
- **Commerce supervisor graph:** supervisor routes to workers — `discovery`, `negotiation`, `purchase`,
  `execution`, `payment` — over shared typed state (current Order, budget, Offers).
- **Negotiation loop:** `propose → counter → accept/reject`, bounded rounds, guardrails on price/terms.
- **Payment node = policy gate + x402:** check budget/allowlist → `interrupt` above threshold for human
  approval → build + sign x402 authorization → settle → write Receipt (see [[x402-payments]]).
- **Tools as MCP tools:** expose/consume capabilities via MCP so external agents interoperate ([[mcp]]).

## Limitations / Notes
- API is evolving (`create_react_agent` → `create_agent` + middleware); pin versions and verify via
  `reference.langchain.com` before coding — do not rely on memory for exact signatures.
- Python is the most mature surface; a JS/TS variant exists (`langgraphjs`) — **decide language early**
  (Hermes backend is TS-heavy; a Python agent service may be cleaner for LangGraph maturity).

## Integration Opportunities
- Back the checkpointer with **Supabase Postgres** ([[supabase-backend]]) for unified persistence.
- Surface graph state (nodes/edges/transitions) to the **React Flow** workflow canvas via Realtime.
- Wrap Anthropic Claude (latest models) as the LLM; centralize model IDs in shared config.

## Open Questions
- **Language decision:** Python LangGraph service vs TS (`langgraphjs`)? Impacts repo layout + deploy.
- Where does the agent runtime run — a dedicated service, Supabase Edge Functions (limited), or a Node/
  Python worker? (Long-running graphs + checkpointing favor a dedicated service.)
- How do external third-party agents plug in — via the Hermes MCP server, or run their own graphs?
