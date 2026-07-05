# Database Schema (DDL)

> Status: Draft (Phase 3) · Updated: 2026-07-05 · Implements [30-database.md](../architecture/30-database.md).
> This is the **specification**; the authoritative migrations live in `supabase/migrations` (M1+).
> Postgres/Supabase. Conventions: `snake_case` plural, UUID PKs, `created_at`/`updated_at`, **RLS deny-by-default**.

## Conventions & helpers
```sql
-- Extensions
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- Reusable updated_at trigger
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Enums
create type agent_kind        as enum ('operator_owned','external');
create type listing_status    as enum ('draft','active','paused','retired');
create type negotiation_status as enum ('open','accepted','rejected','expired');
create type offer_status      as enum ('proposed','countered','accepted','rejected','withdrawn');
create type order_status      as enum ('quoted','authorized','settling','settled','failed','cancelled');
create type payment_status    as enum ('authorized','verifying','settling','settled','failed','expired');
create type workflow_status   as enum ('pending','running','completed','failed','cancelled');
create type task_status       as enum ('pending','running','done','failed','skipped');
create type reputation_kind   as enum ('completed','failed','disputed');
create type run_status        as enum ('running','waiting_human','completed','failed');
```

## Tables

### agents
```sql
create table agents (
  id                 uuid primary key default gen_random_uuid(),
  owner_user_id      uuid references auth.users(id) on delete set null, -- null for external agents
  kind               agent_kind not null default 'operator_owned',
  casper_account_hash text not null unique,        -- 66-char 00-prefixed
  public_key         text not null,
  display_name       text not null,
  capabilities       jsonb not null default '[]',
  metadata_uri       text,
  status             text not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index agents_owner_idx on agents(owner_user_id);
create trigger agents_touch before update on agents for each row execute function set_updated_at();
```

### agent_keys (Signer references only — never raw keys)
```sql
create table agent_keys (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid not null references agents(id) on delete cascade,
  key_ref    text not null,                         -- KMS/vault handle
  algo       text not null,                         -- ed25519 | secp256k1
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index agent_keys_agent_idx on agent_keys(agent_id);
```

### listings
```sql
create table listings (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references agents(id) on delete cascade,
  title        text not null,
  capability   text not null,
  price_amount numeric(39,0) not null,              -- base units (CEP-18, 9 decimals)
  asset        text not null,                        -- CEP-18 package hash
  terms        jsonb not null default '{}',
  status       listing_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index listings_capability_idx on listings(capability) where status = 'active';
create index listings_agent_idx on listings(agent_id);
create trigger listings_touch before update on listings for each row execute function set_updated_at();
```

### negotiations & offers
```sql
create table negotiations (
  id              uuid primary key default gen_random_uuid(),
  buyer_agent_id  uuid not null references agents(id) on delete cascade,
  seller_agent_id uuid not null references agents(id) on delete cascade,
  listing_id      uuid references listings(id) on delete set null,
  status          negotiation_status not null default 'open',
  max_rounds      int not null default 6,
  round           int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger negotiations_touch before update on negotiations for each row execute function set_updated_at();

create table offers (
  id              uuid primary key default gen_random_uuid(),
  negotiation_id  uuid not null references negotiations(id) on delete cascade,
  from_agent_id   uuid not null references agents(id) on delete cascade,
  price_amount    numeric(39,0) not null,
  terms           jsonb not null default '{}',
  status          offer_status not null default 'proposed',
  round           int not null default 0,
  created_at      timestamptz not null default now()
);
create index offers_negotiation_idx on offers(negotiation_id);
```

### orders
```sql
create table orders (
  id              uuid primary key default gen_random_uuid(),
  negotiation_id  uuid references negotiations(id) on delete set null,
  buyer_agent_id  uuid not null references agents(id),
  seller_agent_id uuid not null references agents(id),
  listing_id      uuid references listings(id) on delete set null,
  price_amount    numeric(39,0) not null,
  asset           text not null,
  status          order_status not null default 'quoted',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index orders_buyer_idx on orders(buyer_agent_id);
create index orders_status_idx on orders(status);
create trigger orders_touch before update on orders for each row execute function set_updated_at();
```

### payments (nonce = idempotency) & receipts (append-only)
```sql
create table payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  nonce        text not null unique,                 -- 32-byte hex; single-use (exactly-once)
  amount       numeric(39,0) not null,
  payer        text not null,                          -- account hash
  payee        text not null,
  asset        text not null,
  status       payment_status not null default 'authorized',
  deploy_hash  text,                                   -- set when settling
  valid_before timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index payments_order_idx on payments(order_id);
create trigger payments_touch before update on payments for each row execute function set_updated_at();

create table receipts (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid not null references payments(id) on delete restrict,
  deploy_hash text not null,
  amount      numeric(39,0) not null,
  payer       text not null,
  payee       text not null,
  settled_at  timestamptz not null,
  raw         jsonb not null,                          -- decoded PAYMENT-RESPONSE
  created_at  timestamptz not null default now(),
  unique (payment_id)
);
create index receipts_deploy_idx on receipts(deploy_hash);
```

### workflows & tasks
```sql
create table workflows (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references orders(id) on delete set null,
  run_id     uuid,                                    -- agent_runs.id
  status     workflow_status not null default 'pending',
  graph      jsonb not null default '{}',             -- nodes/edges snapshot for the canvas
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger workflows_touch before update on workflows for each row execute function set_updated_at();

create table tasks (
  id          uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  agent_id    uuid references agents(id) on delete set null,
  kind        text not null,
  status      task_status not null default 'pending',
  io          jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index tasks_workflow_idx on tasks(workflow_id);
```

### reputation
```sql
create table reputation_events (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references agents(id) on delete cascade,
  order_id    uuid references orders(id) on delete set null,
  kind        reputation_kind not null,
  weight      numeric not null default 1,
  on_chain_ref text,
  created_at  timestamptz not null default now()
);
create index reputation_events_agent_idx on reputation_events(agent_id);

create table reputation_scores (
  agent_id           uuid primary key references agents(id) on delete cascade,
  score              numeric not null default 0,
  anchor_deploy_hash text,
  updated_at         timestamptz not null default now()
);
```

### agent_runs (traces; LangGraph checkpoint tables managed separately by the checkpointer)
```sql
create table agent_runs (
  id         uuid primary key default gen_random_uuid(),  -- = LangGraph thread_id
  agent_id   uuid references agents(id) on delete set null,
  status     run_status not null default 'running',
  cost_usd   numeric not null default 0,
  tokens     bigint not null default 0,
  trace      jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger agent_runs_touch before update on agent_runs for each row execute function set_updated_at();
```

### spend_policies (budgets/allowlists/thresholds)
```sql
create table spend_policies (
  id                 uuid primary key default gen_random_uuid(),
  agent_id           uuid not null references agents(id) on delete cascade,
  daily_budget       numeric(39,0) not null default 0,
  auto_approve_limit numeric(39,0) not null default 0,   -- above → HITL
  allowlist          jsonb not null default '{}',        -- payees/assets/endpoints
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (agent_id)
);
create trigger spend_policies_touch before update on spend_policies for each row execute function set_updated_at();
```

## RLS (sketch — full policies in migrations)
```sql
alter table agents            enable row level security;
alter table listings          enable row level security;
alter table orders            enable row level security;
alter table payments          enable row level security;
alter table receipts          enable row level security;
alter table spend_policies    enable row level security;
-- (enable on every table)

-- Operator can see/manage their own agents
create policy agents_owner_rw on agents
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- Public read of active listings (marketplace)
create policy listings_public_read on listings
  for select using (status = 'active');

-- Orders visible to the parties' operators (via agent ownership)
create policy orders_party_read on orders for select using (
  exists (select 1 from agents a where a.id in (orders.buyer_agent_id, orders.seller_agent_id)
          and a.owner_user_id = auth.uid()));

-- payments/receipts: writes are service-role only (indexer/settlement); reads scoped to parties.
create policy payments_party_read on payments for select using (
  exists (select 1 from orders o join agents a
          on a.id in (o.buyer_agent_id, o.seller_agent_id)
          where o.id = payments.order_id and a.owner_user_id = auth.uid()));
-- No insert/update/delete policy → only service_role (which bypasses RLS) may write.
```

## Type generation
`supabase gen types typescript` → committed into `packages/types`. Domain Zod schemas in `packages/types`
validate at boundaries and must stay consistent with these tables.

## Notes
- `numeric(39,0)` holds CEP-18 base-unit amounts (no floats, ever).
- On-chain-mirrored money rows (`payments`, `receipts`) are written by the indexer/settlement path only.
- Enum + constraint changes go through new forward-only migrations — never edit an applied migration.
