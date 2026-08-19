import { Instagram, Music2, MapPin, Phone } from "lucide-react";

// Iconos SVG inline (lucide-react de esta versión no trae Instagram/TikTok)
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16.5 3c.3 2.2 1.7 3.9 3.8 4.2v2.7c-1.4-.1-2.7-.5-3.8-1.2v5.8c0 3.2-2.4 5.5-5.6 5.5-3 0-5.4-2.2-5.4-4.9 0-2.9 2.4-5 5.3-5 .3 0 .7 0 1 .1v2.8c-.3-.1-.7-.2-1-.2-1.4 0-2.4 1.1-2.4 2.5 0 1.4 1.1 2.5 2.5 2.5 1.5 0 2.6-1.1 2.6-2.9V3h2.9z" />
  </svg>
);

const SOCIALS = [
  { name: "Instagram", href: "https://www.instagram.com/rutanegramanizales/", Icon: InstagramIcon },
  { name: "TikTok", href: "https://www.tiktok.com/@rutanegramanizales", Icon: TikTokIcon },
];

const Footer = () => {
  return (
    <footer className="mt-auto">
      {/* Redes sociales: sección sutil, fondo distinto al footer original */}
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-6">
          {SOCIALS.map((s) => {
            const Icon = s.Icon;
            return (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </div>
      </div>

      {/* Footer original */}
      <div className="py-10 text-center text-muted-foreground text-xs border-t border-white/5 bg-black/40">
        <p className="font-heading uppercase tracking-widest text-primary/70">
          © {new Date().getFullYear()} Ruta Negra Manizales
        </p>
        <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">
          Montaña • Ruta • Asfalto • Noche
        </p>
      </div>
    </footer>
  );
};

export default Footer;
