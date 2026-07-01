import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Universities from "@/components/Universities";
import Programs from "@/components/Programs";
import Mentors from "@/components/Mentors";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Universities />
      <Programs />
      <Mentors />
      <Footer />
    </>
  );
}