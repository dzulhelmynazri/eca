import { env } from "@use-forever/env/server";
import { createNextConfig } from "@use-forever/next-config";

const nextConfig = createNextConfig({
	eveAgentUrl: env.EVE_AGENT_URL,
});

export default nextConfig;
