import { auth } from "@use-forever/auth";
import { ensureDefaultWorkspaceForUser } from "@use-forever/api/services/workspaces";
import type { AuthFn } from "eve/channels/auth";

export function betterAuth(): AuthFn<Request> {
	return async (request) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) return null;
		const workspace = await ensureDefaultWorkspaceForUser({
			userId: session.user.id,
			userName: session.user.name,
		});

		return {
			attributes: {
				email: session.user.email,
				name: session.user.name,
				tenantId: workspace.id,
			},
			authenticator: "better-auth",
			issuer: "use-forever-auth",
			principalId: session.user.id,
			principalType: "user",
		};
	};
}
