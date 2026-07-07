-- On-chain artifact ledger: a durable record of every deployment / on-chain
-- action (contract deploys, settlements, mints, registry + reputation writes) so
-- deploy hashes, contract addresses, tx hashes, metadata and network info can be
-- referenced and managed later instead of living only in env/docs.
-- Spec: docs/contracts/README.md · source of truth mirror: packages/shared/src/deployments.ts

create table onchain_artifacts (
  id                    uuid primary key default gen_random_uuid(),
  -- contract_deploy | settlement | mint | registry_write | reputation_anchor
  kind                  text not null,
  label                 text not null,
  network               text not null default 'casper-test',
  contract_package_hash text,
  deploy_hash           text,
  tx_hash               text,
  address               text,
  amount                numeric(39,0),
  asset                 text,
  order_id              uuid references orders(id) on delete set null,
  payment_id            uuid references payments(id) on delete set null,
  simulated             boolean not null default false,
  metadata              jsonb not null default '{}',
  created_at            timestamptz not null default now()
);

create index onchain_artifacts_kind_idx    on onchain_artifacts(kind);
create index onchain_artifacts_network_idx on onchain_artifacts(network);
-- Idempotency: a given on-chain deploy is recorded once (nulls allowed for seeds).
create unique index onchain_artifacts_deploy_uidx
  on onchain_artifacts(deploy_hash) where deploy_hash is not null;

alter table onchain_artifacts enable row level security;

-- DEMO ONLY: open to the anon role (mirrors 20260705000003_demo_open_policies.sql).
-- Replace with owner-scoped policies when auth lands.
create policy demo_onchain_artifacts_all on onchain_artifacts
  for all to anon using (true) with check (true);

-- ── Seed: deployed contracts (Casper testnet, 2026-07-06) ─────────────────────
insert into onchain_artifacts (kind, label, network, contract_package_hash, address, metadata, created_at) values
  ('contract_deploy', 'HermesToken', 'casper-test',
   'hash-846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c',
   'hash-846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c',
   '{"standards":["CEP-18","CEP-3009"],"role":"Payment token settled via transfer_with_authorization (x402 asset).","deployTx":"846fdfc6…"}',
   '2026-07-06T00:00:00Z'),
  ('contract_deploy', 'AgentRegistry', 'casper-test',
   'hash-2135533ff2b3f75d6ecfafedb98427cdf3d4982064d5d7d57f068ec70edcd349',
   'hash-2135533ff2b3f75d6ecfafedb98427cdf3d4982064d5d7d57f068ec70edcd349',
   '{"role":"On-chain registry of agents and their capabilities.","deployTx":"9c706628…8c1541"}',
   '2026-07-06T00:00:00Z'),
  ('contract_deploy', 'ReputationAnchor', 'casper-test',
   'hash-8f6d6e6ab2f398cc2e139ab7a77e33d34ecb59953f0825df0277ed459e04cd4f',
   'hash-8f6d6e6ab2f398cc2e139ab7a77e33d34ecb59953f0825df0277ed459e04cd4f',
   '{"role":"Anchors reputation scores on-chain for verifiable counterparty trust.","deployTx":"6bf6bda7…5cfbb6"}',
   '2026-07-06T00:00:00Z');

-- ── Seed: proven end-to-end x402 settlement ───────────────────────────────────
insert into onchain_artifacts (kind, label, network, tx_hash, deploy_hash, amount, asset, metadata, created_at) values
  ('settlement', 'Proven x402 settlement', 'casper-test',
   '66151d11dc3b2d6ef356e243e885e21b10f4fefb1c51079d8eef48fbabef95bf',
   '66151d11dc3b2d6ef356e243e885e21b10f4fefb1c51079d8eef48fbabef95bf',
   '7500000000', '846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c',
   '{"scheme":"exact","onChain":true,"note":"transfer_with_authorization proven end-to-end (client + facilitator)."}',
   '2026-07-06T00:00:00Z');
