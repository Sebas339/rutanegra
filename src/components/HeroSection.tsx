import logoAsset from "@/assets/ruta-negra-logo.png";
import { ChevronDown, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center py-20 px-4 overflow-hidden bg-background">
      {/* Decorative Road/Grid Background Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Decorative Ambient Orange Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full bg-primary/10 blur-[80px] -z-10" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto animate-fade-in mt-12">
        
        {/* Premium Mini Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-widest mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Club Motociclista Oficial
        </div>

        {/* Glowing Logo */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-full bg-primary/25 blur-md group-hover:bg-primary/45 transition duration-500" />
          <img
            src={logoAsset}
            alt="Ruta Negra Manizales"
            width={340}
            height={340}
            fetchPriority="high"
            decoding="async"
            className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 drop-shadow-[0_0_35px_rgba(168,85,247,0.25)] object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <h1 className="font-heading text-4xl sm:text-6xl md:text-8xl uppercase tracking-widest text-primary mt-6 select-none leading-none">
          Ruta Negra
        </h1>
        
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl mx-auto mt-4 font-medium uppercase tracking-[0.25em]">
          Montaña <span className="text-primary">•</span> Ruta <span className="text-primary">•</span> Asfalto <span className="text-primary">•</span> Noche
        </p>

        <p className="text-muted-foreground/60 text-xs sm:text-sm font-semibold tracking-widest uppercase mt-2">
          Manizales, Colombia
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <a
            href="#rutas"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-bold tracking-widest uppercase text-xs hover:bg-accent transition-all duration-300 shadow-lg glow-primary hover:scale-[1.02]"
          >
            Explorar Rutas
          </a>
        </div>
      </div>

      {/* Down arrow link indicator */}
      <a
        href="#rutas"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/50 hover:text-primary transition-colors duration-300 animate-bounce hidden sm:block"
      >
        <ChevronDown className="w-8 h-8" />
      </a>
    </section>
  );
};

export default HeroSection;
