//! HERMES — the CEP-18 unit of account for Hermes commerce (ADR-006), with
//! CEP-3009 `transfer_with_authorization` so the x402 facilitator can settle
//! EIP-712-authorized payments gaslessly. Composition mirrors the upstream
//! `gasless_cep18` Odra example.
#![allow(clippy::too_many_arguments)]

use odra::casper_types::bytesrepr::Bytes;
use odra::casper_types::{PublicKey, U256};
use odra::prelude::*;
use odra_modules::cep18_token::Cep18;
use odra_modules::cep3009::CEP3009;

pub const HERMES_NAME: &str = "Hermes Credit";
pub const HERMES_SYMBOL: &str = "HERMES";
pub const HERMES_DECIMALS: u8 = 9;

#[odra::odra_error]
pub enum TokenError {
    /// Caller is not the minter (testnet faucet role).
    NotMinter = 1,
}

#[odra::event]
pub struct Minted {
    pub to: Address,
    pub amount: U256,
}

#[odra::module(events = [Minted], errors = TokenError)]
pub struct HermesToken {
    token: SubModule<Cep18>,
    cep3009: SubModule<CEP3009>,
    minter: Var<Address>,
}

#[odra::module]
impl HermesToken {
    /// `chain_name` seeds the EIP-712 domain (must match the facilitator's network config).
    pub fn init(&mut self, chain_name: String, initial_supply: U256) {
        self.cep3009.init(chain_name);
        self.token.init(
            HERMES_SYMBOL.to_string(),
            HERMES_NAME.to_string(),
            HERMES_DECIMALS,
            initial_supply,
        );
        self.minter.set(self.env().caller());
    }

    /// Testnet faucet: mint to any account. Access: minter (deployer) only.
    pub fn mint(&mut self, to: &Address, amount: &U256) {
        if self.env().caller() != self.minter.get_or_revert_with(TokenError::NotMinter) {
            self.env().revert(TokenError::NotMinter);
        }
        self.token.raw_mint(to, amount);
        self.env().emit_event(Minted {
            to: *to,
            amount: *amount,
        });
    }

    delegate! {
        to self.token {
            fn name(&self) -> String;
            fn symbol(&self) -> String;
            fn decimals(&self) -> u8;
            fn total_supply(&self) -> U256;
            fn balance_of(&self, owner: &Address) -> U256;
            fn transfer(&mut self, to: &Address, amount: &U256);
            fn approve(&mut self, spender: &Address, amount: &U256);
            fn allowance(&self, owner: &Address, spender: &Address) -> U256;
            fn transfer_from(&mut self, owner: &Address, recipient: &Address, amount: &U256);
        }

        to self.cep3009 {
            fn authorization_state(&self, authorizer: Address, nonce: Bytes) -> bool;
            fn transfer_with_authorization(&mut self, from: Address, to: Address, amount: U256, valid_after: u64, valid_before: u64, nonce: Bytes, public_key: PublicKey, signature: Bytes);
            fn receive_with_authorization(&mut self, from: Address, to: Address, amount: U256, valid_after: u64, valid_before: u64, nonce: Bytes, public_key: PublicKey, signature: Bytes);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::Deployer;

    fn setup() -> (odra::host::HostEnv, HermesTokenHostRef) {
        let env = odra_test::env();
        let token = HermesToken::deploy(
            &env,
            HermesTokenInitArgs {
                chain_name: "casper-test".to_string(),
                initial_supply: U256::from(1_000_000_000_000u64), // 1000 HERMES
            },
        );
        (env, token)
    }

    #[test]
    fn metadata_and_initial_supply() {
        let (env, token) = setup();
        assert_eq!(token.symbol(), "HERMES");
        assert_eq!(token.decimals(), 9);
        assert_eq!(token.total_supply(), U256::from(1_000_000_000_000u64));
        assert_eq!(
            token.balance_of(&env.get_account(0)),
            U256::from(1_000_000_000_000u64)
        );
    }

    #[test]
    fn minter_can_mint_others_cannot() {
        let (env, mut token) = setup();
        let alice = env.get_account(1);

        token.mint(&alice, &U256::from(7_500_000_000u64)); // 7.5 HERMES
        assert_eq!(token.balance_of(&alice), U256::from(7_500_000_000u64));
        assert!(env.emitted(&token, "Minted"));

        env.set_caller(alice);
        assert_eq!(
            token.try_mint(&alice, &U256::one()).unwrap_err(),
            TokenError::NotMinter.into()
        );
    }

    #[test]
    fn transfer_moves_balance() {
        let (env, mut token) = setup();
        let bob = env.get_account(2);
        token.transfer(&bob, &U256::from(500u64));
        assert_eq!(token.balance_of(&bob), U256::from(500u64));
    }

    #[test]
    fn unused_nonce_reports_false() {
        let (env, token) = setup();
        let nonce = Bytes::from(vec![7u8; 32]);
        assert!(!token.authorization_state(env.get_account(0), nonce));
    }
}
