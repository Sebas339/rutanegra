import { memo } from "react";
import { CalendarDays, MapPin, Users, Clock, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AttendanceDialog from "./AttendanceDialog";
import { type EventData } from "@/lib/events-store";
import { formatTime12, formatTimeOffset } from "@/lib/format-time";
import { isEventPast } from "@/lib/event-status";

export type { EventData };

const EventCard = ({
  event,
  index,
  onUpdate,
}: {
  event: EventData;
  index: number;
  onUpdate: () => void;
}) => {
  const past = isEventPast(event.date);
  const cancelled = event.cancelled && !past;

  return (
    <div
      className="animate-fade-in h-full"
      style={{
        animationDelay: `${Math.min(index, 6) * 100}ms`,
        animationFillMode: "both",
      }}
    >
      <Card
        className={`glassmorphism transition-all duration-300 group h-full flex flex-col relative overflow-hidden ${
          past || cancelled
            ? "opacity-60 saturate-50"
            : "hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
        }`}
      >
        {/* Glowing Top Bar on Hover */}
        {!past && !cancelled && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="font-heading text-xl uppercase tracking-wider text-primary group-hover:text-accent transition-colors duration-300 leading-tight">
              {event.title}
            </CardTitle>
            {past ? (
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground shrink-0 uppercase tracking-widest text-[10px]">
                Finalizado
              </Badge>
            ) : cancelled ? (
              <Badge variant="destructive" className="shrink-0 uppercase tracking-widest text-[10px] bg-red-600/80">
                Cancelado
              </Badge>
            ) : (
              <Badge className="shrink-0 uppercase tracking-widest text-[10px] bg-primary/20 text-primary border border-primary/30 animate-pulse">
                Activa
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col pt-0">
          <p className="text-muted-foreground text-sm flex-1 leading-relaxed">
            {event.description}
          </p>

          <hr className="border-white/5" />

          <div className="grid grid-cols-1 gap-2.5 text-sm text-muted-foreground/90 font-medium">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-white/5 text-accent shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="truncate">{event.date}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-white/5 text-accent shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="truncate">Encuentro: {formatTime12(event.meetingTime)}</span>
            </div>

            <div className="flex items-center gap-2.5 text-primary">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="truncate font-semibold">
                Salida: {formatTimeOffset(event.meetingTime, 30)} (30m después)
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-white/5 text-accent shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <span className="truncate">Punto: {event.meetingPoint || "Por definir"}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-white/5 text-accent shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="truncate">{event.location}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-white/5 text-accent shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="truncate font-semibold text-foreground/95">
                {event.attendees.length} asistentes confirmados
              </span>
            </div>
          </div>

          <div className="pt-2 mt-auto">
            {past ? (
              <p className="text-xs text-muted-foreground/50 italic text-center">
                Esta ruta ya finalizó
              </p>
            ) : cancelled ? (
              <p className="text-xs text-red-400/60 italic text-center">
                Esta ruta fue cancelada
              </p>
            ) : (
              <AttendanceDialog event={event} onUpdate={onUpdate} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(EventCard);
