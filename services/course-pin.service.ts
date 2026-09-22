import { coursePinRepository } from "@/repositories";

export class CoursePinService {
  async getPinnedCourseIds(profileId: string): Promise<string[]> {
    const pins = await coursePinRepository.getPinsForProfile(profileId);
    return pins.map((pin) => pin.course_id);
  }

  async pinCourse(profileId: string, courseId: string): Promise<void> {
    await coursePinRepository.pin(profileId, courseId);
  }

  async unpinCourse(profileId: string, courseId: string): Promise<void> {
    await coursePinRepository.unpin(profileId, courseId);
  }
}

export const coursePinService = new CoursePinService();
