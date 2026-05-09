import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const protectedPrefixes = ["/dashboard", "/scans", "/collection"];

/** Next.js inlines NEXT_PUBLIC_* at build time — OK for temporary QA bypass only. */
function isDemoModeEnv(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/** When demo mode is on, these paths skip the session gate (sample UI only). */
function isDemoPublicAppPath(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
  if (pathname === "/collection" || pathname.startsWith("/collection/")) return true;
  if (pathname === "/scans/new") return true;
  const m = pathname.match(/^\/scans\/([^/]+)/);
  return m?.[1] === "demo";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (isDemoModeEnv() && isDemoPublicAppPath(pathname)) {
    return NextResponse.next();
  }

  const { supabase, response } = createSupabaseMiddlewareClient(request);

  if (!supabase) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

/**
 * Session gate only for app shells. `/login`, `/auth/callback`, `/api/*`, marketing routes
 * are excluded so magic-link auth and diagnostics are never blocked here.
 */
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/scans",
    "/scans/:path*",
    "/collection",
    "/collection/:path*",
  ],
};
