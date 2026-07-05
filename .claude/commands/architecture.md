---
description: Design or update an architecture doc for a Hermes subsystem (no implementation code).
argument-hint: <subsystem, e.g. "payment flow" | "event system" | "agent orchestration">
---

Design the architecture for: **$ARGUMENTS**

Use the **architect** subagent and **Sequential Thinking**. Steps:
1. Restate problem, constraints, and assumptions. Verify all external facts via Context7/source.
2. Present 2–3 options with explicit trade-offs; recommend one with rationale.
3. Produce/update `docs/architecture/<kebab-subsystem>.md` with: context, component responsibilities,
   Mermaid diagram(s), data/event flow, interfaces at the edges, failure modes, security + money-path
   considerations (idempotent, fail-closed), and open questions.
4. Ensure consistency with existing architecture docs; update the `/docs/architecture` index.

Follow `CLAUDE.md` architecture principles. Do not write implementation code.
