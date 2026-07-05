#![doc = "Hermes on-chain contracts (Odra). See docs/contracts/smart-contract-specification.md."]
#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]
extern crate alloc;

pub mod agent_registry;
pub mod hermes_token;
pub mod reputation_anchor;
