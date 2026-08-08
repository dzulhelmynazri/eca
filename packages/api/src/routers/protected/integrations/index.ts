import { integrationHealthReportSchema, workspaceSchema } from "@use-forever/contracts";
import prisma from "@use-forever/db";
import { tenantProcedure, router } from "../../../index";
import { getIntegrationHealth, getIntegrationStatus } from "../../../services/integrations";
import { telegramIntegrationProcedures } from "./telegram";
import { twilioIntegrationProcedures } from "./twilio";

export const integrationsRouter = router({
	get: tenantProcedure.output(workspaceSchema).query(async ({ ctx }) => {
		const workspace = await prisma.workspace.findUniqueOrThrow({
			where: { id: ctx.workspace.id },
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
	health: tenantProcedure.output(integrationHealthReportSchema).query(async ({ ctx }) => {
		const providers = await getIntegrationHealth(ctx.workspace.id);
		return integrationHealthReportSchema.parse({
			checkedAt: new Date().toISOString(),
			providers,
		});
	}),
	...twilioIntegrationProcedures,
	...telegramIntegrationProcedures,
});
