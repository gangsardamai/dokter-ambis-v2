import { maxFeaturedCourses, mentorPhotoBucket } from "@/lib/landing-page";
import { createClient } from "@/lib/supabase/server";
import { courseService } from "./course.service";

export async function getLandingPageSettings() {
  const client = await createClient();
  const { data, error } = await client.from("landing_page_settings").select("*").eq("id", 1).single();
  if (error) throw new Error("Pengaturan landing page tidak dapat dimuat.", { cause: error });
  return data;
}

export async function getPublicLandingCourses() {
  const courses = await courseService.getAvailableCourseDetails();
  return courses.filter(
    (course) => course.organization?.status === "active" && course.program?.status === "active",
  );
}

export function getFeaturedCourseIds(
  courses: Awaited<ReturnType<typeof getPublicLandingCourses>>,
  savedIds: string[] | null,
) {
  if (savedIds) return savedIds;
  return [...courses]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, maxFeaturedCourses)
    .map((course) => course.id);
}

export function mentorPhotoUrl(image: string) {
  if (!image || image.startsWith("/")) return image;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${projectUrl}/storage/v1/object/public/${mentorPhotoBucket}/${encodeURIComponent(image)}`;
}
