---
name: deployment
description: Playbook for deploying Hermes — CI/CD, Vercel (web), Supabase (migrations + edge functions), Casper contract deploys (testnet→mainnet), secrets, and observability. Use for pipelines and releases.
---

# Deployment

## Purpose
Ship reproducibly and safely across web, backend, and chain.

## Scope
CI (lint/typecheck/test/contract build), CD for `apps/web` (Vercel), Supabase migrations + edge
functions, Casper contract deploys, secrets management, preview environments, and observability.

## Best Practices
- Required-green CI before deploy. Deploys are reproducible and rollback-able.
- **Testnet before mainnet** for contracts; follow the audit checklist; record deploy ids in `/docs`.
- Secrets only via platform vault / CI secrets; keep `.env.example` current; never log secrets.
- Preview environments per PR for web; migrations reviewed and applied via pipeline, not by hand.
- Observability: logs, traces (agent runs), and alerts on money-path failures.

## Constraints
- **No production/mainnet deploy without explicit human approval.** Fail closed on config/secret gaps.
- Never run destructive migrations without a reviewed rollback plan.

## Common Patterns
- **Pipeline stages:** install → lint → typecheck → test → build (+ contract build) → deploy.
- **Contract release:** build wasm → testnet deploy + verify → checklist → mainnet with approval.
- **Migration gate:** apply Supabase migrations in CD before app promotion.

## Hermes notes
Coordinate with the `devops` agent; document environments + deploy flow in `/docs/setup` and
`/docs/architecture` (deployment).
