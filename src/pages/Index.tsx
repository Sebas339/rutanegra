import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventsSection from "@/components/EventsSection";
import MotoDivider from "@/components/MotoDivider";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <MotoDivider />
      <EventsSection />
      <footer className="py-10 text-center text-muted-foreground text-xs border-t border-white/5 bg-black/40">
        <p className="font-heading uppercase tracking-widest text-primary/70">
          © {new Date().getFullYear()} Ruta Negra Manizales
        </p>
        <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">
          Montaña • Ruta • Asfalto • Noche
        </p>
      </footer>
    </main>
  );
};

export default Index;
