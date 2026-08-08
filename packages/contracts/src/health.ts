import { z } from "zod";

export const healthCheckResponseSchema = z.literal("OK");

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
