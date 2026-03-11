import React, { useEffect, useState } from "react";
import LandingNavbar from "./Sections/LandingNavbar.jsx";
import Hero from "./Sections/Hero.jsx";
import Stats from "./Sections/Stats.jsx";
import Services from "./Sections/Services.jsx";
import Sustainability from "./Sections/Sustainability.jsx";
import NewsSection from "./Sections/NewsSection.jsx";
import Footer from "./Sections/Footer.jsx";

function Homepage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Tracks whether the navbar should switch to its scrolled styling state.
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-orange-500 selection:text-white">
      <LandingNavbar scrolled={scrolled} />
      <main className="flex-grow">
        {/* Landing page sections are stacked here to keep the page order easy to scan. */}
        <Hero />
        <Stats />
        <Services />
        <Sustainability />
        <NewsSection />
      </main>

      <Footer />
      {/* Background glow layers add depth without interfering with page interactions. */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

export default Homepage;
