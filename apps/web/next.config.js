/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  experimental: {
    externalDir: true
  },
  transpilePackages: ["@rackrunner/utils", "@rackrunner/types"]
};

module.exports = nextConfig;
