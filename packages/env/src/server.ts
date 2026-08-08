import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	emptyStringAsUndefined: true,
	runtimeEnv: process.env,
	server: {
		BETTER_AUTH_SECRET: z.string().min(32).optional(),
		BETTER_AUTH_URL: z.url().optional(),
		CORS_ORIGIN: z.url().optional(),
		DATABASE_URL: z.string().min(1).optional(),
		EVE_AGENT_URL: z.url().optional(),
		FIRECRAWL_API_KEY: z.string().min(1).optional(),
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
		INTEGRATIONS_ENCRYPTION_KEY: z.string().min(1).optional(),
		NEON_STORAGE_BUCKET: z.string().min(1).optional(),
		STORAGE_ENCRYPTION_KEY: z.string().min(1).optional(),
		AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
		AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		AWS_ENDPOINT_URL_S3: z.url().optional(),
		AWS_REGION: z.string().min(1).optional(),
		AI_GATEWAY_API_KEY: z.string().min(1).optional(),
		RESEND_API_KEY: z.string().min(1).optional(),
		VERCEL_OIDC_TOKEN: z.string().min(1).optional(),
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
