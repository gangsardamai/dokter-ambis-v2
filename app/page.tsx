import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import Universities from "@/components/home/Universities";
import Mentors from "@/components/home/Mentors";
import Footer from "@/components/layout/Footer";

import { organizationService } from "@/services";

export const dynamic = "force-dynamic";

export default async function Home() {
  const organizations =
    await organizationService.getActiveUniversities();

  return (
    <>
      <Navbar />
      <Hero />

      <Stats
        organizationCount={organizations.length}
      />

      <Universities
        organizations={organizations}
      />

     
      <Mentors />
      <Footer />
    </>
  );
}