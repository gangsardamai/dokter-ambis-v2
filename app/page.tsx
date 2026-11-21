import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import FeaturedCourses from "@/components/home/FeaturedCourses";
import Mentors from "@/components/home/Mentors";
import Footer from "@/components/layout/Footer";

import { defaultMentors } from "@/lib/landing-page";
import { organizationService } from "@/services";
import {
  getFeaturedCourseIds,
  getLandingPageSettings,
  getPublicLandingCourses,
} from "@/services/landing-page.service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [activeUniversities, courses, settings] = await Promise.all([
    organizationService.getActiveUniversities(),
    getPublicLandingCourses(),
    getLandingPageSettings().catch((error) => {
      console.error(error);
      return null;
    }),
  ]);
  const coursesById = new Map(courses.map((course) => [course.id, course]));
  const featuredCourses = getFeaturedCourseIds(courses, settings?.course_ids ?? null)
    .flatMap((id) => {
      const course = coursesById.get(id);
      return course ? [course] : [];
    });

  return (
    <>
      <Navbar />
      <Hero />
      <Stats organizationCount={activeUniversities.length} />
      <FeaturedCourses courses={featuredCourses} />
      <Mentors mentors={settings?.mentors ?? defaultMentors} />
      <Footer />
    </>
  );
}
