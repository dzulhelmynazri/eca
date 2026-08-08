import { z } from "zod";

export const integrationProviderSchema = z.enum(["TELEGRAM", "TWILIO"]);

export const integrationStatusSchema = z.object({
	provider: integrationProviderSchema,
	updatedAt: z.iso.datetime().nullable(),
});

export const integrationHealthSchema = z.object({
	provider: integrationProviderSchema,
	totalRows: z.number().int().min(0),
	decryptableRows: z.number().int().min(0),
	latestUpdatedAt: z.iso.datetime().nullable(),
	latestDecryptableUpdatedAt: z.iso.datetime().nullable(),
});

export const integrationHealthReportSchema = z.object({
	checkedAt: z.iso.datetime(),
	providers: z.array(integrationHealthSchema),
});

export const upsertTwilioIntegrationInputSchema = z.object({
	accountSid: z.string().min(1),
	authToken: z.string().min(1),
	messagingFrom: z.string().min(1),
	allowFrom: z.string().min(1).default("*"),
});

export const upsertTelegramIntegrationInputSchema = z.object({
	botToken: z.string().min(1),
	webhookSecretToken: z.string().min(1),
});

export const integrationCredentialSchema = z.object({
	provider: integrationProviderSchema,
	credentials: z.record(z.string(), z.string()),
	updatedAt: z.iso.datetime(),
});

export type IntegrationProvider = z.infer<typeof integrationProviderSchema>;
export type UpsertTwilioIntegrationInput = z.infer<typeof upsertTwilioIntegrationInputSchema>;
export type UpsertTelegramIntegrationInput = z.infer<typeof upsertTelegramIntegrationInputSchema>;
export type IntegrationHealth = z.infer<typeof integrationHealthSchema>;
export type IntegrationHealthReport = z.infer<typeof integrationHealthReportSchema>;
