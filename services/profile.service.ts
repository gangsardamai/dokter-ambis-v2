import { profileRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type ProfileRole =
  Database["public"]["Enums"]["profile_role"];

export class ProfileService {

  async getCurrentProfile() {

    return await profileRepository.getCurrentProfile();

  }

  async getProfileById(
    id: string
  ) {

    return await profileRepository.getById(
      id
    );

  }

  async countProfilesByRole(
    role: ProfileRole
  ) {

    return await profileRepository.countByRole(
      role
    );

  }

  async createProfile(data: Parameters<typeof profileRepository.create>[0]) {

    return await profileRepository.create(
      data
    );

  }

  async updateProfile(
    id: string,
    data: Parameters<typeof profileRepository.update>[1]
  ) {

    return await profileRepository.update(
      id,
      data
    );

  }

}

export const profileService =
  new ProfileService();