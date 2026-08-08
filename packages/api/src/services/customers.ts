import type { CreateCustomerInput } from "@use-forever/contracts";
import prisma from "@use-forever/db";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { createHash } from "node:crypto";

export const customerSelect = {
	id: true,
	name: true,
	phone: true,
	channels: true,
} as const;

export async function createCustomerForUser(userId: string, input: CreateCustomerInput) {
	return prisma.customer.create({
		data: {
			...input,
			userId,
		},
		select: customerSelect,
	});
}

export async function findOwnedCustomerById(customerId: string, userId: string) {
	return prisma.customer.findFirst({
		where: {
			id: customerId,
			userId,
		},
		select: customerSelect,
	});
}

export type CustomerProfileChannel = "telegram" | "twilio-sms" | "twilio-voice";

function normalizePhoneNumber(phone: string) {
	const parsed = parsePhoneNumberFromString(phone);
	if (!parsed?.isValid()) {
		return null;
	}
	return parsed.number;
}

function getChannelCustomerId(input: {
	channel: CustomerProfileChannel;
	ownerUserId: string;
	externalUserId: string;
}) {
	const digest = createHash("sha256")
		.update(`${input.channel}:${input.ownerUserId}:${input.externalUserId}`)
		.digest("hex")
		.slice(0, 24);
	return `cust_${digest}`;
}

function getPlaceholderProfile(input: { channel: CustomerProfileChannel; externalUserId: string }) {
	if (input.channel === "telegram") {
		return {
			name: input.externalUserId,
			phone: `+${input.externalUserId}`,
		};
	}

	const normalizedPhone = normalizePhoneNumber(input.externalUserId);
	return {
		name: input.externalUserId,
		phone: normalizedPhone ?? input.externalUserId,
	};
}

function channelNeedsPhoneCollection(channel: CustomerProfileChannel) {
	return channel === "telegram";
}

function mergeCustomerChannels(
	channels: Array<string | null | undefined>,
	currentChannel: CustomerProfileChannel,
) {
	return [
		...new Set([
			...channels.filter((channel): channel is string => Boolean(channel)),
			currentChannel,
		]),
	];
}

async function findOwnedCustomerByNormalizedPhone(input: {
	userId: string;
	phone: string;
	excludeCustomerId?: string;
}) {
	const normalizedPhone = normalizePhoneNumber(input.phone);
	if (!normalizedPhone) {
		return null;
	}

	const customers = await prisma.customer.findMany({
		where: {
			userId: input.userId,
		},
		select: {
			id: true,
			name: true,
			phone: true,
			channels: true,
		},
	});

	for (const customer of customers) {
		if (input.excludeCustomerId && customer.id === input.excludeCustomerId) {
			continue;
		}
		if (normalizePhoneNumber(customer.phone) === normalizedPhone) {
			return customer;
		}
	}

	return null;
}

export async function ensureChannelCustomerForUser(input: {
	channel: CustomerProfileChannel;
	ownerUserId: string;
	externalUserId: string;
}) {
	const customerId = getChannelCustomerId(input);
	const placeholder = getPlaceholderProfile(input);
	const existingCustomer = await prisma.customer.findFirst({
		where: {
			id: customerId,
			userId: input.ownerUserId,
		},
		select: {
			id: true,
			channels: true,
		},
	});

	if (existingCustomer) {
		if (!existingCustomer.channels.includes(input.channel)) {
			await prisma.customer.update({
				where: {
					id: existingCustomer.id,
				},
				data: {
					channels: mergeCustomerChannels(existingCustomer.channels, input.channel),
				},
				select: {
					id: true,
				},
			});
		}
		return existingCustomer;
	}

	const matchingCustomer = await findOwnedCustomerByNormalizedPhone({
		userId: input.ownerUserId,
		phone: placeholder.phone,
	});

	return prisma.customer.create({
		data: {
			id: customerId,
			userId: input.ownerUserId,
			name: matchingCustomer?.name ?? placeholder.name,
			phone: matchingCustomer?.phone ?? placeholder.phone,
			channels: mergeCustomerChannels(matchingCustomer?.channels ?? [], input.channel),
		},
		select: {
			id: true,
		},
	});
}

export async function findChannelCustomerForUser(input: {
	channel: CustomerProfileChannel;
	ownerUserId: string;
	externalUserId: string;
}) {
	const customerId = getChannelCustomerId(input);
	return prisma.customer.findFirst({
		where: {
			id: customerId,
			userId: input.ownerUserId,
		},
		select: {
			id: true,
			name: true,
			phone: true,
			channels: true,
		},
	});
}

export async function updateChannelCustomerPhoneForUser(input: {
	channel: CustomerProfileChannel;
	ownerUserId: string;
	externalUserId: string;
	phone: string;
}) {
	const customer = await findChannelCustomerForUser(input);

	if (customer) {
		const normalizedPhone = normalizePhoneNumber(input.phone) ?? input.phone;
		const matchingCustomer = await findOwnedCustomerByNormalizedPhone({
			userId: input.ownerUserId,
			phone: normalizedPhone,
			excludeCustomerId: customer.id,
		});
		const placeholder = getPlaceholderProfile(input);
		const shouldReuseKnownName =
			matchingCustomer &&
			customer.name === placeholder.name &&
			matchingCustomer.name !== customer.name;

		return prisma.customer.update({
			where: {
				id: customer.id,
			},
			data: {
				phone: normalizedPhone,
				name: shouldReuseKnownName ? matchingCustomer.name : customer.name,
				channels: mergeCustomerChannels(
					[...customer.channels, ...(matchingCustomer?.channels ?? [])],
					input.channel,
				),
			},
			select: {
				id: true,
				name: true,
				phone: true,
				channels: true,
			},
		});
	}
	return null;
}

export async function getChannelCustomerProfileStatus(input: {
	channel: CustomerProfileChannel;
	ownerUserId: string;
	externalUserId: string;
}) {
	const placeholder = getPlaceholderProfile(input);
	const needsPhoneCollection = channelNeedsPhoneCollection(input.channel);
	const customer = await findChannelCustomerForUser(input);
	if (!customer) {
		return {
			hasCustomer: false,
			needsName: true,
			needsPhone: needsPhoneCollection,
			name: null,
			phone: null,
		} as const;
	}

	const needsName = customer.name === placeholder.name;
	const needsPhone = needsPhoneCollection ? customer.phone === placeholder.phone : false;
	return {
		hasCustomer: true,
		needsName,
		needsPhone,
		name: needsName ? null : customer.name,
		phone: needsPhone ? null : customer.phone,
	} as const;
}

export async function updateChannelCustomerNameForUser(input: {
	channel: CustomerProfileChannel;
	ownerUserId: string;
	externalUserId: string;
	name: string;
}) {
	const customer = await findChannelCustomerForUser(input);

	if (customer) {
		return prisma.customer.update({
			where: {
				id: customer.id,
			},
			data: {
				name: input.name,
				channels: mergeCustomerChannels(customer.channels, input.channel),
			},
			select: {
				id: true,
				name: true,
				phone: true,
				channels: true,
			},
		});
	}
	return null;
}
