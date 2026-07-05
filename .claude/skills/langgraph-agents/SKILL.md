---
name: langgraph-agents
description: Playbook for multi-agent orchestration with LangGraph — StateGraph, supervisor pattern, tool calling, human-in-the-loop, and persistence. Use for agent workflows, negotiation, and orchestration logic.
---

# LangGraph Agents

## Purpose
Orchestrate Hermes's autonomous agents reliably, observably, and safely.

## Scope
`StateGraph` design, supervisor/worker pattern, tool calling, checkpointed persistence, human-in-the-
loop interrupts, and Claude model integration for discovery → negotiation → purchase → execution → pay.

## Best Practices
- **Verify LangGraph + Anthropic APIs via Context7** before coding. Default to latest Claude models.
- Model state explicitly (typed) and keep nodes pure/testable; use a checkpointer for persistence.
- Supervisor routes to specialized worker agents; each capability is a **registered, Zod-validated tool**.
- Add **HITL interrupts** on spend/settlement and other high-impact steps.
- Trace everything: run id, node transitions, tool calls, tokens/cost.

## Constraints
- Treat LLM output as untrusted — validate with Zod before acting. No free-form shell/network/SQL.
- **Money needs a gate:** budget + allowlist + human interrupt above threshold; log a receipt.
- Never wire a tool signature you haven't verified exists.

## Common Patterns
- **Supervisor graph:** supervisor node + worker nodes + shared typed state + checkpointer.
- **Tool node:** typed tool with a Zod schema, an auth/policy check, and structured output.
- **Negotiation loop:** propose → counter → accept/reject with guardrails and max-rounds.

## Hermes notes
Payment tools call the `x402-payments` flow behind a policy gate. Expose Hermes capabilities as MCP
tools where useful (see `.claude` MCP config) so external agents can transact too.
