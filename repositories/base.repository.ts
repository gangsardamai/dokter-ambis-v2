import { createClient } from "@/lib/supabase/server";

export abstract class BaseRepository {

  /**
   * Create Supabase server client
   */
  protected async db() {
    return await createClient();
  }

  /**
   * Throw database error
   */
  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unknown database error");
  }

  /**
   * Ensure data exists
   */
  protected requireData<T>(data: T | null, message = "Data not found"): T {
    if (data === null) {
      throw new Error(message);
    }

    return data;
  }

  /**
   * Check if collection is empty
   */
  protected isEmpty<T>(data: T[] | null | undefined): boolean {
    return !data || data.length === 0;
  }

  /**
   * Simple logger (development only)
   */
  protected log(message: string): void {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Repository] ${message}`);
    }
  }
}