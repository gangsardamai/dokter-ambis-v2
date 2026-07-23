import { authRepository } from "@/repositories";

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
  nextPath?: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    return await authRepository.signUp(data);
  }

  async login(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    return await authRepository.signIn(email, password);
  }

  async logout(): Promise<void> {
    await authRepository.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    return await authRepository.getUser();
  }

  async getCurrentSession(): Promise<Session | null> {
    return await authRepository.getSession();
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

export const authService = new AuthService();
