#!/usr/bin/env node
/**
 * Hermes MCP server.
 *
 * Exposes the Hermes agent-commerce API as Model Context Protocol tools so any
 * MCP client — Claude Code, OpenClaw, Claude Desktop, custom agents — can act as
 * an autonomous buyer or seller: discover services, purchase them (settling on
 * Casper testnet over x402), publish their own services, and check orders.
 *
 * Config (env):
 *   HERMES_API_URL   base URL of the Hermes app (default http://localhost:3000)
 *   HERMES_API_KEY   optional bearer token if the API is protected
 *
 * Transport: stdio. Run with `node dist/index.js` from an MCP client config.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = process.env.HERMES_API_URL ?? "http://localhost:3000";
const KEY = process.env.HERMES_API_KEY;

async function api(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(KEY ? { authorization: `Bearer ${KEY}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Hermes API ${res.status}: ${detail}`);
  }
  return data;
}

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};
const ok = (data: unknown): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});
const fail = (e: unknown): ToolResult => ({
  content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
  isError: true,
});

const server = new McpServer({ name: "hermes", version: "0.1.0" });

server.registerTool(
  "hermes_discover_services",
  {
    title: "Discover services",
    description:
      "Find agent services on the Hermes marketplace. Optionally filter by capability, max price (in HERMES), and minimum reputation (0–5). Returns listings with listingId, price, seller, and reputation.",
    inputSchema: {
      capability: z
        .string()
        .optional()
        .describe("capability filter, e.g. 'rwa.valuation', 'defi.yield', 'translate.text'"),
      max_price: z.number().optional().describe("maximum price in HERMES"),
      min_reputation: z.number().optional().describe("minimum reputation, 0–5"),
    },
  },
  async ({ capability, max_price, min_reputation }) => {
    try {
      const qs = new URLSearchParams();
      if (capability) qs.set("capability", capability);
      if (max_price != null) qs.set("max_price", String(max_price));
      if (min_reputation != null) qs.set("min_reputation", String(min_reputation));
      return ok(await api(`/api/agent/services?${qs.toString()}`));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "hermes_purchase_service",
  {
    title: "Purchase a service",
    description:
      "Buy a service by its listingId. Runs the x402 flow (policy gate → sign → settle) and settles on Casper testnet. Returns the on-chain deploy hash + cspr.live link when settled, or status 'awaiting_approval' if the spend exceeds the buyer's auto-approve policy.",
    inputSchema: {
      listing_id: z.string().describe("the listingId returned by hermes_discover_services"),
    },
  },
  async ({ listing_id }) => {
    try {
      return ok(
        await api(`/api/agent/purchase`, {
          method: "POST",
          body: JSON.stringify({ listingId: listing_id }),
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "hermes_get_order",
  {
    title: "Get order status",
    description:
      "Fetch an order's status and receipt (including the cspr.live explorer link) by orderId.",
    inputSchema: { order_id: z.string().describe("the orderId returned by a purchase") },
  },
  async ({ order_id }) => {
    try {
      return ok(await api(`/api/agent/orders/${order_id}`));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "hermes_publish_service",
  {
    title: "Publish a service",
    description:
      "List a new service other agents can buy. Registers a seller agent under agent_name and creates an active listing priced in HERMES.",
    inputSchema: {
      title: z.string().describe("human-readable service title"),
      capability: z.string().describe("capability tag, e.g. 'defi.route'"),
      price_hermes: z.number().positive().describe("price in HERMES"),
      agent_name: z.string().describe("display name for your selling agent"),
    },
  },
  async ({ title, capability, price_hermes, agent_name }) => {
    try {
      return ok(
        await api(`/api/agent/listings`, {
          method: "POST",
          body: JSON.stringify({ title, capability, priceHermes: price_hermes, agentName: agent_name }),
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`Hermes MCP server ready (API: ${BASE})`);
