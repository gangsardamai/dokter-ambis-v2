import { Program } from "@/types";
import { programRepository } from "@/lib/repositories/program.repository";

export const programService = {
  getPrograms(): Program[] {
    return programRepository.findAll();
  },

  getActivePrograms(): Program[] {
    return programRepository.findActive();
  },

  getProgramById(
    id: string
  ): Program | undefined {
    return programRepository.findById(id);
  },
};