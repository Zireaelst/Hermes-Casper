import { formatReputation } from "@hermes/shared";
import { Sidebar } from "@/components/console/Sidebar";
import { Topbar } from "@/components/console/Topbar";
import { loadData } from "@/lib/data";
import { getRuntimeMode } from "@/lib/mode";

const BUYER_AGENT_ID = "00000000-0000-4000-8000-000000000002";

// Console shell — light-first design system with a working dark toggle
// (next-themes). Live status chips reflect the real runtime configuration.
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const mode = getRuntimeMode();

  // Resiliently derive shell data; never let a data hiccup blank the console.
  let pendingApprovals = 0;
  let agentName = "Research Agent";
  let agentReputation = formatReputation(210);
  try {
    const data = await loadData();
    pendingApprovals = data.approvals.length;
    const buyer = data.agents.find((a) => a.id === BUYER_AGENT_ID) ?? data.agents[0];
    if (buyer) {
      agentName = buyer.displayName;
      agentReputation = formatReputation(data.reputation[buyer.id] ?? 0);
    }
  } catch {
    // fall back to defaults above
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        pendingApprovals={pendingApprovals}
        agentName={agentName}
        agentReputation={agentReputation}
        dataSource={mode.dataSource}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar mode={mode} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
