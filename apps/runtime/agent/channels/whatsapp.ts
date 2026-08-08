import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createRedisState } from "@chat-adapter/state-redis";
import type { Message, Thread } from "chat";
import { chatSdkChannel } from "eve/channels/chat-sdk";
import { agentDisplayName } from "../lib/channel-config";

export const { bot, channel, send } = chatSdkChannel({
	userName: agentDisplayName,
	adapters: { whatsapp: createWhatsAppAdapter() },
	state: createRedisState(),
});

bot.onNewMention(async (thread: Thread, message: Message) => {
	await thread.subscribe();
	await send(message.text, { thread });
});

bot.onSubscribedMessage(async (thread: Thread, message: Message) => {
	await send(message.text, { thread });
});

export default channel;
