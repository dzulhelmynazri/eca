import {
	ensureChannelCustomerForUser,
	getChannelCustomerProfileStatus,
} from "@use-forever/api/services/customers";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { resolveCustomerProfileContext } from "../lib/customer-profile-context";

export default defineTool({
	description: "Get current channel customer's profile completion status.",
	inputSchema: z.object({}),
	async execute(_input, ctx) {
		const profileContext = await resolveCustomerProfileContext(ctx);
		if (!profileContext.supported) {
			return {
				available: false,
				channel: profileContext.channel,
				reason: profileContext.reason,
			} as const;
		}

		await ensureChannelCustomerForUser({
			channel: profileContext.channel,
			ownerUserId: profileContext.ownerUserId,
			externalUserId: profileContext.externalUserId,
		});

		const status = await getChannelCustomerProfileStatus({
			channel: profileContext.channel,
			ownerUserId: profileContext.ownerUserId,
			externalUserId: profileContext.externalUserId,
		});

		return {
			available: true,
			channel: profileContext.channel,
			...status,
		} as const;
	},
});
