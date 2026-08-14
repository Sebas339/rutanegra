import { Navigate, useLocation } from "react-router-dom";
import { getSessionUser, clearSession } from "@/lib/auth";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
  requireRole?: "admin" | "lider";
}

const RequireAuth = ({ children, requireRole }: Props) => {
  const user = getSessionUser();
  const location = useLocation();

  useEffect(() => {
    if (!user) clearSession();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireRole && user.role !== requireRole && user.role !== "admin") {
    // admin siempre pasa; un lider solo entra si no se exige admin estricto
    if (requireRole === "admin") {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

export default RequireAuth;
