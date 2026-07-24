import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";
import type { Database } from "@/supabase/types/database.types";

interface AuthErrorLike {
  code?: unknown;
  message?: unknown;
}

function isStaleRefreshTokenError(
  error: unknown,
): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { code, message } = error as AuthErrorLike;
  const normalizedCode =
    typeof code === "string" ? code.toLowerCase() : "";
  const normalizedMessage =
    typeof message === "string"
      ? message.toLowerCase()
      : "";

  return (
    normalizedCode === "refresh_token_not_found" ||
    normalizedCode === "refresh_token_already_used" ||
    normalizedMessage.includes("invalid refresh token") ||
    normalizedMessage.includes("refresh token not found") ||
    normalizedMessage.includes("refresh token already used")
  );
}

function clearSupabaseAuthCookies(
  request: NextRequest,
  previousResponse: NextResponse,
): NextResponse {
  const cookieNames = new Set(
    [
      ...request.cookies.getAll(),
      ...previousResponse.cookies.getAll(),
    ]
      .map(({ name }) => name)
      .filter(
        (name) =>
          name.startsWith("sb-") &&
          name.includes("-auth-token"),
      ),
  );

  cookieNames.forEach((name) => {
    request.cookies.delete(name);
  });

  const clearedResponse = NextResponse.next({
    request,
  });

  cookieNames.forEach((name) => {
    clearedResponse.cookies.set(name, "", {
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
  });

  clearedResponse.headers.set(
    "Cache-Control",
    "private, no-store",
  );

  return clearedResponse;
}

export async function updateSession(
  request: NextRequest,
) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value,
              );
            },
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              response.cookies.set(
                name,
                value,
                options,
              );
            },
          );

          Object.entries(headers).forEach(
            ([key, value]) => {
              response.headers.set(
                key,
                value,
              );
            },
          );
        },
      },
    },
  );

  try {
    const { error } =
      await supabase.auth.getClaims();

    if (error && isStaleRefreshTokenError(error)) {
      return clearSupabaseAuthCookies(
        request,
        response,
      );
    }
  } catch (error) {
    if (!isStaleRefreshTokenError(error)) {
      throw error;
    }

    return clearSupabaseAuthCookies(
      request,
      response,
    );
  }

  return response;
}
