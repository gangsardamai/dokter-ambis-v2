const SUPABASE_REQUEST_TIMEOUT_MS = 10_000;

/**
 * Prevent a slow Supabase/Auth request from holding a Vercel request open
 * until the platform's function timeout.
 */
export const fetchWithSupabaseTimeout: typeof fetch = async (
  input,
  init,
) => {
  const controller = new AbortController();
  const upstreamSignal = init?.signal;
  const abortFromUpstream = () => controller.abort();
  const timeoutId = setTimeout(
    () => controller.abort(),
    SUPABASE_REQUEST_TIMEOUT_MS,
  );

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort();
    } else {
      upstreamSignal.addEventListener(
        "abort",
        abortFromUpstream,
        { once: true },
      );
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    upstreamSignal?.removeEventListener(
      "abort",
      abortFromUpstream,
    );
  }
};
