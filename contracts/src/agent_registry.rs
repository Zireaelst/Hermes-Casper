//! AgentRegistry — on-chain agent identity. Maps a Casper account to a Hermes
//! agent record (capabilities digest + off-chain metadata pointer). Every state
//! mutation emits an event for the off-chain mirror.

use odra::prelude::*;

#[odra::odra_type]
pub struct AgentRecord {
    pub capabilities_hash: String,
    pub metadata_uri: String,
    pub active: bool,
}

#[odra::odra_error]
pub enum RegistryError {
    AlreadyRegistered = 1,
    NotRegistered = 2,
    NotAuthorized = 3,
}

#[odra::event]
pub struct AgentRegistered {
    pub agent: Address,
    pub capabilities_hash: String,
    pub metadata_uri: String,
}

#[odra::event]
pub struct AgentUpdated {
    pub agent: Address,
    pub capabilities_hash: String,
    pub metadata_uri: String,
}

#[odra::event]
pub struct AgentDeactivated {
    pub agent: Address,
}

#[odra::module(
    events = [AgentRegistered, AgentUpdated, AgentDeactivated],
    errors = RegistryError
)]
pub struct AgentRegistry {
    admin: Var<Address>,
    agents: Mapping<Address, AgentRecord>,
}

#[odra::module]
impl AgentRegistry {
    pub fn init(&mut self) {
        self.admin.set(self.env().caller());
    }

    /// Register the calling account as an agent. Access: any account, once.
    pub fn register(&mut self, capabilities_hash: String, metadata_uri: String) {
        let caller = self.env().caller();
        if self.agents.get(&caller).is_some() {
            self.env().revert(RegistryError::AlreadyRegistered);
        }
        self.agents.set(
            &caller,
            AgentRecord {
                capabilities_hash: capabilities_hash.clone(),
                metadata_uri: metadata_uri.clone(),
                active: true,
            },
        );
        self.env().emit_event(AgentRegistered {
            agent: caller,
            capabilities_hash,
            metadata_uri,
        });
    }

    /// Update the caller's own record. Access: registered owner.
    pub fn update(&mut self, capabilities_hash: String, metadata_uri: String) {
        let caller = self.env().caller();
        let record = self
            .agents
            .get(&caller)
            .unwrap_or_revert_with(&self.env(), RegistryError::NotRegistered);
        self.agents.set(
            &caller,
            AgentRecord {
                capabilities_hash: capabilities_hash.clone(),
                metadata_uri: metadata_uri.clone(),
                active: record.active,
            },
        );
        self.env().emit_event(AgentUpdated {
            agent: caller,
            capabilities_hash,
            metadata_uri,
        });
    }

    /// Deactivate an agent. Access: the agent itself or the admin.
    pub fn deactivate(&mut self, agent: Address) {
        let caller = self.env().caller();
        let admin = self
            .admin
            .get_or_revert_with(RegistryError::NotAuthorized);
        if caller != agent && caller != admin {
            self.env().revert(RegistryError::NotAuthorized);
        }
        let record = self
            .agents
            .get(&agent)
            .unwrap_or_revert_with(&self.env(), RegistryError::NotRegistered);
        self.agents.set(
            &agent,
            AgentRecord {
                active: false,
                ..record
            },
        );
        self.env().emit_event(AgentDeactivated { agent });
    }

    pub fn get(&self, agent: Address) -> Option<AgentRecord> {
        self.agents.get(&agent)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, NoArgs};

    #[test]
    fn register_update_deactivate_flow() {
        let env = odra_test::env();
        let admin = env.get_account(0);
        let alice = env.get_account(1);
        let mallory = env.get_account(2);
        let mut registry = AgentRegistry::deploy(&env, NoArgs);

        env.set_caller(alice);
        registry.register("cap-hash-1".to_string(), "ipfs://meta1".to_string());
        assert!(env.emitted(&registry, "AgentRegistered"));
        let rec = registry.get(alice).unwrap();
        assert!(rec.active);
        assert_eq!(rec.capabilities_hash, "cap-hash-1");

        // double-register reverts
        assert_eq!(
            registry
                .try_register("x".to_string(), "y".to_string())
                .unwrap_err(),
            RegistryError::AlreadyRegistered.into()
        );

        // update own record
        registry.update("cap-hash-2".to_string(), "ipfs://meta2".to_string());
        assert_eq!(registry.get(alice).unwrap().capabilities_hash, "cap-hash-2");

        // stranger cannot deactivate alice
        env.set_caller(mallory);
        assert_eq!(
            registry.try_deactivate(alice).unwrap_err(),
            RegistryError::NotAuthorized.into()
        );

        // admin can
        env.set_caller(admin);
        registry.deactivate(alice);
        assert!(!registry.get(alice).unwrap().active);
        assert!(env.emitted(&registry, "AgentDeactivated"));
    }

    #[test]
    fn unregistered_reads_and_updates() {
        let env = odra_test::env();
        let mut registry = AgentRegistry::deploy(&env, NoArgs);
        assert!(registry.get(env.get_account(3)).is_none());
        assert_eq!(
            registry
                .try_update("a".to_string(), "b".to_string())
                .unwrap_err(),
            RegistryError::NotRegistered.into()
        );
    }
}
