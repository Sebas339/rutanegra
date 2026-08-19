import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, ArrowLeft, Building2, MapPin, Phone, User, Handshake, ImageIcon } from "lucide-react";
import logoAsset from "@/assets/ruta-negra-logo.png";
import Navbar from "@/components/Navbar";
import { getSessionUser, apiGet, apiSend } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Convenio {
  id: string;
  companyName: string;
  address: string;
  city: string | null;
  phone: string;
  contactName: string;
  logo: string | null;
}

const MAX_LOGO_BYTES = 2_500_000; // ~2.5 MB en base64

const Convenios = () => {
  const me = getSessionUser();
  const { toast } = useToast();
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ companyName: "", address: "", city: "", phone: "", contactName: "" });
  const [error, setError] = useState("");

  // Estado de edición
  const [editing, setEditing] = useState<Convenio | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ companyName: "", address: "", city: "", phone: "", contactName: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const canManage = me?.role === "admin" || me?.role === "lider";

  const load = async () => {
    setLoading(true);
    const data = await apiGet("convenios");
    setConvenios(data.convenios || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setError("El logo es demasiado grande (máx ~2.5 MB). Usa una imagen más pequeña.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await apiSend("convenios", "POST", {
      companyName: form.companyName,
      address: form.address,
      city: form.city,
      phone: form.phone,
      contactName: form.contactName,
      logo: logoPreview,
    });
    setSubmitting(false);
    if (res.ok) {
      toast({ title: "Convenio registrado", description: `${form.companyName} se agregó correctamente.` });
      setForm({ companyName: "", address: "", city: "", phone: "", contactName: "" });
      setLogoPreview(null);
      setShowCreate(false);
      load();
    } else {
      setError(res.error || "No se pudo registrar el convenio");
    }
  };

  const removeConvenio = async (c: Convenio) => {
    if (!confirm(`¿Eliminar el convenio con ${c.companyName}?`)) return;
    const res = await apiSend(`convenios/${c.id}`, "DELETE");
    if (res.ok) {
      toast({ title: "Convenio eliminado" });
      load();
    } else {
      toast({ title: "Error", description: res.error || "No se pudo eliminar", variant: "destructive" });
    }
  };

  // Abrir edición
  const openEdit = (c: Convenio) => {
    setEditing(c);
    setEditForm({ companyName: c.companyName, address: c.address, city: c.city || "", phone: c.phone, contactName: c.contactName });
    setEditLogoPreview(c.logo);
    setError("");
  };

  const handleEditLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setError("El logo es demasiado grande (máx ~2.5 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEditLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditSubmitting(true);
    const res = await apiSend(`convenios/${editing.id}`, "PATCH", {
      companyName: editForm.companyName,
      address: editForm.address,
      city: editForm.city,
      phone: editForm.phone,
      contactName: editForm.contactName,
      logo: editLogoPreview,
    });
    setEditSubmitting(false);
    if (res.ok) {
      toast({ title: "Convenio actualizado" });
      setEditing(null);
      load();
    } else {
      toast({ title: "Error", description: res.error || "No se pudo actualizar", variant: "destructive" });
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-12">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <img src={logoAsset} alt="Ruta Negra" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-primary">Convenios</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                Empresas aliadas · Rol actual: {me?.role?.toUpperCase()}
              </p>
            </div>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel
          </Link>
        </div>

        {canManage && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowCreate(!showCreate); setError(""); }}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nuevo Convenio
            </button>
          </div>
        )}

        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>}

        {showCreate && canManage && (
          <form onSubmit={handleSubmit} className="glassmorphism p-5 rounded-xl mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-accent" /> Nombre de la empresa
                </label>
                <input required placeholder="Ej: Motos del Eje" value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent" /> Nombre de contacto
                </label>
                <input required placeholder="Ej: Ana Pérez" value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" /> Dirección (ubicación)
                </label>
                <input required placeholder="Ej: Cra 12 #34-56, Manizales" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" /> Ciudad
                </label>
                <input placeholder="Ej: Manizales" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-accent" /> Teléfono
                </label>
                <input required placeholder="Ej: 3001234567" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-accent" /> Logo de la empresa
              </label>
              <input type="file" accept="image/*" onChange={handleLogo}
                className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/20 file:text-primary file:font-semibold file:cursor-pointer" />
              {logoPreview && (
                <div className="mt-2">
                  <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain rounded-lg border border-white/10 bg-white/5" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowCreate(false); setLogoPreview(null); setError(""); }}
                className="text-xs text-muted-foreground px-3 py-2">Cancelar</button>
              <button type="submit" disabled={submitting}
                className="bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg disabled:opacity-50">
                {submitting ? "Guardando..." : "Registrar convenio"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-10">Cargando convenios...</p>
        ) : convenios.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No hay convenios registrados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {convenios.map((c) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glassmorphism rounded-2xl p-4 flex flex-col gap-3">
                {/* Logo protagonista: sin recuadro, sobre la tarjeta, más grande */}
                <div className="w-full flex items-center justify-center py-2">
                  {c.logo
                    ? <img src={c.logo} alt={c.companyName} className="max-w-[80%] max-h-40 object-contain" />
                    : <Handshake className="w-12 h-12 text-muted-foreground" />}
                </div>
                {/* Nombre con jerarquía clara */}
                <p className="font-heading uppercase tracking-wider text-foreground text-lg leading-tight text-center">
                  {c.companyName}
                </p>
                {/* Datos en columna, alineados y separados */}
                <div className="text-sm text-muted-foreground space-y-2.5">
                  <p className="flex items-start gap-2"><User className="w-4 h-4 text-accent shrink-0 mt-0.5" /> <span>{c.contactName}</span></p>
                  <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" /> <span>{c.address}</span></p>
                  {c.city && (
                    <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" /> <span>{c.city}</span></p>
                  )}
                  <p className="flex items-start gap-2"><Phone className="w-4 h-4 text-accent shrink-0 mt-0.5" /> <span>{c.phone}</span></p>
                </div>
                {canManage && (
                  <div className="flex justify-end gap-2 pt-1 mt-auto">
                    <button onClick={() => openEdit(c)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" title="Editar convenio">
                      <Pencil className="w-4 h-4 text-accent" />
                    </button>
                    <button onClick={() => removeConvenio(c)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-destructive/20 transition-colors" title="Eliminar convenio">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo de edición */}
      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="glassmorphism rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-lg my-auto">
            <h2 className="font-heading uppercase tracking-widest text-primary text-xl mb-5 flex items-center gap-2">
              <Pencil className="w-5 h-5" /> Editar convenio
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-accent" /> Nombre
                  </label>
                  <input required value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-accent" /> Contacto
                  </label>
                  <input required value={editForm.contactName}
                    onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent" /> Dirección
                  </label>
                  <input required value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent" /> Ciudad
                  </label>
                  <input value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-accent" /> Teléfono
                  </label>
                  <input required value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm w-full" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-accent" /> Logo
                </label>
                <input type="file" accept="image/*" onChange={handleEditLogo}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/20 file:text-primary file:font-semibold file:cursor-pointer" />
                {editLogoPreview && (
                  <div className="mt-2">
                    <img src={editLogoPreview} alt="Logo preview" className="h-16 w-16 object-contain rounded-lg border border-white/10 bg-white/5" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="text-xs text-muted-foreground px-3 py-2">Cancelar</button>
                <button type="submit" disabled={editSubmitting}
                  className="bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg disabled:opacity-50">
                  {editSubmitting ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Convenios;
