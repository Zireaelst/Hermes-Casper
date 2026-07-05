---
description: Prepare or run a deployment (web, Supabase, or Casper contracts) with checks and docs.
argument-hint: <target, e.g. "web preview" | "supabase migrations" | "contracts testnet">
---

Deploy target: **$ARGUMENTS**

Use the **devops** subagent and `deployment` skill. Rules:
- Require green CI (lint + typecheck + test + contract build) first. Confirm secrets/config are present.
- Web → Vercel (preview per PR); Supabase → apply migrations + edge functions via pipeline.
- Contracts → **testnet first**, verify, run the audit checklist, then mainnet **only with my approval**.
- Record deploy ids/URLs in `/docs/setup` (or `/docs/architecture` deployment). Never log secrets.
- Report exactly what ran and its outcome. No production/mainnet deploy without explicit approval.
