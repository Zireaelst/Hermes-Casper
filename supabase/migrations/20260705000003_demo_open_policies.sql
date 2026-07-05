-- DEMO ONLY: the MVP has no auth yet, so the trusted server uses the anon key.
-- These open the transactional tables to the anon role. REMOVE when auth (owner_user_id)
-- lands; the production owner-scoped policies in 20260705000002_rls_policies.sql then take over.
create policy demo_orders_all   on orders   for all to anon using (true) with check (true);
create policy demo_payments_all on payments for all to anon using (true) with check (true);
create policy demo_receipts_all on receipts for all to anon using (true) with check (true);
create policy demo_spend_policies_read on spend_policies for select to anon using (true);
