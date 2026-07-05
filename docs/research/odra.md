# Research: Odra (Casper smart contract framework)

> Source: https://odra.dev/docs (v2.8.0) · Repo: https://github.com/odradev/odra ·
> Reviewed: 2026-07-05. Snippets below are verbatim from `odradev/odra` `examples/`.

## Architecture
Odra is a Rust framework for Casper contracts that abstracts the low-level host API behind macros and
typed storage. The **same contract code** compiles to a Wasm **casper** backend (on-chain) and runs in
an in-memory **test/mock** backend for fast unit tests. Contracts are composed of **modules**; a module
is a struct of typed storage fields + an `impl` of entry points. Modules nest via `SubModule<T>` for
composition and reuse (e.g. pulling in `odra_modules` for CEP-18, access control, etc.).

## Core building blocks (APIs)
- **Module:** `#[odra::module]` on both a storage struct and its `impl`. Optional attrs:
  `#[odra::module(events = [E1, E2], errors = MyError)]`.
- **Storage types:** `Var<T>` (single value), `Mapping<K, V>` (key→value), `List<T>`, and `SubModule<T>`
  (nested module). Access via `self.env()` for host context.
- **Constructor:** a method named `init(...)` — generates `<Module>InitArgs` used at deploy.
- **Entry points:** `pub fn` in the `#[odra::module] impl`. `&self` = read, `&mut self` = state-mutating.
- **Host env (`self.env()`):** `caller()`, `get_block_time()`, `emit_event()`, `emit_native_event()`,
  `revert(err)`, plus native token / signature helpers.

### Storage (Var + Mapping)
```rust
use odra::prelude::*;

#[odra::module]
pub struct DogContract2 {
    name: Var<String>,
    friends: Mapping<String, u32>,
}

#[odra::module]
impl DogContract2 {
    pub fn init(&mut self, name: String) { self.name.set(name); }
    pub fn name(&self) -> String { self.name.get_or_default() }
    pub fn visit(&mut self, friend: &String) {
        let v = self.friends.get_or_default(friend);
        self.friends.set(friend, v + 1);
    }
}
```
Accessors: `set`, `get` (`Option`), `get_or_default`, `get_or_revert_with(err)`.

### Events
```rust
#[odra::module(events = [PartyStarted])]
pub struct PartyContract;

#[odra::event]
pub struct PartyStarted { pub caller: Address, pub block_time: u64 }

#[odra::module]
impl PartyContract {
    pub fn emit(&mut self) {
        self.env().emit_event(PartyStarted {
            caller: self.env().caller(),
            block_time: self.env().get_block_time(),
        });
        // self.env().emit_native_event(..) for Casper native events
    }
}
```
Test assertions: `env.emitted_event(&c, Event{..})`, `env.emitted(&c, "PartyStarted")`, `env.events_count(&c)`.

### Errors + access control
```rust
#[odra::module(errors = Error)]
pub struct OwnedContract { name: Var<String>, owner: Var<Address> }

#[odra::odra_error]
pub enum Error { OwnerNotSet = 1, NotAnOwner = 2 }

#[odra::module]
impl OwnedContract {
    pub fn init(&mut self, name: String) { self.name.set(name); self.owner.set(self.env().caller()); }
    pub fn owner(&self) -> Address { self.owner.get_or_revert_with(Error::OwnerNotSet) }
    pub fn change_name(&mut self, name: String) {
        if self.env().caller() != self.owner() { self.env().revert(Error::NotAnOwner) }
        self.name.set(name);
    }
}
```
For richer RBAC, nest `odra_modules::access::AccessControl` as a `SubModule` and use `grant_role`,
`revoke_role`, `has_role`, `set_admin_role`, `DEFAULT_ADMIN_ROLE` (roles are `keccak_256(name)`).

## Testing (HostEnv)
```rust
let env = odra_test::env();
let owner = env.get_account(0);
env.set_caller(owner);
let mut c = OwnedContract::deploy(&env, OwnedContractInitArgs { name: "X".into() });
// happy path: call directly -> panics/reverts on error
// error path: try_* variant returns Result
assert_eq!(c.try_change_name("N".into()).unwrap_err(), Error::NotAnOwner.into());
```
`use odra::host::{Deployer, NoArgs};` — `Deployer::deploy`, `NoArgs` for no-arg constructors,
`get_account(i)`, `set_caller`, and the `try_<method>()` variants that return `Result` for assertions.

## Best Practices
- Checks-Effects-Interactions; validate inputs; explicit access control per mutating entry point.
- No `unwrap()`/`panic!` on user paths — model an `#[odra::odra_error]` enum + `revert`/`get_or_revert_with`.
- Emit a domain event for **every** state mutation (drives the off-chain indexer).
- Compose with `SubModule` + `odra_modules` rather than reimplementing tokens/RBAC.
- Test both happy and error paths (`try_*`), plus events, in the fast test backend before testnet.
- `cargo fmt` + `cargo clippy -D warnings` clean; keep entry points small and gas-aware.

## Common Patterns (for Hermes)
- **Registry module:** `Mapping<AgentId, AgentRecord>` + events on register/update.
- **Escrow/settlement:** hold/authorize → verify → move funds → emit `Settled`. Keep consistent with
  the x402 CEP-18 `transfer_with_authorization` path (see [[x402-payments]]).
- **Reputation anchor:** store score/hash in a `Mapping`; rich metadata off-chain in Supabase.
- **RBAC:** `SubModule<AccessControl>` for admin/operator roles on privileged entry points.

## Limitations / Notes
- Rust/Wasm toolchain required; contract upgrades and gas need explicit design (`features/upgrade.rs`).
- `odra_modules` provides CEP-18 (`cep18`), access control, ownership, etc. — prefer these over custom.
- The **casper-x402 facilitator settles against a CEP-18 contract**; Hermes likely deploys a CEP-18
  token via `odra_modules` (or uses an existing one) as the x402 `asset`. Verify the token's package
  hash is what the facilitator/server config expects.

## Integration Opportunities
- Deploy Hermes's payment token (CEP-18 via `odra_modules`) + a registry/escrow/reputation contract set.
- Emit events consumed by the Supabase indexer to keep Orders/Payments/Reputation mirrors in sync.
- Use `features/signature_verifier.rs` patterns if on-chain signature checks are needed alongside x402.

## Open Questions
- Do we need custom on-chain escrow, or is x402 `transfer_with_authorization` sufficient for settlement?
- Reputation: fully on-chain scoring vs on-chain anchor of off-chain-computed scores?
- Upgrade strategy for the registry/reputation contracts (governed upgrade vs immutable + versioned)?
