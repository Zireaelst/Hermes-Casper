//! Deploys the Hermes contract set to a Casper livenet (testnet).
//!
//! Run (after building wasm with `cargo odra build`):
//!   cargo run --bin deploy_testnet --features livenet
//!
//! Requires these env vars (see docs/setup/testnet-deploy.md):
//!   ODRA_CASPER_LIVENET_SECRET_KEY_PATH  path to the funded account's secret_key.pem
//!   ODRA_CASPER_LIVENET_NODE_ADDRESS     e.g. https://node.testnet.casper.network/rpc
//!   ODRA_CASPER_LIVENET_CHAIN_NAME       casper-test
//!
//! Prints the three contract package/address hashes — copy them into
//! `apps/web/.env.local` (token) and the facilitator config.

use hermes_contracts::agent_registry::AgentRegistry;
use hermes_contracts::hermes_token::{HermesToken, HermesTokenInitArgs};
use hermes_contracts::reputation_anchor::ReputationAnchor;
use odra::casper_types::U256;
use odra::host::{Deployer, NoArgs};

fn main() {
    let env = odra_casper_livenet_env::env();

    // 1,000,000 HERMES at 9 decimals. chain_name seeds the x402 EIP-712 domain.
    env.set_gas(300_000_000_000u64);
    let token = HermesToken::deploy(
        &env,
        HermesTokenInitArgs {
            chain_name: "casper-test".to_string(),
            initial_supply: U256::from(1_000_000_000_000_000u64),
        },
    );
    println!("HermesToken      : {}", token.address().to_string());

    env.set_gas(150_000_000_000u64);
    let registry = AgentRegistry::deploy(&env, NoArgs);
    println!("AgentRegistry    : {}", registry.address().to_string());

    env.set_gas(150_000_000_000u64);
    let reputation = ReputationAnchor::deploy(&env, NoArgs);
    println!("ReputationAnchor : {}", reputation.address().to_string());
}
