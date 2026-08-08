import { getIntegrationStatus } from "@use-forever/api/services/integrations";
import { defineDynamic, defineInstructions } from "eve/instructions";
import { requireTenantCaller } from "../lib/tenant";

export default defineDynamic({
	events: {
		"turn.started": async (_event, ctx) => {
			let tenantId: string;
			try {
				({ tenantId } = requireTenantCaller(ctx));
			} catch {
				return null;
			}

			const integrationStatus = await getIntegrationStatus(tenantId);
			const configuredProviders = integrationStatus
				.map((integration) => integration.provider)
				.join(", ");

			return defineInstructions({
				markdown: `
You are operating in tenant scope \`${tenantId}\`.

Only act within this tenant's data boundary.
Never infer, fetch, or mutate data for another tenant.

Configured integrations for this tenant: ${configuredProviders || "none"}.
				`.trim(),
			});
		},
	},
});
