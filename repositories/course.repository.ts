import { courses } from "@/lib/data/courses";
import { Course } from "@/types";

export const courseRepository = {
  findAll(): Course[] {
    return courses;
  },

  findById(id: string): Course | undefined {
    return courses.find((course) => course.id === id);
  },

  findByOrganization(organizationId: string): Course[] {
    return courses.filter(
      (course) => course.organizationId === organizationId
    );
  },

  findByProgram(programId: string): Course[] {
    return courses.filter(
      (course) => course.programId === programId
    );
  },

  findActive(): Course[] {
    return courses.filter(
      (course) => course.status === "active"
    );
  },

  create(data: Course): Course {
    return data;
  },

  update(data: Course): Course {
    return data;
  },

  remove(id: string): boolean {
    return true;
  },
};