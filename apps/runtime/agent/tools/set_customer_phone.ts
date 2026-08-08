import { customerPhoneSchema } from "@use-forever/contracts";
import {
	ensureChannelCustomerForUser,
	updateChannelCustomerPhoneForUser,
} from "@use-forever/api/services/customers";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { resolveCustomerProfileContext } from "../lib/customer-profile-context";
import { decideTenantApproval } from "../lib/tenant-approval";

export default defineTool({
	description: "Save or update the current channel customer's phone number.",
	approval: decideTenantApproval,
	inputSchema: z.object({
		phone: customerPhoneSchema,
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

		const customer = await updateChannelCustomerPhoneForUser({
			channel: profileContext.channel,
			ownerUserId: profileContext.ownerUserId,
			externalUserId: profileContext.externalUserId,
			phone: input.phone,
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
