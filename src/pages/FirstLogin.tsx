import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, ShieldCheck } from "lucide-react";
import logoAsset from "@/assets/ruta-negra-logo.png";
import { changePassword, getSessionUser } from "@/lib/auth";

const FirstLogin = () => {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = getSessionUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (pw !== pw2) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    const res = await changePassword(pw);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "No se pudo cambiar la contraseña");
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/admin"), 1200);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glassmorphism p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-6">
          <img src={logoAsset} alt="Ruta Negra" className="w-16 h-16 object-contain" />
          <h1 className="font-heading text-2xl uppercase tracking-widest text-primary mt-3">Cambio de contraseña</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            {user ? `Bienvenido ${user.name}` : "Primer inicio de sesión"}
          </p>
        </div>

        {done ? (
          <div className="text-center text-green-400 flex flex-col items-center gap-2 py-6">
            <ShieldCheck className="w-10 h-10" />
            <p className="font-semibold">Contraseña actualizada</p>
            <p className="text-xs text-muted-foreground">Redirigiendo al panel...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nueva contraseña</label>
                <input
                  type="password"
                  required
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmar contraseña</label>
                <input
                  type="password"
                  required
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Repite la contraseña"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold uppercase tracking-wider py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? "Guardando..." : "Establecer contraseña"}
              </button>
            </form>
            <p className="mt-4 text-[11px] text-muted-foreground/70 text-center">
              Por seguridad debes cambiar la contraseña temporal en tu primer inicio de sesión.
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
};

export default FirstLogin;
