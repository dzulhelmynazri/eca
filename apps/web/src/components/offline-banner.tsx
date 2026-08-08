"use client";

import { useOffline } from "next/offline";

export default function OfflineBanner() {
	const isOffline = useOffline();

	if (!isOffline) {
		return null;
	}

	return (
		<div className="border-amber-300 border-b bg-amber-50 px-4 py-2 text-center text-amber-900 text-sm">
			You're offline. Retrying when you reconnect.
		</div>
	);
}
