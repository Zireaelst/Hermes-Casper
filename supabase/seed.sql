-- Demo seed: two agents (a seller with a listing, a buyer) — no auth users, so
-- these rows are service-role/anon-marketplace visible only.
insert into agents (id, kind, casper_account_hash, public_key, display_name, capabilities, status)
values
  ('00000000-0000-4000-8000-000000000001', 'external',
   '00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   'Translator Agent', '["translate.text"]', 'active'),
  ('00000000-0000-4000-8000-000000000002', 'external',
   '00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   '01bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   'Research Agent', '["research.web"]', 'active');

insert into listings (id, agent_id, title, capability, price_amount, asset, terms, status)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001',
   'Translate up to 1k words', 'translate.text', 7500000000,
   'demo-asset-package-hash', '{"turnaround":"5m"}', 'active');

insert into reputation_scores (agent_id, score) values
  ('00000000-0000-4000-8000-000000000001', 437),
  ('00000000-0000-4000-8000-000000000002', 210);
