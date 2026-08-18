// Sesión de usuario en el frontend. Guardamos el JWT de Appwrite en localStorage.
// El JWT se envía en Authorization: Bearer a las Netlify Functions (backend).

const TOKEN_KEY = "rn_token";
const USER_KEY = "rn_user";

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "lider";
  mustChangePw: boolean;
}

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(email: string, password: string): Promise<{ ok: boolean; mustChangePw?: boolean; error?: string }> {
  try {
    const res = await fetch("/.netlify/functions/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "login", email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Error de autenticación" };
    }
    // Appwrite devuelve session con jwt; si no viene, intentamos con account.createEmailPasswordSession
    const token = data.jwt || (data.session && data.session.jwt) || null;
    if (!token) return { ok: false, error: "No se recibió token de sesión" };
    saveSession(token, {
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      mustChangePw: data.mustChangePw,
    });
    return { ok: true, mustChangePw: data.mustChangePw };
  } catch (e) {
    return { ok: false, error: "No se pudo conectar con el servidor" };
  }
}

export async function changePassword(newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const token = getToken();
  if (!token) return { ok: false, error: "No hay sesión" };
  const res = await fetch("/.netlify/functions/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ path: "change-password", jwt: token, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || "Error" };
  // actualizar sesión local: ya no debe cambiar pw
  const u = getSessionUser();
  if (u) saveSession(token, { ...u, mustChangePw: false });
  return { ok: true };
}

export async function logout() {
  const token = getToken();
  if (token) {
    fetch("/.netlify/functions/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ path: "logout" }),
    }).catch(() => {});
  }
  clearSession();
}

// Helpers para llamar al backend autenticado
export async function apiGet(p: string) {
  const token = getToken();
  const res = await fetch("/.netlify/functions/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ path: p, method: "GET" }),
  });
  return res.json();
}

export async function apiSend(p: string, method: string, body?: Record<string, unknown>) {
  const token = getToken();
  const res = await fetch("/.netlify/functions/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ path: p, method, ...body }),
  });
  return res.json();
}
