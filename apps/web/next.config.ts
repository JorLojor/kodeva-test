import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	outputFileTracingRoot: path.join(process.cwd(), "../.."),
	transpilePackages: ["@jortemplate/utils", "@jortemplate/ui"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.dicobainaja.com",
				pathname: "/uploads/**",
			},
		],
	},
};
export default nextConfig;
