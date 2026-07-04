import { programs } from "@/lib/data/programs";
import { Program } from "@/types";

export const programRepository = {
  findAll(): Program[] {
    return programs;
  },

  findById(id: string): Program | undefined {
    return programs.find((program) => program.id === id);
  },

  findActive(): Program[] {
    return programs.filter(
      (program) => program.status === "active"
    );
  },

  create(data: Program): Program {
    return data;
  },

  update(data: Program): Program {
    return data;
  },

  remove(id: string): boolean {
    return true;
  },
};