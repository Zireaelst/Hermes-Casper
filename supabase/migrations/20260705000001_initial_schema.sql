-- Hermes initial schema. Spec: docs/product/database-schema.md
-- Conventions: snake_case plural, UUID PKs, created_at/updated_at, RLS deny-by-default.

create extension if not exists "pgcrypto";

-- Reusable updated_at trigger
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Enums
create type agent_kind         as enum ('operator_owned','external');
create type listing_status     as enum ('draft','active','paused','retired');
create type negotiation_status as enum ('open','accepted','rejected','expired');
create type offer_status       as enum ('proposed','countered','accepted','rejected','withdrawn');
create type order_status       as enum ('quoted','authorized','settling','settled','failed','cancelled');
create type payment_status     as enum ('authorized','verifying','settling','settled','failed','expired');
create type workflow_status    as enum ('pending','running','completed','failed','cancelled');
create type task_status        as enum ('pending','running','done','failed','skipped');
create type reputation_kind    as enum ('completed','failed','disputed');
create type run_status         as enum ('running','waiting_human','completed','failed');

-- agents
create table agents (
  id                  uuid primary key default gen_random_uuid(),
  owner_user_id       uuid references auth.users(id) on delete set null,
  kind                agent_kind not null default 'operator_owned',
  casper_account_hash text not null unique,
  public_key          text not null,
  display_name        text not null,
  capabilities        jsonb not null default '[]',
  metadata_uri        text,
  status              text not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index agents_owner_idx on agents(owner_user_id);
create trigger agents_touch before update on agents for each row execute function set_updated_at();

-- agent_keys (Signer references only — never raw keys)
create table agent_keys (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid not null references agents(id) on delete cascade,
  key_ref    text not null,
  algo       text not null,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index agent_keys_agent_idx on agent_keys(agent_id);
create trigger agent_keys_touch before update on agent_keys for each row execute function set_updated_at();

-- listings
create table listings (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references agents(id) on delete cascade,
  title        text not null,
  capability   text not null,
  price_amount numeric(39,0) not null,
  asset        text not null,
  terms        jsonb not null default '{}',
  status       listing_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index listings_capability_idx on listings(capability) where status = 'active';
create index listings_agent_idx on listings(agent_id);
create trigger listings_touch before update on listings for each row execute function set_updated_at();

-- negotiations
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

-- offers
create table offers (
  id             uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references negotiations(id) on delete cascade,
  from_agent_id  uuid not null references agents(id) on delete cascade,
  price_amount   numeric(39,0) not null,
  terms          jsonb not null default '{}',
  status         offer_status not null default 'proposed',
  round          int not null default 0,
  created_at     timestamptz not null default now()
);
create index offers_negotiation_idx on offers(negotiation_id);

-- orders
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

-- payments (nonce = idempotency / exactly-once)
create table payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  nonce        text not null unique,
  amount       numeric(39,0) not null,
  payer        text not null,
  payee        text not null,
  asset        text not null,
  status       payment_status not null default 'authorized',
  deploy_hash  text,
  valid_before timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index payments_order_idx on payments(order_id);
create trigger payments_touch before update on payments for each row execute function set_updated_at();

-- receipts (append-only)
create table receipts (
  id          uuid primary key default gen_random_uuid(),
  payment_id  uuid not null references payments(id) on delete restrict,
  deploy_hash text not null,
  amount      numeric(39,0) not null,
  payer       text not null,
  payee       text not null,
  settled_at  timestamptz not null,
  raw         jsonb not null,
  created_at  timestamptz not null default now(),
  unique (payment_id)
);
create index receipts_deploy_idx on receipts(deploy_hash);

-- workflows & tasks
create table workflows (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references orders(id) on delete set null,
  run_id     uuid,
  status     workflow_status not null default 'pending',
  graph      jsonb not null default '{}',
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
create trigger tasks_touch before update on tasks for each row execute function set_updated_at();

-- reputation
create table reputation_events (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references agents(id) on delete cascade,
  order_id     uuid references orders(id) on delete set null,
  kind         reputation_kind not null,
  weight       numeric not null default 1,
  on_chain_ref text,
  created_at   timestamptz not null default now()
);
create index reputation_events_agent_idx on reputation_events(agent_id);

create table reputation_scores (
  agent_id           uuid primary key references agents(id) on delete cascade,
  score              numeric not null default 0,
  anchor_deploy_hash text,
  updated_at         timestamptz not null default now()
);

-- agent_runs (traces)
create table agent_runs (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid references agents(id) on delete set null,
  status     run_status not null default 'running',
  cost_usd   numeric not null default 0,
  tokens     bigint not null default 0,
  trace      jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger agent_runs_touch before update on agent_runs for each row execute function set_updated_at();

-- spend_policies
create table spend_policies (
  id                 uuid primary key default gen_random_uuid(),
  agent_id           uuid not null references agents(id) on delete cascade,
  daily_budget       numeric(39,0) not null default 0,
  auto_approve_limit numeric(39,0) not null default 0,
  allowlist          jsonb not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (agent_id)
);
create trigger spend_policies_touch before update on spend_policies for each row execute function set_updated_at();
