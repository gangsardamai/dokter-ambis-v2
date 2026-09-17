import { createClient } from "@/lib/supabase/server";

interface DynamicRpcError {
  message: string;
}

interface DynamicRpcResponse<T> {
  data: T | null;
  error: DynamicRpcError | null;
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type DynamicRpcClient = {
  rpc: <T>(
    functionName: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<DynamicRpcResponse<T>>;
};

export async function callDynamicRpc<T>(
  client: ServerSupabaseClient,
  functionName: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const dynamicClient = client as unknown as DynamicRpcClient;
  const { data, error } = await dynamicClient.rpc<T>(functionName, args);

  if (error) {
    throw new Error(error.message);
  }

  return data as T;
}
