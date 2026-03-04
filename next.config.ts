import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/personal-blog" : "",
  assetPrefix: isProd ? "/personal-blog/" : "",
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
