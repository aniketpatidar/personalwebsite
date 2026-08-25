export default {
  default: {
    override: {
      wrapper: "cloudflare-node",
    },
  },
  buildCommand: "npm run build",
  edgeExternals: ["drizzle-kit/api", "drizzle-kit"]
};
