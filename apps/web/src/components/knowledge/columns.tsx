"use client";

import {
	columnFilteringFeature,
	createFilteredRowModel,
	createPaginatedRowModel,
	filterFn_includesString,
	rowPaginationFeature,
	tableFeatures,
	type ColumnDef,
} from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { Badge } from "@use-forever/ui/components/badge";
import { Button } from "@use-forever/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@use-forever/ui/components/dropdown-menu";

export type KnowledgeRow = {
	id: string;
	status: "READY" | "SYNCING" | "FAILED";
	name: string;
	type: "FILE" | "WEBSITE";
	lastSynced: string;
	size: string;
	fileUrl: string;
};

type KnowledgeColumnActions = {
	onDeleteKnowledge: (knowledge: KnowledgeRow) => void;
	onResyncKnowledge: (knowledge: KnowledgeRow) => void;
};

const STATUS_STYLES: Record<KnowledgeRow["status"], string> = {
	FAILED: "bg-red-100 text-red-700",
	READY: "bg-emerald-100 text-emerald-700",
	SYNCING: "bg-amber-100 text-amber-700",
};

export const knowledgeTableFeatures = tableFeatures({
	columnFilteringFeature,
	rowPaginationFeature,
	filteredRowModel: createFilteredRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	filterFns: {
		includesString: filterFn_includesString,
	},
});

export function knowledgeColumns({
	onDeleteKnowledge,
	onResyncKnowledge,
}: KnowledgeColumnActions): Array<ColumnDef<typeof knowledgeTableFeatures, KnowledgeRow>> {
	return [
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.original.status;
				return (
					<Badge className={`min-w-14 ${STATUS_STYLES[status]}`} variant="outline">
						{status.toLowerCase().replace(/^./, (character) => character.toUpperCase())}
					</Badge>
				);
			},
		},
		{
			accessorKey: "name",
			filterFn: filterFn_includesString,
			header: "Name",
		},
		{
			accessorKey: "type",
			header: "Type",
			cell: ({ row }) => (row.original.type === "FILE" ? "File" : "Website"),
		},
		{
			accessorKey: "lastSynced",
			header: "Last synced",
		},
		{
			accessorKey: "size",
			header: "Size",
		},
		{
			accessorKey: "fileUrl",
			header: "File/URL",
			cell: ({ row }) => {
				const { fileUrl, type } = row.original;
				return (
					<a
						className="text-primary max-w-80 truncate underline-offset-4 hover:underline"
						href={fileUrl}
						rel="noopener noreferrer"
						target="_blank"
						title={fileUrl}
					>
						{type === "FILE" ? "View file" : fileUrl}
					</a>
				);
			},
		},
		{
			id: "actions",
			header: () => <div className="text-right">Actions</div>,
			cell: ({ row }) => {
				const knowledge = row.original;
				return (
					<div className="text-right">
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button size="icon" variant="ghost" />}>
								<span className="sr-only">Open knowledge actions</span>
								<MoreHorizontalIcon data-icon="inline-start" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuGroup>
									<DropdownMenuLabel>{knowledge.name}</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="cursor-pointer"
										onClick={() => {
											onResyncKnowledge(knowledge);
										}}
									>
										Resync
									</DropdownMenuItem>
									<DropdownMenuItem
										variant="destructive"
										className="cursor-pointer"
										onClick={() => {
											onDeleteKnowledge(knowledge);
										}}
									>
										Delete
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];
}
