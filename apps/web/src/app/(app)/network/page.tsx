import { formatAmount } from "@hermes/shared";
import { ArrowUpRight, ExternalLink, FileCode2 } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { loadArtifacts, type OnChainArtifact } from "@/lib/data";
import { CASPER_NETWORK, contractUrl, deployUrl, shortHash } from "@/lib/explorer";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

const KIND_LABEL: Record<OnChainArtifact["kind"], string> = {
  contract_deploy: "Deploy",
  settlement: "Settlement",
  mint: "Mint",
  registry_write: "Registry",
  reputation_anchor: "Reputation",
};

export default async function NetworkPage() {
  const artifacts = await loadArtifacts();
  const contracts = artifacts.filter((a) => a.kind === "contract_deploy");
  const actions = artifacts.filter((a) => a.kind !== "contract_deploy");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Network"
          sub="Deployed contracts and every on-chain action, persisted for reference and management."
        />
        <a
          href={`https://${CASPER_NETWORK === "casper" ? "" : "testnet."}cspr.live`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-muted transition-colors hover:text-text"
        >
          <span className="font-mono text-xs">{CASPER_NETWORK}</span>
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-text-strong">Contracts</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {contracts.map((c) => {
            const standards = (c.metadata.standards as string[] | undefined) ?? [];
            const role = c.metadata.role as string | undefined;
            return (
              <Card key={c.id} className="flex h-full flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-medium text-text-strong">
                    <FileCode2 className="size-4 text-accent-soft" aria-hidden />
                    {c.label}
                  </span>
                  {c.metadata.deployTx ? (
                    <span className="font-mono text-xs text-text-subtle">
                      {String(c.metadata.deployTx)}
                    </span>
                  ) : null}
                </div>
                {standards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {standards.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                )}
                {role ? <p className="text-xs leading-relaxed text-text-muted">{role}</p> : null}
                {c.contractPackageHash ? (
                  <a
                    href={contractUrl(c.contractPackageHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 border-t border-border pt-3 font-mono text-xs text-accent-soft hover:underline"
                  >
                    {shortHash(c.contractPackageHash.replace(/^hash-/, ""), 10, 8)}
                    <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-text-strong">On-chain activity</h2>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wider text-text-subtle uppercase">
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Hash</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {actions.map((a) => {
                  const hash = a.deployHash ?? a.txHash;
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-surface-hover">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-strong">{a.label}</span>
                          <Badge>{KIND_LABEL[a.kind]}</Badge>
                          {a.simulated ? (
                            <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs text-warning">
                              simulated
                            </span>
                          ) : (
                            <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success">
                              on-chain
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {hash ? (
                          <a
                            href={deployUrl(hash)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono text-xs text-accent-soft hover:underline"
                          >
                            {shortHash(hash, 10, 8)}
                            <ArrowUpRight className="size-3" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-text-subtle">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                        {a.amount ? (
                          <>
                            {formatAmount(a.amount, 9)}{" "}
                            <span className="text-text-subtle">HERMES</span>
                          </>
                        ) : (
                          <span className="text-text-subtle">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-text-subtle">
                        {timeAgo(a.createdAt)}
                      </td>
                    </tr>
                  );
                })}
                {actions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-text-muted">
                      No on-chain actions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
