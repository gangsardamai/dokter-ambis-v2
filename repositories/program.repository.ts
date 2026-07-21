import { createClient } from "@/lib/supabase/server";

import type { Database } from "@/supabase/types/database.types";

type Program =
  Database["public"]["Tables"]["programs"]["Row"];

type ProgramInsert =
  Database["public"]["Tables"]["programs"]["Insert"];

type ProgramUpdate =
  Database["public"]["Tables"]["programs"]["Update"];

export class ProgramRepository {

  async getAll(): Promise<Program[]> {

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("programs")
      .select("*")
      .order("title");

    if (error) {

      throw error;

    }

    return data ?? [];

  }

  async getById(
    id: string
  ): Promise<Program | null> {

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("programs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {

      throw error;

    }

    return data;

  }

  async getBySlug(
    slug: string
  ): Promise<Program | null> {

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("programs")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {

      throw error;

    }

    return data;

  }

  async count(): Promise<number> {

    const supabase =
      await createClient();

    const {
      count,
      error,
    } = await supabase
      .from("programs")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {

      throw error;

    }

    return count ?? 0;

  }

  async create(
    data: ProgramInsert
  ): Promise<Program> {

    const supabase =
      await createClient();

    const {
      data: result,
      error,
    } = await supabase
      .from("programs")
      .insert(data)
      .select()
      .single();

    if (error) {

      throw error;

    }

    return result;

  }

  async update(
    id: string,
    data: ProgramUpdate
  ): Promise<Program> {

    const supabase =
      await createClient();

    const {
      data: result,
      error,
    } = await supabase
      .from("programs")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {

      throw error;

    }

    return result;

  }

  async delete(
    id: string
  ): Promise<void> {

    const supabase =
      await createClient();

    const {
      error,
    } = await supabase
      .from("programs")
      .delete()
      .eq("id", id);

    if (error) {

      throw error;

    }

  }

}

export const programRepository =
  new ProgramRepository();