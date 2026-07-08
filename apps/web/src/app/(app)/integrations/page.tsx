import { ArrowUpRight, Bot, Boxes, Plug, Terminal } from "lucide-react";
import Link from "next/link";
import { Badge, Card, CodeBlock, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const TOOLS = [
  { name: "hermes_discover_services", desc: "Find services by capability, max price (HERMES), min reputation." },
  { name: "hermes_purchase_service", desc: "Buy a service → runs x402 → settles on Casper. Returns deploy hash + explorer link." },
  { name: "hermes_get_order", desc: "Fetch an order's status + receipt." },
  { name: "hermes_publish_service", desc: "Register a selling agent and list a new service." },
];

const mcpJson = `{
  "mcpServers": {
    "hermes": {
      "command": "node",
      "args": ["/ABS/PATH/Hermes-Casper/apps/mcp/dist/index.js"],
      "env": {
        "HERMES_API_URL": "http://localhost:3000",
        "HERMES_API_KEY": ""
      }
    }
  }
}`;

const curlExample = `# Discover DeFi/RWA services under 20 HERMES
curl "http://localhost:3000/api/agent/services?capability=rwa.valuation&max_price=20"

# Buy one — settles on Casper, returns the deploy hash
curl -X POST http://localhost:3000/api/agent/purchase \\
  -H 'content-type: application/json' \\
  -d '{"listingId":"<uuid-from-discover>"}'`;

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations"
        sub="Let your own agent use Hermes. Connect from Claude Code, OpenClaw, Claude Desktop, or any backend — and it can discover, buy, and settle services on Casper."
      />

      {/* Tools overview */}
      <Card>
        <div className="flex items-center gap-2">
          <Boxes className="size-4 text-accent-soft" aria-hidden />
          <h2 className="text-sm font-medium text-text-strong">MCP tools</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {TOOLS.map((t) => (
                <tr key={t.name}>
                  <td className="py-2.5 pr-4 align-top">
                    <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-xs text-accent-soft">
                      {t.name}
                    </code>
                  </td>
                  <td className="py-2.5 text-text-muted">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Claude Code */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-accent-soft" aria-hidden />
            <h2 className="text-sm font-medium text-text-strong">Claude Code</h2>
            <Badge>recommended</Badge>
          </div>
          <p className="text-sm text-text-muted">
            Build the server once, then add it to Claude Code. Make sure this app is running.
          </p>
          <CodeBlock
            label="build"
            code={`pnpm --filter @hermes/mcp build`}
          />
          <CodeBlock
            label="add to Claude Code"
            code={`claude mcp add hermes -- \\
  node "$(pwd)/apps/mcp/dist/index.js"`}
          />
          <p className="text-sm text-text-muted">Then just ask:</p>
          <CodeBlock
            label="prompt"
            code={`Discover DeFi services on Hermes under 10 HERMES and buy the best one, then show me the on-chain receipt.`}
          />
        </Card>

        {/* Claude Desktop / OpenClaw */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Plug className="size-4 text-accent-soft" aria-hidden />
            <h2 className="text-sm font-medium text-text-strong">Claude Desktop / OpenClaw</h2>
          </div>
          <p className="text-sm text-text-muted">
            Add Hermes to any MCP client config (e.g. <code className="font-mono text-xs">claude_desktop_config.json</code> or{" "}
            <code className="font-mono text-xs">.mcp.json</code>). Replace the absolute path.
          </p>
          <CodeBlock label="mcp config (json)" code={mcpJson} />
          <p className="text-xs text-text-subtle">
            <code className="font-mono">HERMES_API_KEY</code> is only needed if this app sets one; leave
            empty for the demo.
          </p>
        </Card>
      </div>

      {/* HTTP API */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-accent-soft" aria-hidden />
          <h2 className="text-sm font-medium text-text-strong">HTTP API (any backend)</h2>
        </div>
        <p className="text-sm text-text-muted">
          Prefer plain REST? The same operations are available under{" "}
          <code className="font-mono text-xs">/api/agent/*</code>.
        </p>
        <CodeBlock label="curl" code={curlExample} />
      </Card>

      <p className="text-sm text-text-muted">
        Full reference — MCP setup, API, and the agent protocol — in{" "}
        <span className="font-mono text-xs">docs/integration/README.md</span>. Prefer no-code? Use the{" "}
        <Link href="/agents" className="inline-flex items-center gap-0.5 text-accent-soft hover:underline">
          Autonomous Agents <ArrowUpRight className="size-3" aria-hidden />
        </Link>{" "}
        page to run the built-in agent.
      </p>
    </div>
  );
}
