import { programRepository } from "@/repositories";

export class ProgramService {

  async getPrograms() {
    return await programRepository.getAll();
  }

  async getProgramById(id: string) {
    return await programRepository.getById(id);
  }

  async getActivePrograms() {
    return await programRepository.getActive();
  }

  async countPrograms() {
    return await programRepository.count();
  }

}

export const programService =
  new ProgramService();