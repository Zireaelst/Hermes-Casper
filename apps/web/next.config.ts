import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Casper SDK + x402 client as Node externals (server-only, not bundled).
  serverExternalPackages: [
    "casper-js-sdk",
    "@make-software/casper-x402",
    "@casper-ecosystem/casper-eip-712",
  ],
};

export default nextConfig;
