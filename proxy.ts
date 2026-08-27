import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES_WITHOUT_SESSION_REFRESH = new Set([
  "/",
  "/login",
  "/register",
]);

export async function proxy(
  request: NextRequest,
) {
  if (
    PUBLIC_ROUTES_WITHOUT_SESSION_REFRESH.has(
      request.nextUrl.pathname,
    )
  ) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
