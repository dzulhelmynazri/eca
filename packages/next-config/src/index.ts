import type { NextConfig } from "next";

type CreateNextConfigOptions = {
	eveAgentUrl?: string;
};

export const createNextConfig = ({ eveAgentUrl }: CreateNextConfigOptions): NextConfig => {
	const normalizedEveAgentUrl = eveAgentUrl?.replace(/\/$/, "");

	return {
		cacheComponents: true,
		experimental: {
			optimizePackageImports: ["lucide-react"],
			turbopackFileSystemCacheForBuild: true,
			turbopackLocalPostcssConfig: true,
			turbopackRustReactCompiler: true,
			useOffline: true,
		},
		partialPrefetching: true,
		reactCompiler: true,
		serverExternalPackages: ["@firecrawl/anydoc"],
		rewrites: async () =>
			normalizedEveAgentUrl
				? [
						{
							source: "/api/eve/:path*",
							destination: `${normalizedEveAgentUrl}/eve/:path*`,
						},
					]
				: [],
	};
};
