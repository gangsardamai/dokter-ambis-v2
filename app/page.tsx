import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import Universities from "@/components/home/Universities";
import Mentors from "@/components/home/Mentors";
import Footer from "@/components/layout/Footer";

import { organizationService } from "@/services";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [activeOrganizations, activeUniversities] =
    await Promise.all([
      organizationService.getActiveOrganizations(),
      organizationService.getActiveUniversities(),
    ]);

  const generalOrganization = activeOrganizations.find(
    (organization) => organization.is_general,
  );
  const featuredUniversities = activeOrganizations
    .filter((organization) => !organization.is_general)
    .sort((a, b) => a.title.localeCompare(b.title, "id-ID"))
    .slice(0, generalOrganization ? 3 : 4);
  const featuredOrganizations = generalOrganization
    ? [generalOrganization, ...featuredUniversities]
    : featuredUniversities;

  return (
    <>
      <Navbar />
      <Hero />

      <Stats
        organizationCount={activeUniversities.length}
      />

      <Universities
        organizations={featuredOrganizations}
      />

      <Mentors />
      <Footer />
    </>
  );
}
