import { Mentor } from "@/types";

export const mentorRepository = {
  findAll(): Mentor[] {
    return [];
  },

  findById(id: string): Mentor | undefined {
    return undefined;
  },

  create(data: Mentor): Mentor {
    return data;
  },

  update(data: Mentor): Mentor {
    return data;
  },

  remove(id: string): boolean {
    return true;
  },
};