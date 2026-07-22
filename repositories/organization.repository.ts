import { BaseRepository } from "./base.repository";

import type { Database } from "@/supabase/types/database.types";

type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];

type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export class OrganizationRepository extends BaseRepository {
  /* ========================================
     READ ALL
  ======================================== */

  async getAll(): Promise<Organization[]> {
    const supabase = await this.db();

    const {
      data,
      error,
    } = await supabase
      .from("organizations")
      .select("*")
      .order("title");

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  /* ========================================
     READ ACTIVE
  ======================================== */

  async getActiveUniversities(): Promise<Organization[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("status", "active")
      .eq("is_general", false)
      .order("title");

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async getActive(): Promise<Organization[]> {
    const supabase = await this.db();

    const {
      data,
      error,
    } = await supabase
      .from("organizations")
      .select("*")
      .eq("status", "active")
      .order("title");

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  /* ========================================
     READ BY ID
  ======================================== */

  async getById(
    id: string
  ): Promise<Organization | null> {
    const supabase = await this.db();

    const {
      data,
      error,
    } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data;
  }

  /* ========================================
     READ BY SLUG
  ======================================== */

  async getBySlug(
    slug: string
  ): Promise<Organization | null> {
    const supabase = await this.db();

    const {
      data,
      error,
    } = await supabase
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data;
  }

  /* ========================================
     COUNT
  ======================================== */

  async countUniversities(): Promise<number> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .eq("is_general", false);

    if (error) {
      this.handleError(error);
    }

    return count ?? 0;
  }

  async count(): Promise<number> {
    const supabase = await this.db();

    const {
      count,
      error,
    } = await supabase
      .from("organizations")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {
      this.handleError(error);
    }

    return count ?? 0;
  }

  /* ========================================
     CREATE
  ======================================== */

  async create(
    organization: OrganizationInsert
  ): Promise<Organization> {
    const supabase = await this.db();

    const {
      data,
      error,
    } = await supabase
      .from("organizations")
      .insert(organization)
      .select()
      .single();

    if (error) {
      this.handleError(error);
    }

    return data!;
  }

  /* ========================================
     UPDATE
  ======================================== */

  async update(
    id: string,
    organization: OrganizationUpdate
  ): Promise<Organization> {
    const supabase = await this.db();

    const {
      data,
      error,
    } = await supabase
      .from("organizations")
      .update(organization)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.handleError(error);
    }

    return data!;
  }

  /* ========================================
     DELETE
  ======================================== */

  async delete(
    id: string
  ): Promise<void> {
    const supabase = await this.db();

    const {
      error,
    } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id);

    if (error) {
      this.handleError(error);
    }
  }
}

export const organizationRepository =
  new OrganizationRepository();