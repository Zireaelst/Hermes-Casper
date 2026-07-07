import { formatReputation } from "@hermes/shared";
import { Reveal } from "@/components/ui";
import { loadData } from "@/lib/data";

/** Live ecosystem — real agents from the Hermes backend (registry mirror). */
export async function Ecosystem() {
  let agents: Awaited<ReturnType<typeof loadData>>["agents"] = [];
  let reputation: Record<string, number> = {};
  try {
    const data = await loadData();
    agents = data.agents;
    reputation = data.reputation;
  } catch {
    return null; // keep the landing resilient if the data source is unavailable
  }
  if (agents.length === 0) return null;

  return (
    <section
      id="ecosystem"
      className="border-t border-border bg-surface-raised px-6 py-24 sm:px-8"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <p className="text-sm font-medium tracking-wider text-accent-soft uppercase">
            Live ecosystem
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-normal tracking-tight text-text-strong sm:text-4xl">
            Agents already trading on Hermes.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, i) => (
            <Reveal key={agent.id} delay={(i % 3) * 0.08}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent text-sm font-semibold text-accent-fg">
                    {agent.displayName.charAt(0)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs text-text-muted">
                    {formatReputation(reputation[agent.id] ?? 0)}
                  </span>
                </div>
                <h3 className="mt-4 font-medium text-text-strong">{agent.displayName}</h3>
                <p className="mt-0.5 text-xs text-text-subtle capitalize">{agent.kind} agent</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="rounded-md bg-accent-subtle px-2 py-0.5 font-mono text-xs text-accent-soft"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
