import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addEvent, fetchEvents, deleteEvent, updateEvent, setEventCancelled, type EventData } from "@/lib/events-store";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Users, Pencil, Ban, RotateCcw, Plus, Calendar, Clock, MapPin, Tag, FileText, CheckCircle2, XCircle, Phone } from "lucide-react";
import { formatTime12 } from "@/lib/format-time";
import { isEventPast } from "@/lib/event-status";
import logoAsset from "@/assets/ruta-negra-logo.png";
import Navbar from "@/components/Navbar";

const Admin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      console.error("Error loading events:", err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await addEvent({
        title: formData.get("title") as string,
        date: formData.get("date") as string,
        meetingTime: formData.get("meetingTime") as string,
        meetingPoint: formData.get("meetingPoint") as string,
        location: formData.get("location") as string,
        description: formData.get("description") as string,
      });
      await loadEvents();
      toast({
        title: "¡Ruta creada!",
        description: "La ruta ha sido registrada exitosamente.",
      });
      form.reset();
    } catch {
      toast({ title: "Error", description: "No se pudo crear la ruta. Comprueba tu conexión con el servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Ruta eliminada" });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar la ruta.", variant: "destructive" });
    }
  };

  const handleToggleCancel = async (event: EventData) => {
    try {
      await setEventCancelled(event.id, !event.cancelled);
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, cancelled: !e.cancelled } : e)));
      toast({ title: event.cancelled ? "Ruta reactivada" : "Ruta cancelada" });
    } catch {
      toast({ title: "Error", description: "No se pudo cambiar el estado de la ruta.", variant: "destructive" });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent) return;
    setEditLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    try {
      await updateEvent(editingEvent.id, {
        title: formData.get("title") as string,
        date: formData.get("date") as string,
        meetingTime: formData.get("meetingTime") as string,
        meetingPoint: formData.get("meetingPoint") as string,
        location: formData.get("location") as string,
        description: formData.get("description") as string,
      });
      await loadEvents();
      toast({ title: "Ruta actualizada" });
      setEditingEvent(null);
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar la ruta.", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  };

  // Calculate Metrics
  const totalRoutes = events.length;
  const pastRoutes = events.filter((e) => isEventPast(e.date)).length;
  const activeRoutes = events.filter((e) => !isEventPast(e.date) && !e.cancelled).length;
  const cancelledRoutes = events.filter((e) => e.cancelled && !isEventPast(e.date)).length;
  const totalAttendees = events.reduce((sum, e) => sum + e.attendees.length, 0);

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-12">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <img src={logoAsset} alt="Ruta Negra Manizales" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-primary">
                Panel de Control
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                Dashboard de Administración
              </p>
            </div>
          </div>
          
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a la Web
          </Link>
        </div>

        {/* Dashboard Grid Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glassmorphism p-5 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Rutas Totales</span>
            <span className="text-3xl font-heading text-primary mt-2">{totalRoutes}</span>
          </div>
          <div className="glassmorphism p-5 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Rutas Activas</span>
            <span className="text-3xl font-heading text-green-400 mt-2">{activeRoutes}</span>
          </div>
          <div className="glassmorphism p-5 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Asistentes Totales</span>
            <span className="text-3xl font-heading text-accent mt-2">{totalAttendees}</span>
          </div>
          <div className="glassmorphism p-5 rounded-xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Canceladas</span>
            <span className="text-3xl font-heading text-red-500 mt-2">{cancelledRoutes}</span>
          </div>
        </div>

        {/* Main Sections Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column Left: Register Route Form */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glassmorphism p-6 rounded-2xl shadow-xl"
            >
              <h2 className="font-heading text-xl uppercase tracking-widest text-primary border-b border-white/5 pb-3 mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Registrar Nueva Ruta
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-accent" />
                    Nombre de la ruta
                  </label>
                  <Input name="title" required placeholder="Ej: Ruta al Nevado" className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" maxLength={100} />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      Fecha
                    </label>
                    <Input name="date" required type="date" className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      Hora
                    </label>
                    <Input name="meetingTime" required type="time" className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      Encuentro
                    </label>
                    <Input name="meetingPoint" required placeholder="Ej: Parque Caldas" className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      Destino
                    </label>
                    <Input name="location" required placeholder="Ej: Chinchiná" className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" maxLength={100} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-accent" />
                    Descripción
                  </label>
                  <Textarea name="description" required placeholder="Detalles, recomendaciones, equipo de protección..." className="bg-muted border-white/5 focus:border-primary/50 text-foreground min-h-[90px]" maxLength={500} />
                </div>

                <Button type="submit" className="w-full h-11 rounded-lg bg-primary hover:bg-accent text-primary-foreground font-bold tracking-widest text-xs uppercase transition-all duration-300 glow-primary" disabled={loading}>
                  {loading ? "Creando..." : "Crear Ruta"}
                </Button>
              </form>
            </motion.div>
          </div>

          {/* Column Right: Manage Routes List */}
          <div className="lg:col-span-7">
            <div className="glassmorphism p-6 rounded-2xl shadow-xl">
              <h2 className="font-heading text-xl uppercase tracking-widest text-primary border-b border-white/5 pb-3 mb-5 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Rutas Registradas
              </h2>

              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10 font-medium">
                  No hay rutas creadas en el sistema.
                </p>
              ) : (
                <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                  {events.map((event) => {
                    const isPast = isEventPast(event.date);
                    return (
                      <div key={event.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 ${isPast ? "opacity-50 saturate-50" : ""}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5">
                            <p className="font-heading text-lg uppercase tracking-wider text-foreground">
                              {event.title}
                            </p>
                            {event.cancelled && !isPast && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                Cancelada
                              </span>
                            )}
                            {isPast && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                Finalizada
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span>{event.date}</span>
                            <span>•</span>
                            <span>{formatTime12(event.meetingTime)}</span>
                            <span>•</span>
                            <span className="text-accent">{event.location}</span>
                          </p>
                        </div>

                        {/* Action Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Attendees Dialog Trigger */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold uppercase tracking-wider text-accent border-accent/20 hover:bg-accent/10 h-9 px-3.5 rounded-lg bg-black/20">
                                <Users className="w-3.5 h-3.5" />
                                {event.attendees.length}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="glassmorphism border-white/5 sm:max-w-md shadow-2xl">
                              <DialogHeader className="border-b border-white/5 pb-3">
                                <DialogTitle className="font-heading uppercase tracking-widest text-primary text-xl">
                                  Asistentes
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
                                  {event.title}
                                </p>
                              </DialogHeader>
                              
                              {event.attendees.length > 0 ? (
                                <div className="max-h-64 overflow-y-auto space-y-2 py-3 pr-1">
                                  {event.attendees.map((a, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        {a.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-sm font-semibold text-foreground block truncate">{a.name}</span>
                                        {a.phone && (
                                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Phone className="w-3 h-3" />
                                            {a.phone}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-6 font-medium">Aún no hay asistentes registrados.</p>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Edit Event Button */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setEditingEvent(event)}
                            disabled={isPast}
                            title="Editar ruta"
                            className="border-white/10 text-muted-foreground hover:text-primary hover:border-primary/50 h-9 w-9 bg-black/20 rounded-lg disabled:opacity-40"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          {/* Cancel / Reactivate Event Button */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleCancel(event)}
                            disabled={isPast}
                            title={event.cancelled ? "Reactivar ruta" : "Cancelar ruta"}
                            className={`h-9 w-9 bg-black/20 rounded-lg border-white/10 disabled:opacity-40 transition-colors ${
                              event.cancelled
                                ? "text-green-400 hover:text-green-300 hover:border-green-500/50"
                                : "text-red-400 hover:text-red-300 hover:border-red-500/50"
                            }`}
                          >
                            {event.cancelled ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>

                          {/* Delete Event Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-9 w-9 rounded-lg" title="Eliminar ruta">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glassmorphism border-white/5 shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-heading uppercase tracking-widest text-primary text-xl">
                                  ¿Eliminar ruta?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground font-medium text-sm">
                                  ¿Estás seguro de que quieres eliminar <span className="text-foreground font-bold">{event.title}</span>? Esta acción no se puede deshacer y borrará también todos los asistentes asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 rounded-lg">No</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(event.id)}
                                  className="bg-red-600 text-white hover:bg-red-500 rounded-lg"
                                >
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="glassmorphism border-white/5 sm:max-w-lg shadow-2xl p-6">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="font-heading uppercase tracking-widest text-primary text-2xl">
              Editar Ruta
            </DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nombre de la ruta
                </label>
                <Input name="title" required defaultValue={editingEvent.title} className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" maxLength={100} />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</label>
                  <Input name="date" required type="date" defaultValue={editingEvent.date} className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hora de encuentro</label>
                  <Input name="meetingTime" required type="time" defaultValue={editingEvent.meetingTime} className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" />
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Punto de encuentro</label>
                  <Input name="meetingPoint" required defaultValue={editingEvent.meetingPoint} className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" maxLength={100} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destino / Ciudad</label>
                  <Input name="location" required defaultValue={editingEvent.location} className="bg-muted border-white/5 focus:border-primary/50 text-foreground h-11" maxLength={100} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripción</label>
                <Textarea name="description" required defaultValue={editingEvent.description} className="bg-muted border-white/5 focus:border-primary/50 text-foreground min-h-[90px]" maxLength={500} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingEvent(null)} disabled={editLoading} className="bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 rounded-lg">
                  Cancelar
                </Button>
                <Button type="submit" disabled={editLoading} className="bg-primary hover:bg-accent text-primary-foreground font-bold tracking-widest text-xs uppercase h-10 px-6 rounded-lg glow-primary">
                  {editLoading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </main>
  );
};

export default Admin;
