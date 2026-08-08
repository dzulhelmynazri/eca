import { env } from "@use-forever/env/server";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../prisma/generated/client";

export function createPrismaClient() {
	const databaseUrl = env.DATABASE_URL as string;
	const adapter = new PrismaNeon({
		connectionString: databaseUrl,
	});

	return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
export default prisma;
