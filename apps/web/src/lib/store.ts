import { createDemoStore, type DemoStore } from "@hermes/shared";

/**
 * Demo-mode singleton store (survives dev hot-reload via globalThis). Used as the
 * fallback data source when Supabase env is absent (see lib/data.ts).
 */
const g = globalThis as unknown as { __hermesStore?: DemoStore };

export function getStore(): DemoStore {
  g.__hermesStore ??= createDemoStore();
  return g.__hermesStore;
}
