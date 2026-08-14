import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, ShieldAlert } from "lucide-react";
import logoAsset from "@/assets/ruta-negra-logo.png";
import { login } from "@/lib/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res.ok) {
        setError(res.error || "Credenciales incorrectas");
        return;
      }
      if (res.mustChangePw) {
        navigate("/first-login");
      } else {
        navigate(from);
      }
    } catch {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
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
          <h1 className="font-heading text-3xl uppercase tracking-widest text-primary mt-3">Acceso</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Panel de Administración</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold uppercase tracking-wider py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Entrando..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            ← Volver a la web
          </Link>
        </div>
      </motion.div>
    </main>
  );
};

export default Login;
