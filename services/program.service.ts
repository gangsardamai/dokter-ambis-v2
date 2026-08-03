import { createUniqueSlug } from "@/lib/slug";
import { programRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type ProgramInsert =
  Database["public"]["Tables"]["programs"]["Insert"];

type ProgramUpdate =
  Database["public"]["Tables"]["programs"]["Update"];

export class ProgramService {
  async getPrograms() {
    return await programRepository.getAll();
  }

  async getProgramsByOrganization(organizationId: string) {
    return await programRepository.getByOrganization(organizationId);
  }

  async getProgramById(id: string) {
    return await programRepository.getById(id);
  }

  async getProgramBySlug(slug: string) {
    return await programRepository.getBySlug(slug);
  }

  async countPrograms() {
    return await programRepository.count();
  }

  async createProgram(data: ProgramInsert) {
    const slug = await createUniqueSlug(
      data.title,
      async (candidate) =>
        (await programRepository.getBySlug(candidate)) === null,
    );

    return await programRepository.create({
      ...data,
      slug,
    });
  }

  async updateProgram(id: string, data: ProgramUpdate) {
    const existing = await programRepository.getById(id);

    if (!existing) {
      throw new Error("Program tidak ditemukan.");
    }

    return await programRepository.update(id, {
      ...data,
      slug: existing.slug,
    });
  }

  async activateProgram(id: string) {
    return await programRepository.update(id, {
      status: "active",
    });
  }

  async deactivateProgram(id: string) {
    return await programRepository.update(id, {
      status: "inactive",
    });
  }

  async deleteProgram(id: string) {
    return await programRepository.delete(id);
  }
}

export const programService = new ProgramService();
