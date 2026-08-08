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
import { TwilioIcon } from "@use-forever/ui/components/socials";
import { Spinner } from "@use-forever/ui/components/spinner";

type TwilioIntegrationCardProps = {
	updatedAt?: string | null;
};

export function TwilioIntegrationCard({ updatedAt }: TwilioIntegrationCardProps) {
	const [accountSid, setAccountSid] = useState("");
	const [authToken, setAuthToken] = useState("");
	const [messagingFrom, setMessagingFrom] = useState("");
	const [allowFrom, setAllowFrom] = useState("*");
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const isConnected = Boolean(updatedAt);

	const saveMutation = useMutation(
		trpc.integrations.upsertTwilio.mutationOptions({
			onError: (error) => toast.error(error.message),
			onSuccess: async () => {
				toast.success("Twilio credentials saved.");
				setAuthToken("");
				await queryClient.invalidateQueries({
					queryKey: trpc.integrations.get.queryOptions().queryKey,
				});
			},
		}),
	);
	const disconnectMutation = useMutation(
		trpc.integrations.disconnectTwilio.mutationOptions({
			onError: (error) => toast.error(error.message),
			onSuccess: async () => {
				toast.success("Twilio disconnected.");
				setAccountSid("");
				setAuthToken("");
				setMessagingFrom("");
				setAllowFrom("*");
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
					<TwilioIcon aria-hidden className="size-5" />
					Twilio
					<span
						aria-label="Twilio integration status"
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
								<SheetTitle>{isConnected ? "Manage Twilio" : "Connect Twilio"}</SheetTitle>
								<SheetDescription>
									{isConnected
										? "Update your Twilio details or disconnect this workspace."
										: "Add your Twilio details to connect this workspace."}
								</SheetDescription>
							</SheetHeader>
							<form
								className="flex h-full flex-col"
								onSubmit={(event) => {
									event.preventDefault();
									void saveMutation
										.mutateAsync({
											accountSid,
											authToken,
											messagingFrom,
											allowFrom,
										})
										.then(() => {
											setIsSheetOpen(false);
										});
								}}
							>
								<FieldGroup className="px-6">
									<Field>
										<FieldLabel htmlFor="twilio-account-sid">Account SID</FieldLabel>
										<Input
											id="twilio-account-sid"
											onChange={(event) => setAccountSid(event.target.value)}
											value={accountSid}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="twilio-auth-token">Auth token</FieldLabel>
										<Input
											id="twilio-auth-token"
											onChange={(event) => setAuthToken(event.target.value)}
											type="password"
											value={authToken}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="twilio-messaging-from">Messaging from</FieldLabel>
										<Input
											id="twilio-messaging-from"
											onChange={(event) => setMessagingFrom(event.target.value)}
											placeholder="+15551234567"
											value={messagingFrom}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="twilio-allow-from">Allow from</FieldLabel>
										<Input
											id="twilio-allow-from"
											onChange={(event) => setAllowFrom(event.target.value)}
											value={allowFrom}
										/>
									</Field>
								</FieldGroup>
								<SheetFooter>
									{isConnected ? (
										<Button
											disabled={disconnectMutation.isPending || saveMutation.isPending}
											onClick={() => {
												if (!window.confirm("Disconnect Twilio from this workspace?")) {
													return;
												}
												void disconnectMutation.mutateAsync();
											}}
											type="button"
											variant="destructive"
										>
											{disconnectMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
											Disconnect
										</Button>
									) : null}
									<Button
										disabled={disconnectMutation.isPending || saveMutation.isPending}
										type="submit"
									>
										{saveMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
										{isConnected ? "Update" : "Save"}
									</Button>
								</SheetFooter>
							</form>
						</SheetContent>
					</Sheet>
				</CardAction>
			</CardHeader>
			<CardContent className="text-sm text-muted-foreground">
				Send and receive SMS and voice calls.
			</CardContent>
			<CardContent />
		</Card>
	);
}
