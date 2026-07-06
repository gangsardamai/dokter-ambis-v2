import type { Database } from "@/supabase/types/database.types";
import { BaseRepository } from "./base.repository";

type Program = Database["public"]["Tables"]["programs"]["Row"];
type ProgramInsert = Database["public"]["Tables"]["programs"]["Insert"];
type ProgramUpdate = Database["public"]["Tables"]["programs"]["Update"];

export class ProgramRepository extends BaseRepository {

  async getAll(): Promise<Program[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .order("title");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getById(id: string): Promise<Program | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async getActive(): Promise<Program[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("status", "active")
      .order("title");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async exists(id: string): Promise<boolean> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("programs")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("id", id);

    if (error) this.handleError(error);

    return (count ?? 0) > 0;
  }

  async count(): Promise<number> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("programs")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) this.handleError(error);

    return count ?? 0;
  }

  async create(data: ProgramInsert): Promise<Program> {
    const supabase = await this.db();

    const { data: created, error } = await supabase
      .from("programs")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);

    return created;
  }

  async update(
    id: string,
    data: ProgramUpdate
  ): Promise<Program> {

    const supabase = await this.db();

    const { data: updated, error } = await supabase
      .from("programs")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.db();

    const { error } = await supabase
      .from("programs")
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);
  }
}

export const programRepository =
  new ProgramRepository();