import { twilioChannel } from "eve/channels/twilio";
import { getLatestTwilioCredentials } from "@use-forever/api/services/integrations";

async function requireTwilioIntegration() {
	const integration = await getLatestTwilioCredentials();
	if (!integration) {
		throw new Error("Twilio integration is not configured in workspace settings.");
	}
	return integration;
}

export default twilioChannel({
	allowFrom: async () => {
		const integration = await requireTwilioIntegration();
		return integration.credentials.allowFrom;
	},
	credentials: {
		accountSid: async () => {
			const integration = await requireTwilioIntegration();
			return integration.credentials.accountSid;
		},
		authToken: async () => {
			const integration = await requireTwilioIntegration();
			return integration.credentials.authToken;
		},
	},
	onText: async (_ctx, message) => {
		const integration = await requireTwilioIntegration();
		const to = message.to ?? "";
		return {
			auth: {
				principalId: message.from,
				principalType: "user",
				authenticator: "twilio-sms",
				attributes: {
					channel: "twilio-sms",
					tenantId: integration.workspaceId,
					to,
				},
			},
		};
	},
	onVoice: (_ctx, _call) => {
		return {};
	},
	onVoiceTranscription: async (_ctx, message) => {
		const integration = await requireTwilioIntegration();
		const to = message.to ?? "";
		return {
			auth: {
				principalId: message.from,
				principalType: "user",
				authenticator: "twilio-voice",
				attributes: {
					channel: "twilio-voice",
					tenantId: integration.workspaceId,
					to,
				},
			},
		};
	},
});
