import { workspaceSchema } from "@use-forever/contracts";
import prisma from "@use-forever/db";
import { tenantProcedure, router } from "../../index";
import { getIntegrationStatus } from "../../services/integrations";

export const workspaceRouter = router({
	get: tenantProcedure.output(workspaceSchema).query(async ({ ctx }) => {
		const workspace = await prisma.workspace.findUniqueOrThrow({
			where: {
				id: ctx.workspace.id,
			},
			select: {
				id: true,
				name: true,
				ownerUserId: true,
				customerOwnerUserId: true,
			},
		});

		const integrations = await getIntegrationStatus(workspace.id);

		return workspaceSchema.parse({
			workspaceId: workspace.id,
			workspaceName: workspace.name,
			customerOwnerUserId: workspace.customerOwnerUserId ?? workspace.ownerUserId,
			integrations,
		});
	}),
});
