// Backend de autenticación y gestión de usuarios (Netlify Function)
// Auth propia con bcrypt + almacenamiento en Netlify Blobs (sin Appwrite).
// El backend firma su propio JWT (HMAC) para la sesión del frontend.
// Todas las operaciones validan el rol del llamador en el servidor.

import { getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "cambia-este-secreto-en-netlify-2026";
const SITE_KEY = process.env.SITE_KEY || "rn-auth";
const STORE_NAME = "rn-users";

// Semilla del admin inicial (se crea solo si no hay usuarios)
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "laschicasenmotomanizales@gmail.com";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Enlajuega1.";
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Manuela Perez";

// ---------- Blobs helpers ----------
// Modo automático: Netlify inyecta siteID + token cuando la integración
// Blobs está activa en el sitio. No necesitamos pasarlas manualmente.
// En tests locales se puede inyectar globalThis.__BLOBS_STORE__ = { get, set }.
async function getUsersStore() {
  if (globalThis.__BLOBS_STORE__) return globalThis.__BLOBS_STORE__;
  // Sin siteID ni token: Netlify los resuelve automáticamente en el runtime.
  return getStore({ name: STORE_NAME });
}

async function readUsers() {
  const store = await getUsersStore();
  const raw = await store.get("users", { type: "json" });
  return raw && Array.isArray(raw.users) ? raw.users : [];
}

async function writeUsers(users) {
  const store = await getUsersStore();
  await store.set("users", JSON.stringify({ users }), { metadata: { updatedAt: new Date().toISOString() } });
}

async function ensureSeed() {
  const users = await readUsers();
  if (users.length > 0) return;
  const hash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
  users.push({
    id: crypto.randomUUID(),
    name: SEED_ADMIN_NAME,
    email: SEED_ADMIN_EMAIL.toLowerCase(),
    role: "admin",
    passwordHash: hash,
    mustChangePw: false,
    active: true,
    createdBy: "seed",
  });
  await writeUsers(users);
}

// ---------- JWT propio (HMAC-SHA256 con Web Crypto) ----------
function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlStr(s) {
  return b64url(Buffer.from(s, "utf8"));
}
async function signJWT(payload) {
  const enc = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = b64urlStr(JSON.stringify(header));
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${b64url(sig)}`;
}
async function verifyJWT(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sig = Buffer.from(sigB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const ok = await crypto.subtle.verify("HMAC", key, sig, enc.encode(`${headerB64}.${payloadB64}`));
  if (!ok) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- helpers ----------
function json(obj, status = 200) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
function getBearer(event) {
  const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

// ---------- handler principal ----------
export async function handler(event) {
  const rawUrl = event.rawUrl || `https://example.com${event.path || "/"}`;
  const url = new URL(rawUrl);
  // path desde la URL (redirect /api/...) O desde el body (llamada directa)
  let path = url.pathname.replace(/^\/api\/?/, "").replace(/^\/|\/$/g, "");
  let bodyObj = {};
  try { bodyObj = event.body ? JSON.parse(event.body) : {}; } catch { bodyObj = {}; }
  if (bodyObj.path) path = String(bodyObj.path).replace(/^\/|\/$/g, "");
  // method desde la URL o desde el body (llamada directa del frontend)
  let method = (event.httpMethod || "GET").toUpperCase();
  if (bodyObj.method) method = String(bodyObj.method).toUpperCase();
  // PUT y PATCH son equivalentes para actualización
  if (method === "PUT") method = "PATCH";

  try {
    // ===== LOGIN =====
    if (path === "login" && method === "POST") {
      const { email, password } = JSON.parse(event.body || "{}");
      if (!email || !password) return json({ error: "Email y contraseña requeridos" }, 400);
      await ensureSeed();
      const users = await readUsers();
      const user = users.find((u) => u.email === String(email).toLowerCase());
      if (!user || !user.active) return json({ error: "Credenciales incorrectas" }, 401);
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return json({ error: "Credenciales incorrectas" }, 401);

      const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
      const token = await signJWT({
        sub: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        mustChangePw: user.mustChangePw === true,
        exp,
      });
      return json({
        jwt: token,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePw: user.mustChangePw === true,
      });
    }

    // ===== CAMBIO DE CONTRASEÑA (primer login o normal) =====
    if (path === "change-password" && method === "POST") {
      const { jwt, newPassword } = JSON.parse(event.body || "{}");
      const me = await verifyJWT(jwt);
      if (!me) return json({ error: "Sesión inválida" }, 401);
      if (!newPassword || newPassword.length < 6) return json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
      const users = await readUsers();
      const user = users.find((u) => u.id === me.sub);
      if (!user) return json({ error: "Usuario no encontrado" }, 404);
      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.mustChangePw = false;
      await writeUsers(users);
      return json({ ok: true });
    }

    // ===== RUTAS PROTEGIDAS (requieren JWT) =====
    const token = getBearer(event);
    const me = await verifyJWT(token);
    if (!me) return json({ error: "No autenticado" }, 401);
    const isAdmin = me.role === "admin";
    const isLider = me.role === "lider";

    // ===== LISTAR USUARIOS =====
    if (path === "users" && method === "GET") {
      if (!isAdmin && !isLider) return json({ error: "Sin permiso" }, 403);
      const users = await readUsers();
      const list = users.map((u) => ({
        id: u.id,
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
        mustChangePw: u.mustChangePw,
      }));
      return json({ users: list, callerRole: me.role });
    }

    // ===== CREAR USUARIO (admin o lider) =====
    if (path === "users" && method === "POST") {
      if (!isAdmin && !isLider) return json({ error: "Sin permiso" }, 403);
      const { name, email, password, role } = JSON.parse(event.body || "{}");
      if (!name || !email || !password || !role) return json({ error: "Faltan campos" }, 400);
      if (!["admin", "lider"].includes(role)) return json({ error: "Rol inválido" }, 400);
      if (password.length < 6) return json({ error: "La contraseña temporal debe tener al menos 6 caracteres" }, 400);
      const users = await readUsers();
      if (users.some((u) => u.email === String(email).toLowerCase())) {
        return json({ error: "Ese correo ya está registrado" }, 400);
      }
      const newId = crypto.randomUUID();
      users.push({
        id: newId,
        name,
        email: String(email).toLowerCase(),
        role,
        passwordHash: await bcrypt.hash(password, 10),
        mustChangePw: true,
        active: true,
        createdBy: me.sub,
      });
      await writeUsers(users);
      return json({ ok: true, userId: newId }, 201);
    }

    // ===== ACTUALIZAR USUARIO (rol, activar/desactivar) =====
    if (path.startsWith("users/") && method === "PATCH") {
      const targetId = path.split("/")[1];
      const body = JSON.parse(event.body || "{}");
      const { role, active } = body;
      const users = await readUsers();
      const user = users.find((u) => u.id === targetId);
      if (!user) return json({ error: "Usuario no encontrado" }, 404);

      // LÍDER: NO puede cambiar su propio rol a admin
      if (isLider && me.sub === targetId && role && role !== "lider") {
        return json({ error: "Un líder no puede cambiar su propio rol" }, 403);
      }
      // LÍDER: NO puede asignar rol admin a otro
      if (isLider && role === "admin" && user.role !== "admin") {
        return json({ error: "Un líder no puede asignar rol admin" }, 403);
      }
      if (typeof role !== "undefined") user.role = role;
      if (typeof active !== "undefined") user.active = active;
      await writeUsers(users);
      return json({ ok: true });
    }

    // ===== ELIMINAR USUARIO =====
    if (path.startsWith("users/") && method === "DELETE") {
      const targetId = path.split("/")[1];
      const users = await readUsers();
      const user = users.find((u) => u.id === targetId);
      if (!user) return json({ error: "Usuario no encontrado" }, 404);
      // LÍDER: NO puede eliminar usuarios
      if (isLider) return json({ error: "Un líder no puede eliminar usuarios" }, 403);
      // admin no se elimina a sí mismo
      if (me.sub === targetId) return json({ error: "No puedes eliminarte a ti mismo" }, 403);
      const next = users.filter((u) => u.id !== targetId);
      await writeUsers(next);
      return json({ ok: true });
    }

    return json({ error: "Ruta no encontrada" }, 404);
  } catch (e) {
    console.error("ERROR handler:", e);
    return json({ error: "Error interno" }, 500);
  }
}
