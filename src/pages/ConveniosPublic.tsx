import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Handshake, MapPin, Phone, User } from "lucide-react";
import logoAsset from "@/assets/ruta-negra-logo.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Convenio {
  id: string;
  companyName: string;
  address: string;
  city: string | null;
  phone: string;
  contactName: string;
  logo: string | null;
}

const fetchConvenios = async (): Promise<Convenio[]> => {
  const res = await fetch("/.netlify/functions/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: "convenios", method: "GET" }),
  });
  const data = await res.json().catch(() => ({}));
  return (data.convenios || []) as Convenio[];
};

const Card = ({ c }: { c: Convenio }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    className="glassmorphism rounded-2xl p-4 flex flex-col gap-3"
  >
    <div className="w-full flex items-center justify-center py-2">
      {c.logo
        ? <img src={c.logo} alt={c.companyName} className="max-w-[80%] max-h-40 object-contain" />
        : <Handshake className="w-12 h-12 text-muted-foreground" />}
    </div>
    <p className="font-heading uppercase tracking-wider text-foreground text-lg leading-tight text-center">
      {c.companyName}
    </p>
    <div className="text-sm text-muted-foreground space-y-2.5">
      <p className="flex items-start gap-2"><User className="w-4 h-4 text-accent shrink-0 mt-0.5" /> <span>{c.contactName}</span></p>
      <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" /> <span>{c.address}</span></p>
      {c.city && (
        <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" /> <span>{c.city}</span></p>
      )}
      <p className="flex items-start gap-2"><Phone className="w-4 h-4 text-accent shrink-0 mt-0.5" /> <span>{c.phone}</span></p>
    </div>
  </motion.div>
);

const ConveniosPage = () => {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todas");

  useEffect(() => {
    fetchConvenios()
      .then(setConvenios)
      .catch((e) => console.error("Error cargando convenios:", e))
      .finally(() => setLoading(false));
  }, []);

  // Ciudades disponibles (únicas, sin null)
  const cities = useMemo(() => {
    const set = new Set<string>();
    convenios.forEach((c) => { if (c.city) set.add(c.city); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [convenios]);

  // Agrupar por ciudad según el filtro seleccionado
  const groups = useMemo(() => {
    const list = filter === "todas" ? convenios : convenios.filter((c) => c.city === filter);
    const byCity = new Map<string, Convenio[]>();
    list.forEach((c) => {
      const key = c.city || "Sin ciudad";
      if (!byCity.has(key)) byCity.set(key, []);
      byCity.get(key)!.push(c);
    });
    return Array.from(byCity.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [convenios, filter]);

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <img src={logoAsset} alt="Ruta Negra" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-primary">Convenios</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
              Empresas aliadas de Ruta Negra Manizales
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-10">Cargando convenios...</p>
        ) : convenios.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No hay convenios registrados.</p>
        ) : (
          <>
            {/* Filtro por ciudad */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              <button
                onClick={() => setFilter("todas")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${filter === "todas" ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-primary border border-white/10"}`}
              >
                Todas
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setFilter(city)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${filter === city ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-primary border border-white/10"}`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Agrupado por ciudad */}
            <div className="space-y-10">
              {groups.map(([city, items]) => (
                <section key={city}>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-accent" />
                    <h2 className="font-heading uppercase tracking-wider text-foreground text-lg">{city}</h2>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((c) => <Card key={c.id} c={c} />)}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default ConveniosPage;
