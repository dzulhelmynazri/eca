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
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@use-forever/ui/components/avatar";
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
import { TelegramIcon, TwilioIcon } from "@use-forever/ui/components/socials";
import { Spinner } from "@use-forever/ui/components/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@use-forever/ui/components/tooltip";
import { type CustomerChannel, CUSTOMER_CHANNEL_LABEL } from "./channels";

export type CustomerRow = {
	id: string;
	name: string;
	phone: string;
	channels: CustomerChannel[];
};

type CustomerColumnActions = {
	onEditCustomer: (customer: CustomerRow) => void;
	onDeleteCustomer: (customerId: string) => void;
	deletingCustomerId?: string | null;
};

export const customerTableFeatures = tableFeatures({
	columnFilteringFeature,
	rowPaginationFeature,
	filteredRowModel: createFilteredRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	filterFns: {
		includesString: filterFn_includesString,
	},
});

const CHANNEL_AVATAR_LIMIT = 3;

const CHANNEL_ICON: Record<CustomerChannel, React.ComponentType<React.ComponentProps<"svg">>> = {
	telegram: TelegramIcon,
	"twilio-sms": TwilioIcon,
	"twilio-voice": TwilioIcon,
};

export function customerColumns({
	onEditCustomer,
	onDeleteCustomer,
	deletingCustomerId = null,
}: CustomerColumnActions): Array<ColumnDef<typeof customerTableFeatures, CustomerRow>> {
	return [
		{
			accessorKey: "name",
			filterFn: filterFn_includesString,
			header: "Name",
		},
		{
			accessorKey: "phone",
			header: "Phone",
		},
		{
			accessorKey: "channels",
			header: "Channels",
			cell: ({ row }) => {
				const channels = Array.isArray(row.original.channels) ? row.original.channels : [];
				if (!channels.length) {
					return <span className="text-muted-foreground text-sm">Not set</span>;
				}

				const visibleChannels = channels.slice(0, CHANNEL_AVATAR_LIMIT);
				const remainingChannelsCount = channels.length - visibleChannels.length;
				const hiddenChannelLabels = channels
					.slice(CHANNEL_AVATAR_LIMIT)
					.map((channel) => CUSTOMER_CHANNEL_LABEL[channel])
					.join(", ");

				return (
					<TooltipProvider>
						<AvatarGroup
							aria-label={channels.map((channel) => CUSTOMER_CHANNEL_LABEL[channel]).join(", ")}
						>
							{visibleChannels.map((channel) => {
								const ChannelIcon = CHANNEL_ICON[channel];
								return (
									<Tooltip key={channel}>
										<TooltipTrigger>
											<Avatar size="sm">
												<AvatarFallback>
													<ChannelIcon aria-hidden className="size-5" />
												</AvatarFallback>
											</Avatar>
										</TooltipTrigger>
										<TooltipContent>{CUSTOMER_CHANNEL_LABEL[channel]}</TooltipContent>
									</Tooltip>
								);
							})}
							{remainingChannelsCount > 0 ? (
								<Tooltip>
									<TooltipTrigger>
										<AvatarGroupCount>+{remainingChannelsCount}</AvatarGroupCount>
									</TooltipTrigger>
									<TooltipContent>{hiddenChannelLabels}</TooltipContent>
								</Tooltip>
							) : null}
						</AvatarGroup>
					</TooltipProvider>
				);
			},
		},
		{
			id: "actions",
			header: () => <div className="text-right">Actions</div>,
			cell: ({ row }) => {
				const customer = row.original;
				const isDeleting = deletingCustomerId === customer.id;

				return (
					<div className="text-right">
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button size="icon" variant="ghost" />}>
								<span className="sr-only">Open customer actions</span>
								<MoreHorizontalIcon data-icon="inline-start" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuGroup>
									<DropdownMenuLabel>{customer.name}</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="cursor-pointer"
										onClick={() => {
											onEditCustomer(customer);
										}}
									>
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem
										variant="destructive"
										className="cursor-pointer"
										disabled={isDeleting}
										onClick={() => {
											onDeleteCustomer(customer.id);
										}}
									>
										{isDeleting ? <Spinner data-icon="inline-start" /> : "Delete"}
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
