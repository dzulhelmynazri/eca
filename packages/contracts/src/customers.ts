import { z } from "zod";

const PHONE_REGEX = /^\+?[0-9()\s-]{7,20}$/;
export const customerChannelValues = ["telegram", "twilio-sms", "twilio-voice"] as const;
export const customerChannelSchema = z.enum(customerChannelValues);
export const customerChannelsSchema = z.array(customerChannelSchema);

export const customerNameSchema = z
	.string()
	.trim()
	.min(1, "Name is required.")
	.max(120, "Name must be 120 characters or fewer.");
export const customerPhoneSchema = z
	.string()
	.trim()
	.regex(PHONE_REGEX, "Please enter a valid phone number.");

export const customerSchema = z.object({
	id: z.string().min(1),
	name: customerNameSchema,
	phone: customerPhoneSchema,
	channels: customerChannelsSchema,
});
export const customersSchema = z.array(customerSchema);

export const createCustomerInputSchema = z.object({
	name: customerNameSchema,
	phone: customerPhoneSchema,
	channels: customerChannelsSchema.min(1, "Please select at least one channel."),
});

export const updateCustomerInputSchema = z.object({
	customerId: z.string().min(1),
	name: customerNameSchema.optional(),
	phone: customerPhoneSchema.optional(),
	channels: customerChannelsSchema.optional(),
});

export const deleteCustomerInputSchema = z.object({
	customerId: z.string().min(1),
});

export const getCustomerInputSchema = z.object({
	customerId: z.string().min(1),
});

export const updateCustomerResponseSchema = z.object({
	customerId: z.string().min(1),
	changes: z.object({
		name: customerNameSchema.optional(),
		phone: customerPhoneSchema.optional(),
		channels: customerChannelsSchema.optional(),
	}),
});

export type Customer = z.infer<typeof customerSchema>;
export type Customers = z.infer<typeof customersSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;
export type DeleteCustomerInput = z.infer<typeof deleteCustomerInputSchema>;
export type GetCustomerInput = z.infer<typeof getCustomerInputSchema>;
