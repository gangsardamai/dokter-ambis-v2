import {
  programRepository,
} from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type ProgramInsert =
  Database["public"]["Tables"]["programs"]["Insert"];

type ProgramUpdate =
  Database["public"]["Tables"]["programs"]["Update"];

export class ProgramService {

  async getPrograms() {

    return await programRepository.getAll();

  }

  async getProgramById(
    id: string
  ) {

    return await programRepository.getById(
      id
    );

  }

  async getProgramBySlug(
    slug: string
  ) {

    return await programRepository.getBySlug(
      slug
    );

  }

  async countPrograms() {

    return await programRepository.count();

  }

  async createProgram(
    data: ProgramInsert
  ) {

    return await programRepository.create(
      data
    );

  }

  async updateProgram(
    id: string,
    data: ProgramUpdate
  ) {

    return await programRepository.update(
      id,
      data
    );

  }

  async activateProgram(
    id: string
  ) {

    return await programRepository.update(
      id,
      {
        status: "active",
      }
    );

  }

  async deactivateProgram(
    id: string
  ) {

    return await programRepository.update(
      id,
      {
        status: "inactive",
      }
    );

  }

  async deleteProgram(
    id: string
  ) {

    return await programRepository.delete(
      id
    );

  }

}

export const programService =
  new ProgramService();