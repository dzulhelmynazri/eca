import type { IntegrationProvider } from "@use-forever/contracts";
import { integrationCredentialSchema } from "@use-forever/contracts";
import prisma from "@use-forever/db";
import { env } from "@use-forever/env/server";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";

const INTEGRATION_ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_BYTE_LENGTH = 12;
const AUTH_TAG_BYTE_LENGTH = 16;

const HEX_KEY_PATTERN = /^[\da-f]+$/i;

const TWILIO_CREDENTIAL_SCHEMA = z.object({
	allowFrom: z.string().min(1),
	accountSid: z.string().min(1),
	authToken: z.string().min(1),
	messagingFrom: z.string().min(1),
});

const TELEGRAM_CREDENTIAL_SCHEMA = z.object({
	botToken: z.string().min(1),
	webhookSecretToken: z.string().min(1),
});

export type TwilioTenantCredentials = z.infer<typeof TWILIO_CREDENTIAL_SCHEMA>;
export type TelegramTenantCredentials = z.infer<typeof TELEGRAM_CREDENTIAL_SCHEMA>;
export type IntegrationStatus = {
	provider: IntegrationProvider;
	updatedAt: string;
};
export type IntegrationHealth = {
	provider: IntegrationProvider;
	totalRows: number;
	decryptableRows: number;
	latestUpdatedAt: string | null;
	latestDecryptableUpdatedAt: string | null;
};

function decodeHexToBytes(hex: string) {
	if (hex.length % 2 !== 0 || !HEX_KEY_PATTERN.test(hex)) {
		throw new Error("INTEGRATIONS_ENCRYPTION_KEY must be an even-length hex string.");
	}

	const bytes = new Uint8Array(hex.length / 2);
	for (let index = 0; index < bytes.length; index += 1) {
		bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
	}
	return bytes;
}

function getIntegrationEncryptionKey() {
	const key = env.INTEGRATIONS_ENCRYPTION_KEY;
	if (!key) {
		throw new Error("INTEGRATIONS_ENCRYPTION_KEY is required to store workspace integrations.");
	}
	return Buffer.from(decodeHexToBytes(key));
}

function encryptJson(value: Record<string, string>) {
	const key = getIntegrationEncryptionKey();
	const iv = randomBytes(IV_BYTE_LENGTH);
	const cipher = createCipheriv(INTEGRATION_ENCRYPTION_ALGORITHM, key, iv);
	const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return `${iv.toString("base64")}.${authTag.toString("base64")}.${ciphertext.toString("base64")}`;
}

function decryptJson(payload: string): Record<string, string> {
	const [ivB64, authTagB64, ciphertextB64] = payload.split(".");
	if (!ivB64 || !authTagB64 || !ciphertextB64) {
		throw new Error("Workspace integration payload is malformed.");
	}

	const key = getIntegrationEncryptionKey();
	const iv = Buffer.from(ivB64, "base64");
	const authTag = Buffer.from(authTagB64, "base64");
	const ciphertext = Buffer.from(ciphertextB64, "base64");
	if (iv.length !== IV_BYTE_LENGTH || authTag.length !== AUTH_TAG_BYTE_LENGTH) {
		throw new Error("Workspace integration payload is invalid.");
	}

	const decipher = createDecipheriv(INTEGRATION_ENCRYPTION_ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);
	const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	const parsed = JSON.parse(plaintext.toString("utf8"));
	return z.record(z.string(), z.string()).parse(parsed);
}

export async function upsertIntegration(input: {
	actingUserId: string;
	credentials: Record<string, string>;
	provider: IntegrationProvider;
	workspaceId: string;
}) {
	const encryptedConfig = encryptJson(input.credentials);
	return prisma.workspaceIntegration.upsert({
		where: {
			workspaceId_provider: {
				workspaceId: input.workspaceId,
				provider: input.provider,
			},
		},
		create: {
			workspaceId: input.workspaceId,
			provider: input.provider,
			encryptedConfig,
			createdByUserId: input.actingUserId,
			updatedByUserId: input.actingUserId,
		},
		update: {
			encryptedConfig,
			updatedByUserId: input.actingUserId,
		},
		select: {
			id: true,
			updatedAt: true,
		},
	});
}

export async function deleteIntegration(input: {
	provider: IntegrationProvider;
	workspaceId: string;
}): Promise<void> {
	await prisma.workspaceIntegration.deleteMany({
		where: {
			workspaceId: input.workspaceId,
			provider: input.provider,
		},
	});
}

export async function getIntegrationStatus(workspaceId: string): Promise<IntegrationStatus[]> {
	const integrationRows = await prisma.workspaceIntegration.findMany({
		where: {
			workspaceId,
		},
		select: {
			provider: true,
			updatedAt: true,
		},
	});

	return integrationRows.map((integration) => ({
		provider: integration.provider,
		updatedAt: integration.updatedAt.toISOString(),
	}));
}

export async function getIntegrationHealth(workspaceId: string): Promise<IntegrationHealth[]> {
	const providers: IntegrationProvider[] = ["TELEGRAM", "TWILIO"];
	const health: IntegrationHealth[] = [];

	for (const provider of providers) {
		const integrationRows = await prisma.workspaceIntegration.findMany({
			where: {
				workspaceId,
				provider,
			},
			orderBy: {
				updatedAt: "desc",
			},
			select: {
				encryptedConfig: true,
				updatedAt: true,
			},
		});

		let decryptableRows = 0;
		let latestDecryptableUpdatedAt: string | null = null;
		for (const integration of integrationRows) {
			try {
				decryptJson(integration.encryptedConfig);
				decryptableRows += 1;
				latestDecryptableUpdatedAt ??= integration.updatedAt.toISOString();
			} catch {
				// Keep scanning rows to count decryptable entries.
			}
		}

		health.push({
			provider,
			totalRows: integrationRows.length,
			decryptableRows,
			latestUpdatedAt: integrationRows[0]?.updatedAt.toISOString() ?? null,
			latestDecryptableUpdatedAt,
		});
	}

	return health;
}

export async function getIntegrationCredentials(input: {
	provider: IntegrationProvider;
	workspaceId: string;
}) {
	const integration = await prisma.workspaceIntegration.findUnique({
		where: {
			workspaceId_provider: {
				workspaceId: input.workspaceId,
				provider: input.provider,
			},
		},
		select: {
			provider: true,
			encryptedConfig: true,
			updatedAt: true,
		},
	});
	if (!integration) {
		return null;
	}

	const credentials = decryptJson(integration.encryptedConfig);
	return integrationCredentialSchema.parse({
		provider: integration.provider,
		credentials,
		updatedAt: integration.updatedAt.toISOString(),
	});
}

export async function getLatestIntegrationForProvider(provider: IntegrationProvider) {
	const integrationRows = await prisma.workspaceIntegration.findMany({
		where: {
			provider,
		},
		orderBy: {
			updatedAt: "desc",
		},
		select: {
			workspaceId: true,
			provider: true,
			encryptedConfig: true,
			updatedAt: true,
		},
	});
	if (integrationRows.length === 0) {
		return null;
	}

	let lastError: unknown = null;
	for (const integration of integrationRows) {
		try {
			const credentials = decryptJson(integration.encryptedConfig);
			return {
				workspaceId: integration.workspaceId,
				integration: integrationCredentialSchema.parse({
					provider: integration.provider,
					credentials,
					updatedAt: integration.updatedAt.toISOString(),
				}),
			};
		} catch (error) {
			lastError = error;
		}
	}

	const detail = lastError instanceof Error ? lastError.message : "unknown decrypt failure";
	throw new Error(
		`No decryptable ${provider} integration found. ${integrationRows.length} row(s) exist but failed to decrypt: ${detail}`,
	);
}

export async function getTwilioCredentials(workspaceId: string) {
	const integration = await getIntegrationCredentials({
		provider: "TWILIO",
		workspaceId,
	});
	if (!integration) {
		return null;
	}
	return TWILIO_CREDENTIAL_SCHEMA.parse(integration.credentials);
}

export async function getTelegramCredentials(workspaceId: string) {
	const integration = await getIntegrationCredentials({
		provider: "TELEGRAM",
		workspaceId,
	});
	if (!integration) {
		return null;
	}
	return TELEGRAM_CREDENTIAL_SCHEMA.parse(integration.credentials);
}

export async function getLatestTwilioCredentials() {
	const latest = await getLatestIntegrationForProvider("TWILIO");
	if (!latest) {
		return null;
	}
	return {
		workspaceId: latest.workspaceId,
		credentials: TWILIO_CREDENTIAL_SCHEMA.parse(latest.integration.credentials),
	};
}

export async function getLatestTelegramCredentials() {
	const latest = await getLatestIntegrationForProvider("TELEGRAM");
	if (!latest) {
		return null;
	}
	return {
		workspaceId: latest.workspaceId,
		credentials: TELEGRAM_CREDENTIAL_SCHEMA.parse(latest.integration.credentials),
	};
}
