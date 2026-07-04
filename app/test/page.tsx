import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("programs")
    .select("*");

  return (
    <main style={{ padding: 40 }}>
      <h1>Supabase Connection Test</h1>

      <pre>
        {JSON.stringify(
          {
            data,
            error,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}