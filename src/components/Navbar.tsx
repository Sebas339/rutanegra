import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert, Menu, X, LogIn, Users as UsersIcon, BarChart3, Handshake, LogOut } from "lucide-react";
import logoAsset from "@/assets/ruta-negra-logo.png";
import { logout } from "@/lib/auth";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminZone = location.pathname.startsWith("/admin");
  const isHome = location.pathname === "/";
  const isConveniosPage = location.pathname === "/convenios";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar el drawer al cambiar de ruta
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const linkBase =
    "text-sm font-medium tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1.5";

  // En home y página de convenios: navegación pública (cambia según la página)
  const showPublicNav = !isAdminZone && (isHome || isConveniosPage);

  // Enlaces del drawer móvil
  const publicLinks = isConveniosPage
    ? [{ to: "/", label: "Inicio", icon: null }, { to: "/login", label: "Acceso", icon: LogIn }]
    : [{ to: "/convenios", label: "Convenios", icon: Handshake }, { to: "/login", label: "Acceso", icon: LogIn }];

  const adminLinks = [
    { to: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
    { to: "/admin/usuarios", label: "Usuarios", icon: UsersIcon },
    { to: "/admin/convenios", label: "Convenios", icon: Handshake },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3 glassmorphism shadow-lg shadow-black/20" : "py-4 bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <img
            src={logoAsset}
            alt="Ruta Negra Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform duration-300 shrink-0"
          />
          <span className="font-heading text-base sm:text-xl uppercase tracking-widest text-foreground group-hover:text-primary transition-colors duration-300 truncate">
            Ruta Negra <span className="text-primary font-bold">Manizales</span>
          </span>
        </Link>

        {/* Desktop Menu (md+) */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {isAdminZone ? (
            <>
              <Link to="/admin/estadisticas" className={linkBase}><BarChart3 className="w-4 h-4" /> Estadísticas</Link>
              <Link to="/admin/usuarios" className={linkBase}><UsersIcon className="w-4 h-4" /> Usuarios</Link>
              <Link to="/admin/convenios" className={linkBase}><Handshake className="w-4 h-4" /> Convenios</Link>
              <button onClick={() => setShowLogoutConfirm(true)} className={`${linkBase} hover:text-destructive`}>
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </>
          ) : showPublicNav ? (
            isConveniosPage ? (
              <>
                <Link to="/" className={linkBase}>Inicio</Link>
                <Link to="/login" className={linkBase}><LogIn className="w-4 h-4" /> Acceso</Link>
              </>
            ) : (
              <>
                <Link to="/convenios" className={linkBase}>Convenios</Link>
                <Link to="/login" className={linkBase}><LogIn className="w-4 h-4" /> Acceso</Link>
              </>
            )
          ) : (
            <Link to="/login" className={linkBase}><LogIn className="w-4 h-4" /> Acceso</Link>
          )}
        </div>

        {/* Mobile: hamburguesa (siempre visible en móvil) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-foreground hover:text-primary transition-colors focus:outline-none shrink-0"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Drawer móvil (md-) */}
      {mobileMenuOpen && (
        <div className="md:hidden glassmorphism border-t border-white/5 animate-fade-in absolute top-full left-0 right-0 py-4 px-6 flex flex-col gap-1 shadow-xl max-h-[80vh] overflow-y-auto">
          {isAdminZone ? (
            <>
              {adminLinks.map((l) => {
                const Icon = l.icon;
                return (
                  <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold tracking-wider uppercase text-muted-foreground hover:text-primary py-3 transition-colors duration-200 flex items-center gap-2 border-b border-white/5">
                    <Icon className="w-4 h-4" /> {l.label}
                  </Link>
                );
              })}
              <button onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true); }}
                className="text-sm font-semibold tracking-wider uppercase text-destructive hover:text-destructive/80 py-3 transition-colors duration-200 flex items-center gap-2 text-left">
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </>
          ) : (
            <>
              {publicLinks.map((l) => {
                const Icon = l.icon;
                return (
                  <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold tracking-wider uppercase text-muted-foreground hover:text-primary py-3 transition-colors duration-200 flex items-center gap-2 border-b border-white/5">
                    {Icon && <Icon className="w-4 h-4" />} {l.label}
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Confirmación de cerrar sesión */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glassmorphism rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="font-heading uppercase tracking-widest text-primary text-lg">Cerrar sesión</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Estás seguro de que quieres cerrar la sesión? Tendrás que volver a iniciar sesión para entrar al panel.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="text-xs text-muted-foreground px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold uppercase tracking-wider text-white bg-destructive hover:bg-destructive/90 px-4 py-2 rounded-lg transition-colors"
              >
                Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
