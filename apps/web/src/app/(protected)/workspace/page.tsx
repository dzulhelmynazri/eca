"use client";

import { useQuery } from "@tanstack/react-query";
import { PageSection } from "@/components/general/page-section";
import { trpc } from "@/utils/trpc";
import { Card, CardContent } from "@use-forever/ui/components/card";
import { Skeleton } from "@use-forever/ui/components/skeleton";

export default function WorkspacePage() {
	const { data, isLoading } = useQuery(trpc.workspace.get.queryOptions());

	if (isLoading || !data) {
		return (
			<PageSection className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardContent className="space-y-2 text-xs text-muted-foreground">
						<div>
							Workspace: <Skeleton className="inline-block h-3 w-28 align-middle" />
						</div>
						<div>
							Owner user: <Skeleton className="inline-block h-3 w-40 align-middle" />
						</div>
					</CardContent>
				</Card>
			</PageSection>
		);
	}

	return (
		<PageSection className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardContent className="space-y-2 text-xs text-muted-foreground">
					<div>
						Workspace: <span className="font-medium text-foreground">{data.workspaceName}</span>
					</div>
					<div>
						Owner user:{" "}
						<span className="font-medium text-foreground">{data.customerOwnerUserId}</span>
					</div>
				</CardContent>
			</Card>
		</PageSection>
	);
}
