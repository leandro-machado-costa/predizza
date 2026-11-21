import type { NextConfig } from "next";
import path from "node:path";

const threeShim = path.join(__dirname, "src/lib/three-predizza.js");

const nextConfig: NextConfig = {
  // That Open não lida bem com double-mount do Strict Mode no viewer IFC
  reactStrictMode: false,
  serverExternalPackages: ["better-sqlite3"],
  // That Open (fragments) usa THREE.MRTNode via destructuring; Turbopack
  // falha na análise estática. Preferir webpack neste projeto.
  turbopack: {
    // apenas o entry "three" (não three/examples/*)
    resolveAlias: {
      three: threeShim,
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // `$` = match exato; preserva three/examples/jsm/...
      three$: threeShim,
    };
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/wasm/:path*",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/buildings/:path*.ifc",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
        ],
      },
    ];
  },
};

export default nextConfig;
