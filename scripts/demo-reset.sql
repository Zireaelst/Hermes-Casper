-- Demo reset: return the Hermes backend to a clean, presentable baseline before a
-- live demo. Clears transactional state (orders/payments/receipts) and the
-- runtime settlement ledger entries, while KEEPING the durable setup:
-- agents, listings, spend policies, reputation, and the seeded on-chain artifacts
-- (contract deploys + the proven x402 settlement).
--
-- Run against the Hermes Supabase project, e.g.:
--   psql "$DATABASE_URL" -f scripts/demo-reset.sql
-- or paste into the Supabase SQL editor.

begin;

-- receipts -> orders (cascades payments). Order matters for the FK constraints.
delete from receipts;
delete from orders;               -- ON DELETE CASCADE removes the related payments
                                  -- (and ON DELETE SET NULL clears artifacts.order_id)

-- Drop only simulated or failed settlement records. Real on-chain successes and
-- the seeded contract deploys are kept as durable, verifiable evidence.
delete from onchain_artifacts
where kind = 'settlement'
  and (simulated = true or metadata->>'status' = 'failed');

commit;

-- Sanity check (optional):
--   select status, count(*) from orders group by status;
--   select kind, label, simulated from onchain_artifacts order by created_at;
