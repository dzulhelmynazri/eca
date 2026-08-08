import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PATH_PREFIXES = ["/customers", "/knowledge"];
const PUBLIC_AUTH_PATH_PREFIXES = ["/auth"];

const pathMatchesAnyPrefix = (pathname: string, prefixes: string[]) => {
	for (const prefix of prefixes) {
		if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
			return true;
		}
	}

	return false;
};

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const isProtectedPath = pathMatchesAnyPrefix(pathname, PROTECTED_PATH_PREFIXES);
	const isPublicAuthPath = pathMatchesAnyPrefix(pathname, PUBLIC_AUTH_PATH_PREFIXES);

	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (isProtectedPath && !session) {
		const targetUrl = new URL("/auth", request.url);
		targetUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
		return NextResponse.redirect(targetUrl);
	}

	if (isPublicAuthPath && session) {
		const targetUrl = new URL("/customers", request.url);
		return NextResponse.redirect(targetUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/customers/:path*", "/knowledge/:path*", "/auth/:path*"],
};
