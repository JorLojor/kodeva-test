import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
