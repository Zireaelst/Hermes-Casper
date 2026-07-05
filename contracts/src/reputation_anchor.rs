//! ReputationAnchor — anchors off-chain-computed reputation on-chain. Only the
//! `anchor_role` (a Hermes service account) may write; epochs are monotonic to
//! prevent replay/rollback.

use odra::prelude::*;

#[odra::odra_type]
pub struct ReputationRecord {
    /// Score scaled by 100 (e.g. 4.37 -> 437) to avoid decimals on-chain.
    pub score: u64,
    pub epoch: u64,
    /// Hex digest of the off-chain evidence set backing this score.
    pub digest: String,
}

#[odra::odra_error]
pub enum ReputationError {
    NotAuthorized = 1,
    StaleEpoch = 2,
}

#[odra::event]
pub struct ReputationUpdated {
    pub agent: Address,
    pub score: u64,
    pub epoch: u64,
    pub digest: String,
}

#[odra::module(events = [ReputationUpdated], errors = ReputationError)]
pub struct ReputationAnchor {
    anchor_role: Var<Address>,
    scores: Mapping<Address, ReputationRecord>,
}

#[odra::module]
impl ReputationAnchor {
    pub fn init(&mut self) {
        self.anchor_role.set(self.env().caller());
    }

    /// Anchor a score. Access: anchor_role only; epoch must strictly increase.
    pub fn anchor(&mut self, agent: Address, score: u64, epoch: u64, digest: String) {
        let role = self
            .anchor_role
            .get_or_revert_with(ReputationError::NotAuthorized);
        if self.env().caller() != role {
            self.env().revert(ReputationError::NotAuthorized);
        }
        if let Some(existing) = self.scores.get(&agent) {
            if epoch <= existing.epoch {
                self.env().revert(ReputationError::StaleEpoch);
            }
        }
        self.scores.set(
            &agent,
            ReputationRecord {
                score,
                epoch,
                digest: digest.clone(),
            },
        );
        self.env().emit_event(ReputationUpdated {
            agent,
            score,
            epoch,
            digest,
        });
    }

    pub fn get(&self, agent: Address) -> Option<ReputationRecord> {
        self.scores.get(&agent)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, NoArgs};

    #[test]
    fn anchor_enforces_role_and_epoch() {
        let env = odra_test::env();
        let alice = env.get_account(1);
        let mut anchor = ReputationAnchor::deploy(&env, NoArgs);

        anchor.anchor(alice, 437, 1, "abc123".to_string());
        let rec = anchor.get(alice).unwrap();
        assert_eq!(rec.score, 437);
        assert!(env.emitted(&anchor, "ReputationUpdated"));

        // stale epoch reverts
        assert_eq!(
            anchor
                .try_anchor(alice, 500, 1, "def".to_string())
                .unwrap_err(),
            ReputationError::StaleEpoch.into()
        );

        // newer epoch succeeds
        anchor.anchor(alice, 500, 2, "def456".to_string());
        assert_eq!(anchor.get(alice).unwrap().epoch, 2);

        // non-role caller reverts
        env.set_caller(alice);
        assert_eq!(
            anchor
                .try_anchor(alice, 999, 3, "zzz".to_string())
                .unwrap_err(),
            ReputationError::NotAuthorized.into()
        );
    }

    #[test]
    fn missing_agent_reads_none() {
        let env = odra_test::env();
        let anchor = ReputationAnchor::deploy(&env, NoArgs);
        assert!(anchor.get(env.get_account(4)).is_none());
    }
}
