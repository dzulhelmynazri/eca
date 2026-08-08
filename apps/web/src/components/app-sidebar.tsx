"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@use-forever/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@use-forever/ui/components/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@use-forever/ui/components/sidebar";
import {
	Astroid,
	BookOpenIcon,
	Building2Icon,
	LogOutIcon,
	MoreVerticalIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { signOut, useSession } from "@/lib/auth-client";
import { Spinner } from "@use-forever/ui/components/spinner";

export const appNavConfig = [
	{
		href: "/customers",
		label: "Customers",
		icon: UsersIcon,
	},
	{
		href: "/knowledge",
		label: "Knowledge",
		icon: BookOpenIcon,
	},
	{
		href: "/integrations",
		label: "Integrations",
		icon: SettingsIcon,
	},
	{
		href: "/workspace",
		label: "Workspace",
		icon: Building2Icon,
	},
] as const;

const isActiveRoute = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(`${href}/`);

export const getAppNavLabel = (pathname: string) => {
	const route = appNavConfig.find((item) => isActiveRoute(pathname, item.href));

	return route?.label ?? "";
};

const getInitials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase() ?? "")
		.join("");

function UserInfo({
	name,
	email,
	avatar,
	initials,
}: {
	name: string;
	email: string;
	avatar: string;
	initials: string;
}) {
	return (
		<>
			<Avatar className="size-8 rounded-lg">
				<AvatarImage alt={name} src={avatar} />
				<AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
			</Avatar>

			<div className="grid flex-1 text-left text-xs leading-tight">
				<span className="truncate font-semibold">{name}</span>
				<span className="truncate text-muted-foreground">{email}</span>
			</div>
		</>
	);
}

export function AppSidebar() {
	const pathname = usePathname();
	const { data: session } = useSession();
	const [isSigningOut, startSignOutTransition] = useTransition();

	const userName = session?.user.name ?? "User";
	const userEmail = session?.user.email ?? "";
	const userAvatar = session?.user.image ?? "";
	const userInitials = getInitials(userName) || "U";

	const handleSignOut = () => {
		startSignOutTransition(async () => {
			await signOut();
		});
	};

	return (
		<Sidebar collapsible="icon" variant="inset">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							className="group-data-[collapsible=icon]:justify-center"
							render={<Link href="/customers" />}
							size="lg"
						>
							<Astroid />
							<span className="group-data-[collapsible=icon]:hidden">Hackhaton - AI Agent</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Main</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{appNavConfig.map(({ href, label, icon: Icon }) => {
								return (
									<SidebarMenuItem key={href}>
										<SidebarMenuButton
											isActive={isActiveRoute(pathname, href)}
											render={<Link href={href} />}
											tooltip={label}
										>
											<Icon />
											<span>{label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<SidebarMenuButton
										className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
										size="lg"
									/>
								}
							>
								<UserInfo
									avatar={userAvatar}
									email={userEmail}
									initials={userInitials}
									name={userName}
								/>
								<MoreVerticalIcon className="ml-auto size-4" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="min-w-56 rounded-lg" side="top">
								<DropdownMenuGroup>
									<DropdownMenuLabel className="p-0 font-normal">
										<div className="flex items-center gap-2 px-1 py-1.5 text-left text-xs">
											<UserInfo
												avatar={userAvatar}
												email={userEmail}
												initials={userInitials}
												name={userName}
											/>
										</div>
									</DropdownMenuLabel>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									disabled={isSigningOut}
									onClick={handleSignOut}
									className="cursor-pointer"
								>
									<LogOutIcon />
									{isSigningOut ? <Spinner data-icon="inline-start" /> : "Log out"}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
