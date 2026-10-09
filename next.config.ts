import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm", "remark-math"],
    rehypePlugins: ["rehype-slug", ["rehype-katex", { strict: false }]],
  },
});

export default withMDX(nextConfig);
