import { updateSession } from "@/lib/supabase/middleware";

import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/materials/:path*",
    "/api/mentor-reviews/:path*",
    "/api/quiz-images/:path*",
    "/api/tryout-images/:path*",
    "/api/uploads/:path*",
  ],
};
