import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings, ShieldAlert, Menu, X } from "lucide-react";
import logoAsset from "@/assets/ruta-negra-logo.png";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname === "/admin";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "py-3 glassmorphism shadow-lg shadow-black/20"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logoAsset}
            alt="Ruta Negra Logo"
            className="w-9 h-9 object-contain group-hover:scale-105 transition-transform duration-300"
          />
          <span className="font-heading text-xl uppercase tracking-widest text-foreground group-hover:text-primary transition-colors duration-300">
            Ruta Negra <span className="text-primary font-bold">Manizales</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/#rutas"
            className="text-sm font-medium tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            Rutas
          </a>
          {isAdmin && (
            <Link
              to="/"
              className="text-sm font-medium tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Ver Web
            </Link>
          )}
        </div>

        {/* Mobile Menu Button - Show only if on admin page, or hide menu trigger entirely on home if there's only one link */}
        {isAdmin && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground hover:text-primary transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && isAdmin && (
        <div className="md:hidden glassmorphism border-t border-white/5 animate-fade-in absolute top-full left-0 right-0 py-4 px-6 flex flex-col gap-4 shadow-xl">
          <a
            href="/#rutas"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold tracking-wider uppercase text-muted-foreground hover:text-primary py-2 transition-colors duration-200"
          >
            Rutas
          </a>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold tracking-wider uppercase text-muted-foreground hover:text-primary py-2 transition-colors duration-200"
          >
            Ver Web
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
