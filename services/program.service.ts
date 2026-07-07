import { programRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type ProgramInsert =
  Database["public"]["Tables"]["programs"]["Insert"];

type ProgramUpdate =
  Database["public"]["Tables"]["programs"]["Update"];

export class ProgramService {

  /* ========================================
     READ
  ======================================== */

  async getPrograms() {
    return await programRepository.getAll();
  }

  async getProgramById(
    id: string
  ) {
    return await programRepository.getById(id);
  }

  async countPrograms() {
    return await programRepository.count();
  }

  /* ========================================
     CREATE
  ======================================== */

  async createProgram(
    data: ProgramInsert
  ) {
    return await programRepository.create(
      data
    );
  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateProgram(
    id: string,
    data: ProgramUpdate
  ) {
    return await programRepository.update(
      id,
      data
    );
  }

  /* ========================================
     ACTIVATE
  ======================================== */

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

  /* ========================================
     DEACTIVATE
  ======================================== */

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

  /* ========================================
     DELETE
  ======================================== */

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