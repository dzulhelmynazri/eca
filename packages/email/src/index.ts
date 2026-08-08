import { createEmailClient } from "@opencoredev/email-sdk";
import { resend } from "@opencoredev/email-sdk/resend";
import { env } from "@use-forever/env/server";

function getResendApiKey() {
	const apiKey = env.RESEND_API_KEY as string;
	return apiKey;
}

export function createTransactionalEmailClient() {
	return createEmailClient({
		adapters: [resend({ apiKey: getResendApiKey() })],
	});
}

let emailClient: ReturnType<typeof createTransactionalEmailClient> | undefined;

export function getEmailClient() {
	emailClient ??= createTransactionalEmailClient();
	return emailClient;
}
