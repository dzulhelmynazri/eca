"use client";

import { usePathname } from "next/navigation";

import { getAppNavLabel } from "@/components/app-sidebar";

export function RouteTitle() {
	const pathname = usePathname();

	return <p className="text-sm font-medium">{getAppNavLabel(pathname)}</p>;
}
