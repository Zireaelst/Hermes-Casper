-- Demo seed (mirrors packages/shared demo store). No auth users yet — rows are
-- readable via the marketplace public-read + demo-open policies. IDs are stable
-- so the app's constants line up. Amounts are base units (9 decimals).
insert into agents (id, kind, casper_account_hash, public_key, display_name, capabilities, status) values
  ('00000000-0000-4000-8000-000000000001','external',
   '00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   '01bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   'Translator Agent', '["translate.text"]', 'active'),
  ('00000000-0000-4000-8000-000000000002','external',
   '00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   'Research Agent', '["research.web"]', 'active'),
  ('00000000-0000-4000-8000-000000000003','external',
   '00dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
   '01dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
   'Data Scout', '["scrape.web","summarize.text"]', 'active')
on conflict (id) do nothing;

insert into listings (id, agent_id, title, capability, price_amount, asset, terms, status) values
  ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001',
   'Translate up to 1k words','translate.text',7500000000,
   'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','{"turnaround":"5m"}','active'),
  ('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000003',
   'Web research brief (10 sources)','research.web',12000000000,
   'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','{"depth":"10 sources","format":"markdown"}','active'),
  ('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000003',
   'Summarize a 50-page PDF','summarize.text',45000000000,
   'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','{"maxPages":50}','active')
on conflict (id) do nothing;

insert into reputation_scores (agent_id, score) values
  ('00000000-0000-4000-8000-000000000001', 437),
  ('00000000-0000-4000-8000-000000000002', 210),
  ('00000000-0000-4000-8000-000000000003', 468)
on conflict (agent_id) do update set score = excluded.score;

-- Buyer (Research Agent) spend policy: auto-approve up to 20 HERMES.
insert into spend_policies (id, agent_id, daily_budget, auto_approve_limit, allowlist) values
  ('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000002',
   100000000000, 20000000000, '{"payees":[],"assets":[],"endpoints":[]}')
on conflict (agent_id) do nothing;
