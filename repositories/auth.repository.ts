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
}

export class AuthRepository {

  async signUp(
    data: RegisterData
  ): Promise<AuthResponse> {

    const supabase =
      await createClient();

    return await supabase.auth.signUp({

      email: data.email,

      password: data.password,

      options: {

        data: {

          full_name: data.fullName,

          phone: data.phone,

        },

      },

    });

  }

  async signIn(
    email: string,
    password: string
  ): Promise<AuthResponse> {

    const supabase =
      await createClient();

    return await supabase.auth.signInWithPassword({

      email,

      password,

    });

  }

  async signOut(): Promise<void> {

    const supabase =
      await createClient();

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

  }

  async getUser(): Promise<User | null> {

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase.auth.getUser();

    if (error) {

      if (error.name === "AuthSessionMissingError") {
        return null;
      }

      throw error;

    }

    return data.user;

  }

  async getSession(): Promise<Session | null> {

    const supabase =
      await createClient();

    const {
      data,
      error,
    } = await supabase.auth.getSession();

    if (error) {

      if (error.name === "AuthSessionMissingError") {
        return null;
      }

      throw error;

    }

    return data.session;

  }

}

export const authRepository =
  new AuthRepository();