import {
	createCustomerInputSchema,
	deleteCustomerInputSchema,
	customerSchema,
	customersSchema,
	getCustomerInputSchema,
	updateCustomerInputSchema,
} from "@use-forever/contracts";
import prisma from "@use-forever/db";
import { TRPCError } from "@trpc/server";
import {
	createCustomerForUser,
	customerSelect,
	findOwnedCustomerById,
} from "../../services/customers";
import { protectedProcedure, router } from "../../index";

async function requireOwnedCustomer(customerId: string, userId: string) {
	const customer = await findOwnedCustomerById(customerId, userId);

	if (!customer) {
		throw new TRPCError({
			code: "NOT_FOUND",
		});
	}

	return customer;
}

export const customersRouter = router({
	list: protectedProcedure.output(customersSchema).query(async ({ ctx }) => {
		const userId = ctx.session.user.id;

		const customers = await prisma.customer.findMany({
			where: {
				userId,
			},
			orderBy: {
				createdAt: "desc",
			},
			select: customerSelect,
		});
		return customersSchema.parse(customers);
	}),
	byId: protectedProcedure
		.input(getCustomerInputSchema)
		.output(customerSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const customer = await requireOwnedCustomer(input.customerId, userId);
			return customerSchema.parse(customer);
		}),
	create: protectedProcedure
		.input(createCustomerInputSchema)
		.output(customerSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const customer = await createCustomerForUser(userId, input);
			return customerSchema.parse(customer);
		}),
	update: protectedProcedure
		.input(updateCustomerInputSchema)
		.output(customerSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const { customerId, ...data } = input;
			const customer = await requireOwnedCustomer(customerId, userId);

			const updatedCustomer = await prisma.customer.update({
				where: {
					id: customer.id,
				},
				data,
				select: customerSelect,
			});
			return customerSchema.parse(updatedCustomer);
		}),
	delete: protectedProcedure
		.input(deleteCustomerInputSchema)
		.output(customerSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id;
			const customer = await requireOwnedCustomer(input.customerId, userId);

			const deletedCustomer = await prisma.customer.delete({
				where: {
					id: customer.id,
				},
				select: customerSelect,
			});
			return customerSchema.parse(deletedCustomer);
		}),
});
