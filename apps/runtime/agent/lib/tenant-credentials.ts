import { getIntegrationCredentials } from "@use-forever/api/services/integrations";
import type { IntegrationProvider } from "@use-forever/contracts";

export interface TenantCredentialProvider {
	getCredentials(
		workspaceId: string,
		provider: IntegrationProvider,
	): Promise<Record<string, string> | null>;
}

export const tenantCredentials: TenantCredentialProvider = {
	async getCredentials(workspaceId, provider) {
		const integration = await getIntegrationCredentials({
			workspaceId,
			provider,
		});
		return integration?.credentials ?? null;
	},
};
