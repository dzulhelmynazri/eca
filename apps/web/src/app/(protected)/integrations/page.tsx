"use client";

import { useQuery } from "@tanstack/react-query";
import { PageSection } from "@/components/general/page-section";
import { TelegramIntegrationCard } from "@/components/integrations/telegram";
import { TwilioIntegrationCard } from "@/components/integrations/twilio";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader } from "@use-forever/ui/components/card";
import { Skeleton } from "@use-forever/ui/components/skeleton";

export default function IntegrationsPage() {
	const { data, isLoading } = useQuery(trpc.integrations.get.queryOptions());

	if (isLoading || !data) {
		return (
			<PageSection className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 2 }).map((_, index) => (
					<Card className="pb-0" key={`integration-skeleton-${index}`}>
						<CardHeader className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Skeleton className="size-6 rounded-full" />
								<Skeleton className="h-4.5 w-12" />
							</div>
							<Skeleton className="h-6 w-16 rounded-md" />
						</CardHeader>
						<CardContent className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-48" />
						</CardContent>
						<CardContent />
					</Card>
				))}
			</PageSection>
		);
	}

	const twilioStatus = data.integrations.find((integration) => integration.provider === "TWILIO");
	const telegramStatus = data.integrations.find(
		(integration) => integration.provider === "TELEGRAM",
	);

	return (
		<PageSection className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			<TwilioIntegrationCard updatedAt={twilioStatus?.updatedAt} />
			<TelegramIntegrationCard updatedAt={telegramStatus?.updatedAt} />
		</PageSection>
	);
}
