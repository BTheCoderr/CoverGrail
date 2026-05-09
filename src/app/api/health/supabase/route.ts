import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** @deprecated Use GET /api/health/auth-config */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/api/health/auth-config", request.url));
}
