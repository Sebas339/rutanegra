import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, TrendingUp, Phone, ArrowLeft, Users, CalendarCheck, PieChart } from "lucide-react";
import { fetchEvents, type EventData } from "@/lib/events-store";
import { isEventPast } from "@/lib/event-status";
import logoAsset from "@//assets/ruta-negra-logo.png";
import Navbar from "@/components/Navbar";

const Stats = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventData[]>([]);

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Statistics: attendance by phone (who goes to the most meetings)
  const phoneMap: Record<string, { name: string; phone: string; count: number; routes: string[] }> = {};
  events.forEach((event) => {
    event.attendees.forEach((a) => {
      const phone = (a.phone || "").trim();
      const key = phone || a.name; // fallback to name if no phone
      if (!phoneMap[key]) {
        phoneMap[key] = { name: a.name, phone, count: 0, routes: [] };
      }
      phoneMap[key].count += 1;
      phoneMap[key].routes.push(event.title);
    });
  });
  const statsByPhone = Object.values(phoneMap).sort((a, b) => b.count - a.count);
  const uniqueAssistants = Object.keys(phoneMap).length;
  const totalAttendees = events.reduce((sum, e) => sum + e.attendees.length, 0);
  const eventsWithData = events.filter((e) => e.attendees.length > 0).length;

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-12">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <img src={logoAsset} alt="Ruta Negra Manizales" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-primary">
                Estadísticas
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                Asistencia por Usuario
              </p>
            </div>
          </div>

          <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al Panel
          </Link>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-20 font-medium">Cargando estadísticas...</p>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glassmorphism p-5 rounded-xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Asistencias</span>
                <span className="text-3xl font-heading text-accent mt-2">{totalAttendees}</span>
              </div>
              <div className="glassmorphism p-5 rounded-xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Asistentes Únicos</span>
                <span className="text-3xl font-heading text-primary mt-2">{uniqueAssistants}</span>
              </div>
              <div className="glassmorphism p-5 rounded-xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Rutas con Datos</span>
                <span className="text-3xl font-heading text-green-400 mt-2">{eventsWithData}</span>
              </div>
              <div className="glassmorphism p-5 rounded-xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Rutas Totales</span>
                <span className="text-3xl font-heading text-foreground mt-2">{events.length}</span>
              </div>
            </div>

            {/* Ranking Section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glassmorphism p-6 rounded-2xl shadow-xl"
            >
              <h2 className="font-heading text-xl uppercase tracking-widest text-primary border-b border-white/5 pb-3 mb-5 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Ranking: quién asiste a más reuniones
              </h2>

              {statsByPhone.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10 font-medium">
                  Aún no hay asistentes registrados para generar estadísticas.
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {statsByPhone.map((s, i) => {
                    const max = statsByPhone[0].count || 1;
                    const pct = Math.round((s.count / max) * 100);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate leading-tight">
                            {s.name}
                          </p>
                          {s.phone && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {s.phone}
                            </p>
                          )}
                          {/* progress bar */}
                          <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-accent/80 font-medium mt-1 truncate">
                            {s.routes.slice(0, 3).join(" • ")}{s.routes.length > 3 ? ` • +${s.routes.length - 3} más` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-lg font-heading text-primary">{s.count}</span>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">rutas</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </main>
  );
};

export default Stats;
