import { upsertTwilioIntegrationInputSchema, workspaceSchema } from "@use-forever/contracts";
import prisma from "@use-forever/db";
import { tenantProcedure } from "../../../index";
import {
	deleteIntegration,
	getIntegrationStatus,
	upsertIntegration,
} from "../../../services/integrations";
import { requireWorkspaceAdmin } from "../../../services/workspaces";

async function getWorkspaceSnapshot(workspaceId: string) {
	const workspace = await prisma.workspace.findUniqueOrThrow({
		where: { id: workspaceId },
		select: {
			id: true,
			name: true,
			ownerUserId: true,
			customerOwnerUserId: true,
		},
	});

	const integrationStatuses = await getIntegrationStatus(workspace.id);

	return workspaceSchema.parse({
		workspaceId: workspace.id,
		workspaceName: workspace.name,
		customerOwnerUserId: workspace.customerOwnerUserId ?? workspace.ownerUserId,
		integrations: integrationStatuses,
	});
}

export const twilioIntegrationProcedures = {
	upsertTwilio: tenantProcedure
		.input(upsertTwilioIntegrationInputSchema)
		.output(workspaceSchema)
		.mutation(async ({ ctx, input }) => {
			await requireWorkspaceAdmin({
				workspaceId: ctx.workspace.id,
				userId: ctx.session.user.id,
			});

			await upsertIntegration({
				workspaceId: ctx.workspace.id,
				actingUserId: ctx.session.user.id,
				provider: "TWILIO",
				credentials: {
					accountSid: input.accountSid,
					authToken: input.authToken,
					messagingFrom: input.messagingFrom,
					allowFrom: input.allowFrom,
				},
			});

			return getWorkspaceSnapshot(ctx.workspace.id);
		}),
	disconnectTwilio: tenantProcedure.output(workspaceSchema).mutation(async ({ ctx }) => {
		await requireWorkspaceAdmin({
			workspaceId: ctx.workspace.id,
			userId: ctx.session.user.id,
		});

		await deleteIntegration({
			workspaceId: ctx.workspace.id,
			provider: "TWILIO",
		});

		return getWorkspaceSnapshot(ctx.workspace.id);
	}),
};
