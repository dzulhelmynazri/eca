"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { queryClient, trpc } from "@/utils/trpc";
import { Button } from "@use-forever/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@use-forever/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@use-forever/ui/components/field";
import { Input } from "@use-forever/ui/components/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@use-forever/ui/components/sheet";
import { TelegramIcon } from "@use-forever/ui/components/socials";
import { Spinner } from "@use-forever/ui/components/spinner";

type TelegramIntegrationCardProps = {
	updatedAt?: string | null;
};

export function TelegramIntegrationCard({ updatedAt }: TelegramIntegrationCardProps) {
	const [botToken, setBotToken] = useState("");
	const [webhookSecretToken, setWebhookSecretToken] = useState("");
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const isConnected = Boolean(updatedAt);

	const saveMutation = useMutation(
		trpc.integrations.upsertTelegram.mutationOptions({
			onError: (error) => toast.error(error.message),
			onSuccess: async () => {
				toast.success("Telegram credentials saved.");
				setBotToken("");
				setWebhookSecretToken("");
				await queryClient.invalidateQueries({
					queryKey: trpc.integrations.get.queryOptions().queryKey,
				});
			},
		}),
	);
	const disconnectMutation = useMutation(
		trpc.integrations.disconnectTelegram.mutationOptions({
			onError: (error) => toast.error(error.message),
			onSuccess: async () => {
				toast.success("Telegram disconnected.");
				setBotToken("");
				setWebhookSecretToken("");
				setIsSheetOpen(false);
				await queryClient.invalidateQueries({
					queryKey: trpc.integrations.get.queryOptions().queryKey,
				});
			},
		}),
	);

	const indicatorClassName = updatedAt ? "bg-emerald-500" : null;

	return (
		<Card className="pb-0">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TelegramIcon aria-hidden className="size-5" />
					Telegram
					<span
						aria-label="Telegram status"
						className={`inline-block size-2 rounded-full ${indicatorClassName}`}
						role="img"
					/>
				</CardTitle>
				<CardAction>
					<Sheet onOpenChange={setIsSheetOpen} open={isSheetOpen}>
						<SheetTrigger render={<Button variant="outline" size="sm" />}>
							{isConnected ? "Manage" : "Connect"}
						</SheetTrigger>
						<SheetContent floating side="right">
							<SheetHeader>
								<SheetTitle>{isConnected ? "Manage Telegram" : "Connect Telegram"}</SheetTitle>
								<SheetDescription>
									{isConnected
										? "Update your Telegram details or disconnect this workspace."
										: "Add your Telegram details to connect this workspace."}
								</SheetDescription>
							</SheetHeader>
							<form
								className="flex h-full flex-col"
								onSubmit={(event) => {
									event.preventDefault();
									void saveMutation
										.mutateAsync({
											botToken,
											webhookSecretToken,
										})
										.then(() => {
											setIsSheetOpen(false);
										});
								}}
							>
								<FieldGroup className="px-6">
									<Field>
										<FieldLabel htmlFor="telegram-bot-token">Bot token</FieldLabel>
										<Input
											id="telegram-bot-token"
											onChange={(event) => setBotToken(event.target.value)}
											type="password"
											value={botToken}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="telegram-webhook-secret">Webhook secret token</FieldLabel>
										<Input
											id="telegram-webhook-secret"
											onChange={(event) => setWebhookSecretToken(event.target.value)}
											type="password"
											value={webhookSecretToken}
										/>
									</Field>
								</FieldGroup>
								<SheetFooter>
									{isConnected ? (
										<Button
											disabled={disconnectMutation.isPending || saveMutation.isPending}
											onClick={() => {
												if (!window.confirm("Disconnect Telegram from this workspace?")) {
													return;
												}
												void disconnectMutation.mutateAsync();
											}}
											type="button"
											variant="destructive"
										>
											{disconnectMutation.isPending ? (
												<Spinner data-icon="inline-start" />
											) : (
												"Disconnect"
											)}
										</Button>
									) : null}
									<Button
										disabled={disconnectMutation.isPending || saveMutation.isPending}
										type="submit"
									>
										{saveMutation.isPending ? (
											<Spinner data-icon="inline-start" />
										) : isConnected ? (
											"Update"
										) : (
											"Save"
										)}
									</Button>
								</SheetFooter>
							</form>
						</SheetContent>
					</Sheet>
				</CardAction>
			</CardHeader>
			<CardContent className="text-sm text-muted-foreground">
				Receive and reply to Telegram messages.
			</CardContent>
			<CardContent />
		</Card>
	);
}
