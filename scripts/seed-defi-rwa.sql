-- Seed the DeFi / RWA vertical agents + services (Casper Agentic Buildathon focus).
-- Mirrors packages/shared/src/demo.ts. Idempotent. Run against the Hermes project.

insert into agents (id, kind, casper_account_hash, public_key, display_name, capabilities, status) values
 ('00000000-0000-4000-8000-000000000004','external','00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee','01eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee','Aegis Risk Agent','["rwa.valuation","credit.score","rwa.compliance"]','active'),
 ('00000000-0000-4000-8000-000000000005','external','00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff','01ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff','Yield Scout','["defi.yield","defi.route"]','active')
on conflict (id) do nothing;

insert into reputation_scores (agent_id, score) values
 ('00000000-0000-4000-8000-000000000004', 452),
 ('00000000-0000-4000-8000-000000000005', 419)
on conflict (agent_id) do update set score = excluded.score;

insert into listings (id, agent_id, title, capability, price_amount, asset, terms, status) values
 ('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000004','RWA valuation report (tokenized real estate)','rwa.valuation','15000000000','846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c','{"assetClass":"real-estate","deliverable":"PDF + on-chain attestation"}','active'),
 ('00000000-0000-4000-8000-000000000105','00000000-0000-4000-8000-000000000005','DeFi yield scan across Casper pools','defi.yield','9000000000','846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c','{"horizon":"7d","format":"ranked JSON"}','active'),
 ('00000000-0000-4000-8000-000000000106','00000000-0000-4000-8000-000000000004','On-chain credit score for a counterparty','credit.score','6000000000','846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c','{"scale":"0-1000","basis":"on-chain history"}','active'),
 ('00000000-0000-4000-8000-000000000107','00000000-0000-4000-8000-000000000004','RWA compliance audit (KYC/AML attestation)','rwa.compliance','35000000000','846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c','{"jurisdiction":"EU","deliverable":"signed attestation"}','active')
on conflict (id) do nothing;
