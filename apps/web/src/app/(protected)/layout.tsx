import { Separator } from "@use-forever/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@use-forever/ui/components/sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { RouteTitle } from "@/components/route-title";
import { auth } from "@/lib/auth";
// import { Button } from "@use-forever/ui/components/button";

type ProtectedLayoutProps = {
	children: React.ReactNode;
};

const ProtectedLayoutFallback = () => (
	<div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
		Wait laaaa...
	</div>
);

const ProtectedLayoutContent = async ({ children }: ProtectedLayoutProps) => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth");
	}

	return (
		<SidebarProvider className="h-svh overflow-hidden">
			<AppSidebar />
			<SidebarInset className="min-h-0 overflow-hidden">
				<header className="sticky top-0 z-10 flex h-12 items-center justify-between bg-background px-3">
					<div className="flex items-center gap-2">
						<SidebarTrigger />
						<div aria-hidden="true" className="h-4 w-px bg-border -ml-1" />
						<RouteTitle />
					</div>
					<div className="flex items-center gap-2">
						<ModeToggle />
						{/* <Button variant="outline">Ask Agent</Button> */}
					</div>
				</header>
				<Separator />
				<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
	return (
		<Suspense fallback={<ProtectedLayoutFallback />}>
			<ProtectedLayoutContent>{children}</ProtectedLayoutContent>
		</Suspense>
	);
}
