import { customerChannelValues } from "@use-forever/contracts";

export type CustomerChannel = (typeof customerChannelValues)[number];

export const CUSTOMER_CHANNEL_OPTIONS: Array<{
	value: CustomerChannel;
	label: string;
}> = [
	{ value: "telegram", label: "Telegram" },
	{ value: "twilio-sms", label: "Twilio SMS" },
	{ value: "twilio-voice", label: "Twilio Voice" },
];

export const CUSTOMER_CHANNEL_LABEL: Record<CustomerChannel, string> = {
	telegram: "Telegram",
	"twilio-sms": "Twilio SMS",
	"twilio-voice": "Twilio Voice",
};
