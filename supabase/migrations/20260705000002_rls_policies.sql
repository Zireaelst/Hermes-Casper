-- Hermes RLS. Deny-by-default: enable RLS on every table; only the policies
-- below grant access. service_role bypasses RLS (indexer/settlement writes).

alter table agents            enable row level security;
alter table agent_keys        enable row level security;
alter table listings          enable row level security;
alter table negotiations      enable row level security;
alter table offers            enable row level security;
alter table orders            enable row level security;
alter table payments          enable row level security;
alter table receipts          enable row level security;
alter table workflows         enable row level security;
alter table tasks             enable row level security;
alter table reputation_events enable row level security;
alter table reputation_scores enable row level security;
alter table agent_runs        enable row level security;
alter table spend_policies    enable row level security;

-- Operator manages their own agents
create policy agents_owner_rw on agents
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- Public marketplace reads
create policy agents_public_read on agents
  for select using (status = 'active');
create policy listings_public_read on listings
  for select using (status = 'active');
create policy reputation_scores_public_read on reputation_scores
  for select using (true);

-- Listing owners manage their listings
create policy listings_owner_rw on listings
  for all using (
    exists (select 1 from agents a where a.id = listings.agent_id and a.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from agents a where a.id = listings.agent_id and a.owner_user_id = auth.uid())
  );

-- Parties read their negotiations/offers/orders
create policy negotiations_party_read on negotiations
  for select using (
    exists (select 1 from agents a
            where a.id in (negotiations.buyer_agent_id, negotiations.seller_agent_id)
              and a.owner_user_id = auth.uid())
  );
create policy offers_party_read on offers
  for select using (
    exists (select 1 from negotiations n
            join agents a on a.id in (n.buyer_agent_id, n.seller_agent_id)
            where n.id = offers.negotiation_id and a.owner_user_id = auth.uid())
  );
create policy orders_party_read on orders
  for select using (
    exists (select 1 from agents a
            where a.id in (orders.buyer_agent_id, orders.seller_agent_id)
              and a.owner_user_id = auth.uid())
  );

-- Money rows: reads scoped to parties; NO write policies → service_role only.
create policy payments_party_read on payments
  for select using (
    exists (select 1 from orders o
            join agents a on a.id in (o.buyer_agent_id, o.seller_agent_id)
            where o.id = payments.order_id and a.owner_user_id = auth.uid())
  );
create policy receipts_party_read on receipts
  for select using (
    exists (select 1 from payments p
            join orders o on o.id = p.order_id
            join agents a on a.id in (o.buyer_agent_id, o.seller_agent_id)
            where p.id = receipts.payment_id and a.owner_user_id = auth.uid())
  );

-- Workflows/tasks/runs/policies: owner-scoped
create policy workflows_owner_read on workflows
  for select using (
    order_id is null or exists (
      select 1 from orders o
      join agents a on a.id in (o.buyer_agent_id, o.seller_agent_id)
      where o.id = workflows.order_id and a.owner_user_id = auth.uid())
  );
create policy tasks_owner_read on tasks
  for select using (
    exists (select 1 from workflows w where w.id = tasks.workflow_id)
  );
create policy agent_runs_owner_read on agent_runs
  for select using (
    agent_id is null or exists (
      select 1 from agents a where a.id = agent_runs.agent_id and a.owner_user_id = auth.uid())
  );
create policy spend_policies_owner_rw on spend_policies
  for all using (
    exists (select 1 from agents a where a.id = spend_policies.agent_id and a.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from agents a where a.id = spend_policies.agent_id and a.owner_user_id = auth.uid())
  );
create policy reputation_events_party_read on reputation_events
  for select using (
    exists (select 1 from agents a where a.id = reputation_events.agent_id and a.owner_user_id = auth.uid())
  );
create policy agent_keys_owner_read on agent_keys
  for select using (
    exists (select 1 from agents a where a.id = agent_keys.agent_id and a.owner_user_id = auth.uid())
  );
