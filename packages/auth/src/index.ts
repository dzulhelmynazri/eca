import prisma from "@use-forever/db";
import { env } from "@use-forever/env/server";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
export { toNextJsHandler } from "better-auth/next-js";

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL as string,
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	secret: env.BETTER_AUTH_SECRET as string,
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID as string,
			clientSecret: env.GOOGLE_CLIENT_SECRET as string,
			prompt: "select_account",
		},
	},
});
