"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/knowledge/data-table";
import type { KnowledgeRow } from "@/components/knowledge/columns";
import { PageSection } from "@/components/general/page-section";
import { trpc } from "@/utils/trpc";
import { formatBytes, formatDate } from "@use-forever/utils";

function formatLastSynced(value: Date | string | null) {
	if (!value) {
		return "-";
	}

	try {
		return formatDate(value, "dd MMM yyyy HH:mm");
	} catch {
		return "-";
	}
}

export default function KnowledgePage() {
	const { data: knowledgeSources = [], isLoading } = useQuery(trpc.knowledge.list.queryOptions());
	const knowledgeRows: KnowledgeRow[] = knowledgeSources.map((source) => ({
		fileUrl: source.sourceUrl ?? `/api/storage?key=${encodeURIComponent(source.fileKey ?? "")}`,
		id: source.id,
		lastSynced: formatLastSynced(source.lastSyncedAt),
		name: source.name,
		size: formatBytes(source.sizeBytes),
		status: source.status,
		type: source.type,
	}));

	return (
		<PageSection>
			<DataTable data={knowledgeRows} isLoading={isLoading} />
		</PageSection>
	);
}
