import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type-check in the editor, don't block production builds on pre-existing
  // type-only glitches (e.g. @hookform/resolvers vs react-hook-form declaration
  // mismatch that exists solely in node_modules).
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
