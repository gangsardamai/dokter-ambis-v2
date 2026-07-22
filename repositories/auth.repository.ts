import { createClient } from "@/lib/supabase/server";

import type {
  AuthResponse,
  Session,
  User,
} from "@supabase/supabase-js";

export interface RegisterData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  universityOrigin: string;
}

function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  const siteUrl =
    configuredUrl ||
    (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

  return siteUrl.replace(/\/+$/, "");
}

export class AuthRepository {
  async signUp(data: RegisterData): Promise<AuthResponse> {
    const supabase = await createClient();

    return await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/login?confirmed=true`,
        data: {
          full_name: data.fullName,
          phone: data.phone,
          university_origin: data.universityOrigin,
        },
      },
    });
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const supabase = await createClient();

    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signOut(): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async getUser(): Promise<User | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (error.name === "AuthSessionMissingError") {
        return null;
      }

      throw error;
    }

    return data.user;
  }

  async getSession(): Promise<Session | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      if (error.name === "AuthSessionMissingError") {
        return null;
      }

      throw error;
    }

    return data.session;
  }
}

export const authRepository = new AuthRepository();
