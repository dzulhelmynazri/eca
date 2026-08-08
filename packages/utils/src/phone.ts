import { AsYouType } from "libphonenumber-js";

export const formatPhoneInput = (value: string): string => {
	const digitsOnly = value.replace(/\D/g, "");
	if (digitsOnly.length === 0) {
		return "";
	}

	const normalized = `+${digitsOnly}`;
	return new AsYouType().input(normalized);
};
