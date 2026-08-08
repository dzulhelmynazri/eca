import prisma from "./index";

const demoCustomers = [
	{ name: "Aisyah Rahman", phone: "+60 12-345 6789" },
	{ name: "Daniel Lim", phone: "+60 19-888 1122" },
	{ name: "Nurul Iman", phone: "+60 17-222 3344" },
	{ name: "Farid Hakim", phone: "+60 16-111 2233" },
	{ name: "Siti Khadijah", phone: "+60 14-778 9900" },
	{ name: "Amirul Azlan", phone: "+60 13-456 7812" },
	{ name: "Mei Ling Tan", phone: "+60 18-333 4455" },
	{ name: "Hafizah Nordin", phone: "+60 12-909 1010" },
	{ name: "Jonathan Lee", phone: "+60 19-121 3141" },
	{ name: "Puteri Aina", phone: "+60 17-989 8765" },
	{ name: "Kumaravel Raj", phone: "+60 16-565 7788" },
	{ name: "Nadia Syafiqah", phone: "+60 15-808 1122" },
	{ name: "Arjun Menon", phone: "+60 13-232 4545" },
	{ name: "Izzati Yasmin", phone: "+60 18-676 7878" },
	{ name: "Ryan Chia", phone: "+60 11-343 5656" },
	{ name: "Aiman Zulkifli", phone: "+60 14-202 3030" },
	{ name: "Priya Devi", phone: "+60 19-747 5858" },
	{ name: "Syed Irfan", phone: "+60 17-969 7070" },
	{ name: "Alicia Wong", phone: "+60 12-414 8181" },
	{ name: "Hakimah Sofea", phone: "+60 16-525 9292" },
	{ name: "Ben Ong", phone: "+60 15-636 1414" },
] as const;

async function getUsersForSeeding() {
	const users = await prisma.user.findMany({
		select: {
			id: true,
		},
	});

	if (users.length > 0) {
		return users;
	}

	const demoUser = await prisma.user.create({
		data: {
			id: "seed-demo-user",
			name: "Seed Demo User",
			email: "seed-demo@use-forever.local",
			emailVerified: true,
		},
		select: {
			id: true,
		},
	});

	return [demoUser];
}

async function main() {
	const users = await getUsersForSeeding();
	await prisma.customer.deleteMany({});

	for (const user of users) {
		await prisma.customer.createMany({
			data: demoCustomers.map((customer) => ({
				...customer,
				userId: user.id,
			})),
		});
	}

	console.log(
		`Customer seeding complete. Reset and added demo customers for ${users.length} user(s).`,
	);
}

main()
	.catch((error: unknown) => {
		console.error("Customer seed failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
