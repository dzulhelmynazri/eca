import { getWorkspaceById } from "@use-forever/api/services/workspaces";
import type { ToolContext } from "eve/tools";

export type KnowledgeOwnerResolution =
	| {
			available: true;
			userId: string;
	  }
	| {
			available: false;
			reason: string;
	  };

export async function resolveKnowledgeOwnerUserId(
	ctx: ToolContext,
): Promise<KnowledgeOwnerResolution> {
	const tenantId = ctx.session.auth.current?.attributes?.tenantId;
	if (typeof tenantId !== "string" || tenantId.length === 0) {
		return {
			available: false,
			reason: "Tenant scope is missing for this session.",
		};
	}

	const workspace = await getWorkspaceById(tenantId);
	if (!workspace) {
		return {
			available: false,
			reason: "Workspace configuration is missing for this tenant.",
		};
	}

	return {
		available: true,
		userId: workspace.customerOwnerUserId ?? workspace.ownerUserId,
	};
}
