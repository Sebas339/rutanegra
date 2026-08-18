// Backend de autenticación y gestión de usuarios (Netlify Function)
// Auth propia con bcrypt + Netlify DB (Postgres) vía pg. Sin Appwrite.
// El backend firma su propio JWT (HMAC) para la sesión del frontend.
// Todas las operaciones validan el rol del llamador en el servidor.
//
// Netlify inyecta DATABASE_URL automáticamente al vincular una DB al sitio.

import { Pool } from "pg";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "cambia-este-secreto-en-netlify-2026";

// Semilla del admin inicial (se crea solo si no hay usuarios)
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "laschicasenmotomanizales@gmail.com";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Enlajuega1.";
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Manuela Perez";

// ---------- Pool de Postgres ----------
let _pool = null;
// Respaldo de DATABASE_URL (escritura). Si Netlify inyecta process.env.DATABASE_URL
// (lo normal al vincular Netlify DB), se usa esa. Si no, cae en esta cadena.
const FALLBACK_DATABASE_URL = "postgresql://netlifydb_owner:npg_jNWnC4t3drDl@ep-billowing-credit-ax4nsnp4.c-4.us-east-2.db.netlify.com/netlifydb?sslmode=require";

function getPool() {
  if (_pool) return _pool;
  const conn = process.env.DATABASE_URL || FALLBACK_DATABASE_URL;
  if (!conn) {
    throw new Error("DATABASE_URL no está definida (vincula una Netlify DB al sito)");
  }
  _pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  return _pool;
}

// ---------- Init schema (idempotente) ----------
let _schemaReady = false;
async function ensureSchema() {
  if (_schemaReady) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('admin','lider')),
      password_hash TEXT NOT NULL,
      must_change_pw BOOLEAN NOT NULL DEFAULT true,
      active BOOLEAN NOT NULL DEFAULT true,
      created_by UUID,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  // Sembrar admin si no hay ningún usuario
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM users");
  if (rows[0].n === 0) {
    const hash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO users (id, name, email, role, password_hash, must_change_pw, active, created_by)
       VALUES ($1,$2,$3,$4,$5,false,true,NULL)`,
      ["00000000-0000-0000-0000-000000000001", SEED_ADMIN_NAME, SEED_ADMIN_EMAIL.toLowerCase(), "admin", hash]
    );
  }

  // Tabla de eventos (rutas)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT '',
      meeting_time TEXT NOT NULL DEFAULT '',
      meeting_point TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      cancelled BOOLEAN NOT NULL DEFAULT false,
      created_by UUID,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Tabla de asistentes (teléfono en asistencia)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendees (
      id UUID PRIMARY KEY,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendees_event ON attendees (event_id);`);

  _schemaReady = true;
}

// ---------- Helpers ----------
function rowToUser(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    active: r.active,
    mustChangePw: r.must_change_pw === true,
  };
}

// ---------- JWT (HMAC con Web Crypto) ----------
const enc = new TextEncoder();
async function signJWT(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const data = enc.encode(h + "." + p);
  const key = await crypto.subtle.importKey("raw", enc.encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return h + "." + p + "." + b64url(new Uint8Array(sig));
}
async function verifyJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const data = enc.encode(parts[0] + "." + parts[1]);
    const key = await crypto.subtle.importKey("raw", enc.encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("HMAC", key, b64urlDecode(parts[2]), data);
    if (!ok) return null;
    return JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
  } catch { return null; }
}
function b64url(s) {
  return Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

// ---------- Respuesta clásica de Netlify Function ----------
function json(obj, status = 200) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
function getBearer(event) {
  const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

// ---------- Handler ----------
export async function handler(event) {
  // path desde URL (redirect /api/...) o desde body (llamada directa)
  const rawUrl = event.rawUrl || `https://example.com${event.path || "/"}`;
  const url = new URL(rawUrl);
  let path = url.pathname.replace(/^\/api\/?/, "").replace(/^\/|\/$/g, "");
  let bodyObj = {};
  try { bodyObj = event.body ? JSON.parse(event.body) : {}; } catch { bodyObj = {}; }
  if (bodyObj.path) path = String(bodyObj.path).replace(/^\/|\/$/g, "");
  let method = (event.httpMethod || "GET").toUpperCase();
  if (bodyObj.method) method = String(bodyObj.method).toUpperCase();
  if (method === "PUT") method = "PATCH";

  try {
    await ensureSchema();

    // ===== LOGIN =====
    if (path === "login" && method === "POST") {
      const { email, password } = bodyObj;
      if (!email || !password) return json({ error: "Email y contraseña requeridos" }, 400);
      const pool = getPool();
      const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [String(email).toLowerCase()]);
      const user = rows[0];
      if (!user || !user.active) return json({ error: "Credenciales incorrectas" }, 401);
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return json({ error: "Credenciales incorrectas" }, 401);
      const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
      const token = await signJWT({
        sub: user.id, role: user.role, name: user.name, email: user.email,
        mustChangePw: user.must_change_pw === true, exp,
      });
      return json({ jwt: token, userId: user.id, name: user.name, email: user.email, role: user.role, mustChangePw: user.must_change_pw === true });
    }

    // ===== CAMBIO DE CONTRASEÑA =====
    if (path === "change-password" && method === "POST") {
      const { jwt, newPassword } = bodyObj;
      const me = await verifyJWT(jwt);
      if (!me) return json({ error: "Sesión inválida" }, 401);
      if (!newPassword || newPassword.length < 6) return json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
      const pool = getPool();
      await pool.query("UPDATE users SET password_hash = $1, must_change_pw = false WHERE id = $2", [await bcrypt.hash(newPassword, 10), me.sub]);
      return json({ ok: true });
    }

    // ===== RUTAS PROTEGIDAS =====
    const token = getBearer(event);
    const me = await verifyJWT(token);
    if (!me) return json({ error: "No autenticado" }, 401);
    const isAdmin = me.role === "admin";
    const isLider = me.role === "lider";

    // ===== LISTAR =====
    if (path === "users" && method === "GET") {
      if (!isAdmin && !isLider) return json({ error: "Sin permiso" }, 403);
      const { rows } = await getPool().query("SELECT * FROM users ORDER BY created_at DESC");
      const list = rows.map(rowToUser);
      return json({ users: list, callerRole: me.role });
    }

    // ===== CREAR =====
    if (path === "users" && method === "POST") {
      if (!isAdmin && !isLider) return json({ error: "Sin permiso" }, 403);
      const { name, email, password, role } = bodyObj;
      if (!name || !email || !password || !role) return json({ error: "Faltan campos" }, 400);
      if (!["admin", "lider"].includes(role)) return json({ error: "Rol inválido" }, 400);
      if (password.length < 6) return json({ error: "La contraseña temporal debe tener al menos 6 caracteres" }, 400);
      const pool = getPool();
      const exists = await pool.query("SELECT id FROM users WHERE email = $1", [String(email).toLowerCase()]);
      if (exists.rows.length) return json({ error: "Ese correo ya está registrado" }, 400);
      const newId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO users (id, name, email, role, password_hash, must_change_pw, active, created_by)
         VALUES ($1,$2,$3,$4,$5,true,true,$6)`,
        [newId, name, String(email).toLowerCase(), role, await bcrypt.hash(password, 10), me.sub]
      );
      return json({ ok: true, userId: newId }, 201);
    }

    // ===== ACTUALIZAR (rol, activar/desactivar) =====
    if (path.startsWith("users/") && method === "PATCH") {
      const targetId = path.split("/")[1];
      const { role, active } = bodyObj;
      const pool = getPool();
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [targetId]);
      const user = rows[0];
      if (!user) return json({ error: "Usuario no encontrado" }, 404);
      if (isLider && me.sub === targetId && role && role !== "lider") return json({ error: "Un líder no puede cambiar su propio rol" }, 403);
      if (isLider && role === "admin" && user.role !== "admin") return json({ error: "Un líder no puede asignar rol admin" }, 403);
      if (typeof role !== "undefined") await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, targetId]);
      if (typeof active !== "undefined") await pool.query("UPDATE users SET active = $1 WHERE id = $2", [active, targetId]);
      return json({ ok: true });
    }

    // ===== ELIMINAR =====
    if (path.startsWith("users/") && method === "DELETE") {
      const targetId = path.split("/")[1];
      const pool = getPool();
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [targetId]);
      const user = rows[0];
      if (!user) return json({ error: "Usuario no encontrado" }, 404);
      if (isLider) return json({ error: "Un líder no puede eliminar usuarios" }, 403);
      if (me.sub === targetId) return json({ error: "No puedes eliminarte a ti mismo" }, 403);
      await pool.query("DELETE FROM users WHERE id = $1", [targetId]);
      return json({ ok: true });
    }

    // ===== EVENTOS =====
    if (path === "events" && method === "GET") {
      if (!me) return json({ error: "No autenticado" }, 401);
      const pool = getPool();
      const { rows: evs } = await pool.query("SELECT * FROM events ORDER BY date ASC");
      const { rows: atts } = await pool.query("SELECT * FROM attendees");
      const byEvent = {};
      for (const a of atts) {
        if (!byEvent[a.event_id]) byEvent[a.event_id] = [];
        byEvent[a.event_id].push({ name: a.name, phone: a.phone });
      }
      const list = evs.map((e) => ({
        id: e.id, title: e.title, date: e.date, meetingTime: e.meeting_time,
        meetingPoint: e.meeting_point, location: e.location, description: e.description,
        cancelled: e.cancelled === true, attendees: byEvent[e.id] || [],
      }));
      return json({ events: list });
    }

    if (path === "events" && method === "POST") {
      if (!isAdmin && !isLider) return json({ error: "Sin permiso" }, 403);
      const { title, date, meetingTime, meetingPoint, location, description } = bodyObj;
      if (!title) return json({ error: "El título es requerido" }, 400);
      const newId = crypto.randomUUID();
      await getPool().query(
        `INSERT INTO events (id, title, date, meeting_time, meeting_point, location, description, cancelled, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,false,$8)`,
        [newId, title, date || "", meetingTime || "", meetingPoint || "", location || "", description || "", me.sub]
      );
      return json({ ok: true, id: newId }, 201);
    }

    if (path.startsWith("events/") && method === "PATCH") {
      if (!isAdmin && !isLider) return json({ error: "Sin permiso" }, 403);
      const targetId = path.split("/")[1];
      const { title, date, meetingTime, meetingPoint, location, description, cancelled } = bodyObj;
      const pool = getPool();
      const sets = []; const vals = []; let i = 1;
      const add = (col, val) => { if (typeof val !== "undefined") { sets.push(`${col} = $${i++}`); vals.push(val); } };
      add("title", title); add("date", date); add("meeting_time", meetingTime);
      add("meeting_point", meetingPoint); add("location", location); add("description", description);
      add("cancelled", cancelled);
      if (sets.length === 0) return json({ ok: true });
      vals.push(targetId);
      await pool.query(`UPDATE events SET ${sets.join(", ")} WHERE id = $${i}`, vals);
      return json({ ok: true });
    }

    if (path.startsWith("events/") && method === "DELETE") {
      if (!isAdmin && !isLider) return json({ error: "Sin permiso" }, 403);
      const targetId = path.split("/")[1];
      await getPool().query("DELETE FROM events WHERE id = $1", [targetId]);
      return json({ ok: true });
    }

    // ===== ASISTENTES (teléfono en asistencia) =====
    // Agregar asistente a un evento
    if (path === "attendees" && method === "POST") {
      if (!me) return json({ error: "No autenticado" }, 401);
      const { eventId, name, phone } = bodyObj;
      if (!eventId || !name) return json({ error: "Faltan campos" }, 400);
      const pool = getPool();
      const { rows: ev } = await pool.query("SELECT id FROM events WHERE id = $1", [eventId]);
      if (!ev.length) return json({ error: "Evento no encontrado" }, 404);
      const trimmedPhone = (phone || "").trim();
      const { rows: exist } = await pool.query(
        "SELECT id FROM attendees WHERE event_id = $1 AND name = $2 AND phone = $3",
        [eventId, name, trimmedPhone]
      );
      if (exist.length) return json({ ok: false, duplicated: true });
      const newId = crypto.randomUUID();
      await pool.query(
        "INSERT INTO attendees (id, event_id, name, phone) VALUES ($1,$2,$3,$4)",
        [newId, eventId, name, trimmedPhone]
      );
      return json({ ok: true, id: newId }, 201);
    }

    return json({ error: "Ruta no encontrada" }, 404);
  } catch (e) {
    console.error("ERROR handler:", e);
    return json({ error: "Error interno", detail: String(e && e.message || e) }, 500);
  }
}
