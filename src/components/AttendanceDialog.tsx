import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { addAttendee, type EventData } from "@/lib/events-store";
import { UserCheck, Users, ShieldAlert, Award } from "lucide-react";

const AttendanceDialog = ({ event, onUpdate }: { event: EventData; onUpdate: () => void }) => {
  const [name, setName] = useState("");
  const [otherClub, setOtherClub] = useState(false);
  const [clubName, setClubName] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const trimmedClub = clubName.trim();
    if (otherClub && !trimmedClub) return;

    const finalName = otherClub && trimmedClub ? `${trimmed} (${trimmedClub})` : trimmed;

    setSubmitting(true);
    try {
      const success = await addAttendee(event.id, finalName);
      if (success) {
        toast({ title: "¡Asistencia confirmada!", description: `${finalName}, te esperamos en la ruta.` });
        setName("");
        setClubName("");
        setOtherClub(false);
        setOpen(false);
        onUpdate();
      } else {
        toast({ title: "Ya estás registrado", description: "Tu nombre ya aparece en la lista de asistencia.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo registrar la asistencia. Verifica tu base de datos.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm" className="w-full gap-2 px-6 py-2.5 rounded-full bg-primary hover:bg-accent text-primary-foreground font-bold tracking-widest text-xs uppercase transition-all duration-300 shadow-md glow-primary">
          <UserCheck className="w-4 h-4" />
          Marcar Asistencia
        </Button>
      </DialogTrigger>
      <DialogContent className="glassmorphism border-white/5 flex flex-col max-h-[calc(100dvh-4rem)] p-0 shadow-2xl shadow-black/80 max-w-md">
        <DialogHeader className="p-6 pb-3 shrink-0 border-b border-white/5">
          <DialogTitle className="font-heading text-2xl uppercase tracking-widest text-primary pr-8">
            {event.title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Registro de Asistencia
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tu nombre completo
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Escribe tu nombre"
                className="bg-muted border-white/5 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 rounded-lg h-11"
                maxLength={100}
              />
            </div>
            
            <div className="flex items-center gap-2.5 py-1">
              <Checkbox
                id="other-club"
                checked={otherClub}
                onCheckedChange={(checked) => setOtherClub(checked === true)}
                className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <label
                htmlFor="other-club"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none"
              >
                Soy de otro club
              </label>
            </div>
            
            {otherClub && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nombre del club
                </label>
                <Input
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  required
                  placeholder="Escribe el nombre del club"
                  className="bg-muted border-white/5 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 rounded-lg h-11"
                  maxLength={100}
                />
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full h-11 rounded-lg bg-primary hover:bg-accent text-primary-foreground font-bold tracking-widest text-xs uppercase transition-all duration-300 glow-primary"
              disabled={submitting}
            >
              {submitting ? "Registrando..." : "Confirmar Asistencia"}
            </Button>
          </form>

          {event.attendees.length > 0 && (
            <div className="pt-2">
              <p className="flex items-center gap-1.5 text-xs text-accent font-semibold uppercase tracking-widest mb-3">
                <Users className="w-4 h-4" />
                Asistentes ({event.attendees.length})
              </p>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {event.attendees.map((a, i) => {
                  const hasClub = a.includes("(") && a.endsWith(")");
                  const namePart = hasClub ? a.split(" (")[0] : a;
                  const clubPart = hasClub ? a.slice(a.indexOf(" (") + 2, -1) : null;
                  
                  return (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {namePart.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate leading-tight">
                          {namePart}
                        </p>
                        {clubPart && (
                          <p className="text-[10px] text-accent font-semibold tracking-wider uppercase truncate mt-0.5">
                            {clubPart}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDialog;
