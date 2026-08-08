"use client";

import { cn } from "@use-forever/ui/lib/utils";
import type { ComponentProps } from "react";

function Label({ className, children, htmlFor, ...props }: ComponentProps<"label">) {
	return (
		<label
			className={cn(
				"flex select-none items-center gap-2 font-medium text-xs/relaxed leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
				className,
			)}
			data-slot="label"
			htmlFor={htmlFor}
			{...props}
		>
			{children}
		</label>
	);
}

export { Label };
