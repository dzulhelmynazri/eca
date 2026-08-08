import { telegramChannel } from "eve/channels/telegram";
import { getLatestTelegramCredentials } from "@use-forever/api/services/integrations";
import { ensureTelegramCustomerForState } from "../lib/customers";

async function requireTelegramIntegration() {
	const integration = await getLatestTelegramCredentials();
	if (!integration) {
		throw new Error("Telegram integration is not configured in workspace settings.");
	}
	return integration;
}

export default telegramChannel({
	credentials: {
		botToken: async () => {
			const integration = await requireTelegramIntegration();
			return integration.credentials.botToken;
		},
		webhookVerifier: async (request) => {
			const integration = await requireTelegramIntegration();
			const incomingSecret = request.headers.get("x-telegram-bot-api-secret-token");
			return incomingSecret === integration.credentials.webhookSecretToken;
		},
	},
	onMessage: async (_ctx, message) => {
		const integration = await requireTelegramIntegration();
		const telegramUserId = message.from?.id;
		if (!telegramUserId) {
			return {
				auth: null,
			};
		}

		return {
			auth: {
				principalId: telegramUserId,
				principalType: "user",
				authenticator: "telegram",
				attributes: {
					channel: "telegram",
					tenantId: integration.workspaceId,
				},
			},
		};
	},
	uploadPolicy: { allowedMediaTypes: ["image/*", "application/pdf"], maxBytes: 10 * 1024 * 1024 },
	events: {
		"turn.started": async (_data, channel) => {
			await ensureTelegramCustomerForState(channel.state);
		},
	},
});
