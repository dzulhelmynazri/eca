import type { TelegramChannelState } from "eve/channels/telegram";
import { ensureChannelCustomerForUser } from "@use-forever/api/services/customers";
import { getWorkspaceById } from "@use-forever/api/services/workspaces";

export async function ensureTelegramCustomerForState(state: TelegramChannelState) {
	const maybeTenantId = (state as { auth?: { current?: { attributes?: { tenantId?: string } } } })
		.auth?.current?.attributes?.tenantId;
	if (typeof maybeTenantId !== "string" || maybeTenantId.length === 0) {
		return;
	}
	const workspace = await getWorkspaceById(maybeTenantId);
	if (!workspace) {
		return;
	}
	const ownerUserId = workspace.customerOwnerUserId ?? workspace.ownerUserId;

	const telegramUserId = state.triggeringUserId;
	if (!telegramUserId) {
		return;
	}

	await ensureChannelCustomerForUser({
		channel: "telegram",
		ownerUserId,
		externalUserId: telegramUserId,
	});
}
