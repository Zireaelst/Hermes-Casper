import {
  BasicPolicyGate,
  DemoFacilitator,
  DemoRepo,
  DemoSigner,
  addAmounts,
  createDemoStore,
  type DemoStore,
} from "@hermes/shared";

/**
 * Demo-mode singleton store (survives dev hot-reload via globalThis).
 * Swapped for Supabase repos + real facilitator in sessions D/J — same interfaces.
 */
const g = globalThis as unknown as { __hermesStore?: DemoStore };

export function getStore(): DemoStore {
  g.__hermesStore ??= createDemoStore();
  return g.__hermesStore;
}

export function getDeps() {
  const store = getStore();
  return {
    store,
    repo: new DemoRepo(store),
    signer: new DemoSigner(),
    facilitator: new DemoFacilitator(),
    policyGate: new BasicPolicyGate(
      async () => store.policy,
      async () =>
        store.payments
          .filter((p) => p.status === "settled")
          .reduce((acc, p) => addAmounts(acc, p.amount), "0"),
    ),
  };
}
