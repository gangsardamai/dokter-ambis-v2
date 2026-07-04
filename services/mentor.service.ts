import { Mentor } from "@/types";

import { mentorRepository } from "@/lib/repositories/mentor.repository";

export const mentorService = {
  getMentors(): Mentor[] {
    return mentorRepository.findAll();
  },

  getMentorById(
    id: string
  ): Mentor | undefined {
    return mentorRepository.findById(id);
  },
};