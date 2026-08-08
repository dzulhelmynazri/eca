import { customerNameSchema } from "@use-forever/contracts";
import {
	ensureChannelCustomerForUser,
	updateChannelCustomerNameForUser,
} from "@use-forever/api/services/customers";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { resolveCustomerProfileContext } from "../lib/customer-profile-context";
import { decideTenantApproval } from "../lib/tenant-approval";

export default defineTool({
	description: "Save or update the current channel customer's name.",
	approval: decideTenantApproval,
	inputSchema: z.object({
		name: customerNameSchema,
	}),
	async execute(input, ctx) {
		const profileContext = await resolveCustomerProfileContext(ctx);
		if (!profileContext.supported) {
			return {
				saved: false,
				channel: profileContext.channel,
				reason: profileContext.reason,
			} as const;
		}

		await ensureChannelCustomerForUser({
			channel: profileContext.channel,
			ownerUserId: profileContext.ownerUserId,
			externalUserId: profileContext.externalUserId,
		});

		const customer = await updateChannelCustomerNameForUser({
			channel: profileContext.channel,
			ownerUserId: profileContext.ownerUserId,
			externalUserId: profileContext.externalUserId,
			name: input.name,
		});
		if (!customer) {
			return {
				saved: false,
				channel: profileContext.channel,
				reason: "Channel customer record is missing.",
			} as const;
		}

		return {
			saved: true,
			channel: profileContext.channel,
			customer,
		} as const;
	},
});
