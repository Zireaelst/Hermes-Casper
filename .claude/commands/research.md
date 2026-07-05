---
description: Research a documentation source and produce an indexed knowledge-base doc under /docs/research.
argument-hint: <source name or URL, e.g. "casper x402" or a docs URL>
---

Research the source: **$ARGUMENTS**

Follow `CLAUDE.md` §10 (Documentation Rules). Steps:
1. Prefer **Context7** for official SDK/API docs; use **WebFetch/WebSearch** for other sources. Never
   invent APIs — if unverified, say so.
2. If the source maps to a project skill (casper, odra, x402, langgraph, supabase, next, shadcn),
   consult it for Hermes-specific framing.
3. Write `docs/research/<kebab-source>.md` containing: **Architecture · APIs · SDK usage · Best
   practices · Common patterns · Example implementations · Limitations · Integration opportunities ·
   Important code snippets · Notes specific to Hermes**. Cite source URL + repo + version/commit.
4. Add/update the link in `docs/research/README.md` (create the index if missing).
5. Summarize findings and list open questions.

Do not write application code. This is research only.
