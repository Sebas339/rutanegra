import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import EventsSection from "@/components/EventsSection";
import MotoDivider from "@/components/MotoDivider";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <HeroSection />
      <MotoDivider />
      <EventsSection />
      <Footer />
    </main>
  );
};

export default Index;
