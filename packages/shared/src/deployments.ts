/**
 * Committed source of truth for Hermes on-chain deployments.
 *
 * Contract package hashes, deploy transactions, network, and the proven x402
 * settlement live here (version-controlled) rather than only in `.env`/docs, so
 * the app and tooling can reference them durably. Mirrors the deploy log in
 * `docs/contracts/README.md` (Casper testnet, 2026-07-06).
 */

export type CasperNetwork = "casper-test" | "casper";

export interface DeployedContract {
  name: string;
  /** Standards the contract implements (for display). */
  standards: string[];
  /** Contract package hash, `hash-`-prefixed as shown on the explorer. */
  packageHash: string;
  /** Deploy transaction hash (short form as recorded in the deploy log). */
  deployTxShort?: string;
  /** One-line description of the contract's role. */
  role: string;
}

export interface DeploymentRegistry {
  network: CasperNetwork;
  explorerBase: string;
  /** ISO date the set was deployed. */
  deployedAt: string | null;
  contracts: DeployedContract[];
  /** A representative, fully-verifiable on-chain x402 settlement tx. */
  provenSettlementTx?: string;
}

export const CASPER_TEST_DEPLOYMENT: DeploymentRegistry = {
  network: "casper-test",
  explorerBase: "https://testnet.cspr.live",
  deployedAt: "2026-07-06",
  contracts: [
    {
      name: "HermesToken",
      standards: ["CEP-18", "CEP-3009"],
      packageHash: "hash-846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c",
      deployTxShort: "846fdfc6…",
      role: "Payment token settled via transfer_with_authorization (x402 asset).",
    },
    {
      name: "AgentRegistry",
      standards: [],
      packageHash: "hash-2135533ff2b3f75d6ecfafedb98427cdf3d4982064d5d7d57f068ec70edcd349",
      deployTxShort: "9c706628…8c1541",
      role: "On-chain registry of agents and their capabilities.",
    },
    {
      name: "ReputationAnchor",
      standards: [],
      packageHash: "hash-8f6d6e6ab2f398cc2e139ab7a77e33d34ecb59953f0825df0277ed459e04cd4f",
      deployTxShort: "6bf6bda7…5cfbb6",
      role: "Anchors reputation scores on-chain for verifiable counterparty trust.",
    },
  ],
  provenSettlementTx: "66151d11dc3b2d6ef356e243e885e21b10f4fefb1c51079d8eef48fbabef95bf",
};

const CASPER_MAINNET_DEPLOYMENT: DeploymentRegistry = {
  network: "casper",
  explorerBase: "https://cspr.live",
  deployedAt: null,
  contracts: [],
};

export const DEPLOYMENTS: Record<CasperNetwork, DeploymentRegistry> = {
  "casper-test": CASPER_TEST_DEPLOYMENT,
  casper: CASPER_MAINNET_DEPLOYMENT,
};

/** Resolve the deployment registry for a network id (defaults to testnet). */
export function deploymentFor(network: string | undefined): DeploymentRegistry {
  const key = (network ?? "").replace("casper:", "");
  return key === "casper" ? DEPLOYMENTS.casper : DEPLOYMENTS["casper-test"];
}

/** HermesToken package hash without the `hash-` prefix — the x402 asset id. */
export function tokenAssetId(reg: DeploymentRegistry = CASPER_TEST_DEPLOYMENT): string | null {
  const token = reg.contracts.find((c) => c.name === "HermesToken");
  return token ? token.packageHash.replace(/^hash-/, "") : null;
}
