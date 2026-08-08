import type { ToolContext } from "eve/tools";
import { getWorkspaceById } from "@use-forever/api/services/workspaces";
import { requireTenantCaller } from "./tenant";

type SupportedChannel = "telegram" | "twilio-sms" | "twilio-voice";

type SupportedCustomerProfileContext = {
	supported: true;
	channel: SupportedChannel;
	externalUserId: string;
	ownerUserId: string;
};

type UnsupportedCustomerProfileContext = {
	supported: false;
	channel: string | null;
	reason: string;
};

export type CustomerProfileContext =
	| SupportedCustomerProfileContext
	| UnsupportedCustomerProfileContext;

export async function resolveCustomerProfileContext(
	ctx: ToolContext,
): Promise<CustomerProfileContext> {
	const auth = ctx.session.auth.current;
	const channel = auth?.authenticator ?? null;

	let resolvedChannel: SupportedChannel | null = null;

	if (!channel || channel === "telegram") {
		resolvedChannel = "telegram";
	} else if (channel === "twilio-sms" || channel === "twilio-voice") {
		resolvedChannel = channel;
	}

	if (!resolvedChannel) {
		return {
			supported: false,
			channel,
			reason: "Customer profile collection is not configured for this channel yet.",
		};
	}

	let tenantId: string;
	try {
		({ tenantId } = requireTenantCaller(ctx));
	} catch {
		return {
			supported: false,
			channel: resolvedChannel,
			reason: "Tenant scope is missing for this session.",
		};
	}

	const workspace = await getWorkspaceById(tenantId);
	if (!workspace) {
		return {
			supported: false,
			channel: resolvedChannel,
			reason: "Workspace configuration is missing for this tenant.",
		};
	}

	const ownerUserId = workspace.customerOwnerUserId ?? workspace.ownerUserId;
	const externalUserId = auth?.principalId;
	if (!ownerUserId || !externalUserId) {
		return {
			supported: false,
			channel: resolvedChannel,
			reason: "Customer owner user id or channel user id is missing.",
		};
	}

	return {
		supported: true,
		channel: resolvedChannel,
		externalUserId,
		ownerUserId,
	};
}
