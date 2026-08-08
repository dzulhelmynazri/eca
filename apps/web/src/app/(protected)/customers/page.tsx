"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@/components/customers/data-table";
import { PageSection } from "@/components/general/page-section";
import { trpc } from "@/utils/trpc";

export default function CustomersPage() {
	const { data: customers = [], isLoading } = useQuery(trpc.customers.list.queryOptions());

	return (
		<PageSection>
			<DataTable data={customers} isLoading={isLoading} />
		</PageSection>
	);
}
