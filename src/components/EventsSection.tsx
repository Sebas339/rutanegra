import { useState, useEffect, useCallback, useMemo } from "react";
import EventCard from "./EventCard";
import { fetchEvents, type EventData } from "@/lib/events-store";
import { isEventPast } from "@/lib/event-status";

const EventsSection = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const { upcoming, past } = useMemo(() => {
    const upcoming: EventData[] = [];
    const past: EventData[] = [];
    for (const e of events) {
      (isEventPast(e.date) ? past : upcoming).push(e);
    }
    // Past: most recent first
    past.sort((a, b) => (a.date < b.date ? 1 : -1));
    return { upcoming, past };
  }, [events]);

  return (
    <section id="rutas" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl md:text-5xl uppercase tracking-wider text-center mb-12">
          Próximas <span className="text-primary">Rutas</span>
        </h2>
        {loading ? (
          <p className="text-center text-muted-foreground text-lg">Cargando rutas...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg">
            No hay rutas próximas. ¡Pronto habrá novedades!
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {upcoming.map((event, i) => (
              <div key={event.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-md">
                <EventCard event={event} index={i} onUpdate={refresh} />
              </div>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-20">
            <h2 className="font-heading text-2xl md:text-4xl uppercase tracking-wider text-center mb-10">
              Rutas <span className="text-muted-foreground">Pasadas</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              {past.map((event, i) => (
                <div key={event.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-md">
                  <EventCard event={event} index={i} onUpdate={refresh} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;
