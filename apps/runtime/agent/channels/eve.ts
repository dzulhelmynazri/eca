import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc } from "eve/channels/auth";
import { betterAuth } from "../lib/auth";

export default eveChannel({
	auth: [
		// Resolve signed-in browser users via Better Auth session cookies.
		betterAuth(),
		// Lets the eve TUI and your Vercel deployments reach the deployed agent.
		vercelOidc(),
		// Open on localhost for `eve dev` and the REPL; ignored in production.
		localDev(),
	],
});
