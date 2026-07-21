import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/supabase/types/database.types";

export async function createClient() {

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {

        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {

          // Pada Server Component Next.js 16
          // cookie tidak boleh dimodifikasi.
          // Session refresh akan ditangani middleware.

          try {

            cookiesToSet.forEach(
              ({ name, value, options }) => {

                cookieStore.set(
                  name,
                  value,
                  options
                );

              }
            );

          } catch {

            // Abaikan error.
            // Middleware akan menangani update cookie.

          }

        },

      },
    }
  );

}