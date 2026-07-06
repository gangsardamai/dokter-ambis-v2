import type { Database } from "@/supabase/types/database.types";
import { BaseRepository } from "./base.repository";

type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];

type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export class OrganizationRepository extends BaseRepository {

  async getAll(): Promise<Organization[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("status", "active")
      .order("title");

    if (error) this.handleError(error);

    return data ?? [];
  }

  async getById(id: string): Promise<Organization | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async getBySlug(slug: string): Promise<Organization | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async exists(id: string): Promise<boolean> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("organizations")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("id", id);

    if (error) this.handleError(error);

    return (count ?? 0) > 0;
  }
}

export const organizationRepository = new OrganizationRepository();