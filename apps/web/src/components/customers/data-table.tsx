"use client";

import { flexRender, useTable, type ColumnFiltersState } from "@tanstack/react-table";
import { useMutation } from "@tanstack/react-query";
import { parseAsInteger, parseAsNumberLiteral, parseAsString, useQueryStates } from "nuqs";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@use-forever/ui/components/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@use-forever/ui/components/empty";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@use-forever/ui/components/input-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@use-forever/ui/components/select";
import { Skeleton } from "@use-forever/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@use-forever/ui/components/table";
import { toast } from "sonner";

import { AddSheet } from "./add-sheet";
import { customerColumns, customerTableFeatures, type CustomerRow } from "./columns";
import { EditSheet } from "./edit-sheet";
import { queryClient, trpc } from "@/utils/trpc";

type DataTableProps = {
	data: CustomerRow[];
	isLoading?: boolean;
};

const PAGE_SIZE_OPTIONS = [5, 12, 24, 48] as const;

function normalizePageSize(value: number): (typeof PAGE_SIZE_OPTIONS)[number] {
	return PAGE_SIZE_OPTIONS.includes(value as (typeof PAGE_SIZE_OPTIONS)[number])
		? (value as (typeof PAGE_SIZE_OPTIONS)[number])
		: 12;
}

export function DataTable({ data, isLoading = false }: DataTableProps) {
	const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
	const deleteCustomerMutation = useMutation(
		trpc.customers.delete.mutationOptions({
			onSuccess: async (deletedCustomer) => {
				toast.success(`Deleted ${deletedCustomer.name}`);
				await queryClient.invalidateQueries({
					queryKey: trpc.customers.list.queryOptions().queryKey,
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);
	const [paginationParams, setPaginationParams] = useQueryStates({
		name: parseAsString.withDefault(""),
		page: parseAsInteger.withDefault(1),
		pageSize: parseAsNumberLiteral(PAGE_SIZE_OPTIONS).withDefault(12),
	});
	const [nameFilterInput, setNameFilterInput] = useState(paginationParams.name);

	useEffect(() => {
		setNameFilterInput(paginationParams.name);
	}, [paginationParams.name]);

	const pagination = {
		pageIndex: Math.max(0, paginationParams.page - 1),
		pageSize: paginationParams.pageSize,
	};
	const columnFilters: ColumnFiltersState = nameFilterInput
		? [{ id: "name", value: nameFilterInput }]
		: [];
	const table = useTable({
		features: customerTableFeatures,
		data,
		columns: customerColumns({
			onEditCustomer: (customer) => {
				setEditingCustomer(customer);
				setIsEditSheetOpen(true);
			},
			onDeleteCustomer: (customerId) => {
				void deleteCustomerMutation.mutateAsync({ customerId });
			},
			deletingCustomerId: deleteCustomerMutation.variables?.customerId ?? null,
		}),
		state: { columnFilters, pagination },
		onPaginationChange: (updater) => {
			const nextPagination = typeof updater === "function" ? updater(pagination) : updater;
			void setPaginationParams({
				page: nextPagination.pageIndex + 1,
				pageSize: normalizePageSize(nextPagination.pageSize),
			});
		},
	});
	const visibleColumns = table.getAllLeafColumns();
	const skeletonRowIds = ["skeleton-row-1", "skeleton-row-2", "skeleton-row-3", "skeleton-row-4"];

	return (
		<div className="space-y-4">
			<EditSheet
				customer={editingCustomer}
				onOpenChange={(nextOpen) => {
					setIsEditSheetOpen(nextOpen);
					if (!nextOpen) {
						setEditingCustomer(null);
					}
				}}
				open={isEditSheetOpen}
			/>
			<div className="flex items-center justify-between">
				<InputGroup className="max-w-xs">
					<InputGroupAddon>
						<InputGroupText>
							<SearchIcon />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput
						onChange={(event) => {
							const nextName = event.target.value;
							setNameFilterInput(nextName);
							void setPaginationParams({
								name: nextName,
								page: 1,
							});
						}}
						placeholder="Search by name..."
						value={nameFilterInput}
					/>
				</InputGroup>

				<AddSheet />
			</div>
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							skeletonRowIds.map((skeletonRowId) => (
								<TableRow key={skeletonRowId}>
									{visibleColumns.map((column) => (
										<TableCell key={`${skeletonRowId}-${column.id}`}>
											{column.id === "actions" ? (
												<Skeleton className="ml-auto size-7 rounded-md" />
											) : (
												<Skeleton className="h-4 w-full max-w-48" />
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getAllCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="p-6" colSpan={visibleColumns.length}>
									<Empty className="border-none p-0">
										<EmptyHeader>
											<EmptyTitle>
												{nameFilterInput ? "No customers found" : "No customers yet"}
											</EmptyTitle>
											<EmptyDescription>
												{nameFilterInput
													? `No customers match "${nameFilterInput}".`
													: "Customers will appear here once they are added."}
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm">Rows per page</span>
					<Select
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
						value={`${table.state.pagination.pageSize}`}
					>
						<SelectTrigger className="w-20">
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="end">
							{PAGE_SIZE_OPTIONS.map((pageSize) => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm">
						Page {table.state.pagination.pageIndex + 1} of {table.getPageCount()}
					</span>
					<Button
						disabled={!table.getCanPreviousPage() || isLoading}
						onClick={() => {
							table.previousPage();
						}}
						size="sm"
						variant="outline"
					>
						Previous
					</Button>
					<Button
						disabled={!table.getCanNextPage() || isLoading}
						onClick={() => {
							table.nextPage();
						}}
						size="sm"
						variant="outline"
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
