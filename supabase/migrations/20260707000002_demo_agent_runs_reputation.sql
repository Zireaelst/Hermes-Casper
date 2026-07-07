-- DEMO ONLY: open agent_runs (autonomous agent traces) and reputation_scores
-- writes to the anon role, matching the other demo-open policies
-- (20260705000003_demo_open_policies.sql). Replace with owner-scoped policies
-- when auth lands.

-- agent_runs already has a public SELECT policy; add write access so the app can
-- persist autonomous run traces.
create policy demo_agent_runs_write on agent_runs
  for all to anon using (true) with check (true);

-- reputation_scores has public SELECT; allow writes so publishing a new seller
-- agent can set its starting reputation.
create policy demo_reputation_scores_write on reputation_scores
  for all to anon using (true) with check (true);

-- agents / listings have owner-scoped (auth.uid()) write policies that deny the
-- anon role. Open them for the publish flow (register agent + list service).
create policy demo_agents_write on agents
  for all to anon using (true) with check (true);
create policy demo_listings_write on listings
  for all to anon using (true) with check (true);
