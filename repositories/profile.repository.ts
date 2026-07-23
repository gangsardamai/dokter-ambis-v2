import { createClient } from "@/lib/supabase/server";

import type { Database } from "@/supabase/types/database.types";

export type Profile =
  Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileInsert =
  Database["public"]["Tables"]["profiles"]["Insert"];

export type ProfileUpdate =
  Database["public"]["Tables"]["profiles"]["Update"];

export type ProfileRole =
  Database["public"]["Enums"]["profile_role"];

export class ProfileRepository {

  async getCurrentProfile(): Promise<Profile | null> {

    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (!user) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;

  }

  async getById(
    id: string
  ): Promise<Profile | null> {

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;

  }

  async countByRole(
    role: ProfileRole
  ): Promise<number> {

    const supabase =
      await createClient();

    const { count, error } = await supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("role", role);

    if (error) {
      throw error;
    }

    return count ?? 0;

  }

  async create(
    profile: ProfileInsert
  ): Promise<Profile> {

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;

  }

  async update(
    id: string,
    profile: ProfileUpdate
  ): Promise<Profile> {

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;

  }

}

export const profileRepository =
  new ProfileRepository();