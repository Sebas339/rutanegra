import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users as UsersIcon, Plus, Pencil, Ban, CheckCircle2, Trash2, ArrowLeft, ShieldAlert } from "lucide-react";
import logoAsset from "@/assets/ruta-negra-logo.png";
import Navbar from "@/components/Navbar";
import { getSessionUser, apiGet, apiSend } from "@/lib/auth";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "admin" | "lider";
  active: boolean;
  mustChangePw: boolean;
}

const UsersPage = () => {
  const me = getSessionUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "lider" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const canDelete = me?.role === "admin";
  const canEdit = me?.role === "admin" || me?.role === "lider";

  const load = async () => {
    setLoading(true);
    const data = await apiGet("users");
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMsg("");
    const res = await apiSend("users", "POST", form);
    if (res.ok) {
      setMsg("Usuario creado. Entrégale la contraseña temporal; deberá cambiarla al iniciar sesión.");
      setForm({ name: "", email: "", password: "", role: "lider" });
      setShowCreate(false);
      load();
    } else {
      setError(res.error || "Error al crear");
    }
  };

  const toggleActive = async (u: UserRow) => {
    const res = await apiSend(`users/${u.id}`, "PATCH", { active: !u.active });
    if (res.ok) load();
    else alert(res.error || "No se pudo cambiar el estado");
  };

  const removeUser = async (u: UserRow) => {
    if (!confirm(`¿Eliminar a ${u.name}? Esta acción no se puede deshacer.`)) return;
    const res = await apiSend(`users/${u.id}`, "DELETE");
    if (res.ok) load();
    else alert(res.error || "No se pudo eliminar");
  };

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-12">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <img src={logoAsset} alt="Ruta Negra" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-primary">Usuarios</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                Gestión de accesos · Rol actual: {me?.role?.toUpperCase()}
              </p>
            </div>
          </div>
          <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel
          </Link>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>

        {msg && <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">{msg}</div>}
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>}

        {showCreate && canEdit && (
          <form onSubmit={handleCreate} className="glassmorphism p-5 rounded-xl mb-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" />
              <input required type="email" placeholder="Correo electrónico" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" />
              <input required type="text" placeholder="Contraseña temporal" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm">
                <option value="lider">Líder</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="text-xs text-muted-foreground px-3 py-2">Cancelar</button>
              <button type="submit" className="bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg">Crear</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-10">Cargando usuarios...</p>
        ) : (
          <div className="glassmorphism rounded-2xl overflow-hidden">
            {/* Encabezado (solo escritorio) */}
            <div className="hidden md:grid grid-cols-12 px-4 py-3 text-[11px] uppercase tracking-widest text-muted-foreground border-b border-white/5">
              <div className="col-span-4">Nombre / Correo</div>
              <div className="col-span-2">Rol</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-4 text-right">Acciones</div>
            </div>
            {users.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No hay usuarios registrados.</p>}
            {users.map((u) => (
              <div key={u.id} className="border-b border-white/5 md:grid md:grid-cols-12 md:px-4 md:py-3 md:items-center text-sm">
                {/* Móvil: tarjeta apilada | Escritorio: columnas */}
                <div className="flex flex-col gap-3 p-4 md:p-0 md:contents">
                  <div className="flex items-start justify-between gap-3 md:col-span-4 md:block">
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-muted-foreground break-all">{u.email}</p>
                    </div>
                    {/* Acciones visibles en móvil a la derecha del nombre */}
                    <div className="flex gap-2 md:hidden shrink-0">
                      {canEdit && u.id !== me?.userId && !(me?.role === "lider" && u.role === "admin") && (
                        <button onClick={() => toggleActive(u)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" title={u.active ? "Desactivar" : "Activar"}>
                          {u.active ? <Ban className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        </button>
                      )}
                      {canDelete && !(me?.role === "lider" && u.role === "admin") && (
                        <button onClick={() => removeUser(u)} className="p-2 rounded-lg bg-white/5 hover:bg-destructive/20 transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      )}
                      {me?.role === "lider" && u.role === "admin" && (
                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 py-2">
                          <ShieldAlert className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:block md:col-span-2">
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground md:hidden">Rol</span>
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${u.role === "admin" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                      {u.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between md:block md:col-span-2">
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground md:hidden">Estado</span>
                    <div>
                      {u.active ? (
                        <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Activo</span>
                      ) : (
                        <span className="text-xs text-destructive flex items-center gap-1"><Ban className="w-3 h-3" /> Inactivo</span>
                      )}
                      {u.mustChangePw && <p className="text-[10px] text-amber-400 mt-0.5">Cambio pendiente</p>}
                    </div>
                  </div>

                  {/* Acciones en escritorio */}
                  <div className="hidden md:flex md:col-span-4 md:justify-end md:gap-2">
                    {canEdit && u.id !== me?.userId && !(me?.role === "lider" && u.role === "admin") && (
                      <button onClick={() => toggleActive(u)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" title={u.active ? "Desactivar" : "Activar"}>
                        {u.active ? <Ban className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      </button>
                    )}
                    {canDelete && !(me?.role === "lider" && u.role === "admin") && (
                      <button onClick={() => removeUser(u)} className="p-2 rounded-lg bg-white/5 hover:bg-destructive/20 transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                    {me?.role === "lider" && u.role === "admin" && (
                      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 py-2">
                        <ShieldAlert className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!canDelete && (
          <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground/70">
            <ShieldAlert className="w-3 h-3" /> Los líderes pueden crear y gestionar usuarios, pero no pueden eliminarlos.
          </p>
        )}
      </div>
    </main>
  );
};

export default UsersPage;
