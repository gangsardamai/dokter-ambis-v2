import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import Universities from "@/components/home/Universities";
import Programs from "@/components/home/Programs";
import Mentors from "@/components/home/Mentors";
import Footer from "@/components/layout/Footer";

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