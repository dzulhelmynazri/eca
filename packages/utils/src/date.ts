import { format, isValid, parseISO } from "date-fns";

type DateInput = Date | number | string;

const toValidDate = (value: DateInput): Date => {
	const date =
		typeof value === "string" ? parseISO(value) : value instanceof Date ? value : new Date(value);

	if (!isValid(date)) {
		throw new Error("Invalid date value");
	}

	return date;
};

export const formatDate = (value: DateInput, pattern = "dd MMM yyyy"): string => {
	const date = toValidDate(value);

	return format(date, pattern);
};

export const toIsoDate = (value: DateInput): string => {
	return toValidDate(value).toISOString();
};
