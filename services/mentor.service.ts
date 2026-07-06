import { Mentor } from "@/types";
import { mentorRepository } from "@/repositories";

export class MentorService {

  getMentors(): Mentor[] {
    return mentorRepository.findAll();
  }

  getMentorById(
    id: string
  ): Mentor | undefined {
    return mentorRepository.findById(id);
  }

}

export const mentorService =
  new MentorService();