"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@use-forever/ui/components/button";
import { GoogleIcon } from "@use-forever/ui/components/socials";
import { useTransition } from "react";

import { signIn, signOut, useSession } from "@/lib/auth-client";

export default function AuthPage() {
	const { data: session } = useSession();
	const [isRedirecting, startRedirectTransition] = useTransition();

	const handleSignIn = () => {
		startRedirectTransition(async () => {
			await signIn.social({
				provider: "google",
			});
		});
	};

	const handleSignOut = async () => {
		await signOut();
	};

	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-6">
			<div className="w-full max-w-md">
				<h1 className="mb-2 text-center text-lg font-semibold">Auth</h1>
				<div className="flex items-center justify-center gap-2">
					{session?.user ? (
						<>
							<Button onClick={handleSignOut} type="button" variant="outline">
								Sign out
							</Button>
							<Link className={buttonVariants()} href="/customers">
								Go to customers
							</Link>
						</>
					) : (
						<Button disabled={isRedirecting} onClick={handleSignIn} type="button" variant="outline">
							<GoogleIcon className="size-4" data-icon="inline-start" />
							{isRedirecting ? "Redirecting..." : "Sign in with Google"}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
