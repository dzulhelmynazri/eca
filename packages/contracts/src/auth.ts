import { z } from "zod";

export const meResponseSchema = z.looseObject({
	session: z.looseObject({}),
	user: z.looseObject({
		email: z.email().nullable().optional(),
		id: z.string().optional(),
		image: z.url().nullable().optional(),
		name: z.string().nullable().optional(),
	}),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
