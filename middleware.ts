import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { COOKIE_NAME } from "@/lib/auth/session";

const PROTECTED_PREFIXES = ["/documents", "/reports"];

export function middleware(req: NextRequest) {
    const isProtected = PROTECTED_PREFIXES.some((p) =>
        req.nextUrl.pathname.startsWith(p)
    );
    if (!isProtected) return NextResponse.next();

    const token = req.cookies.get(COOKIE_NAME)?.value;
    const session = token ? verifyToken(token) : null;

    if (!session) {
        const loginUrl = new URL("/login", req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/documents/:path*", "/reports/:path*"],
};