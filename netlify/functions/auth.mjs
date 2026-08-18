// Backend de autenticación y gestión de usuarios (Netlify Function)
// La API key de Appwrite vive AQUÍ como variable de entorno (NUNCA en el cliente).
// El backend firma su propio JWT (HMAC) para la sesión del frontend — no depende de /account/jwt.
// Todas las operaciones validan el rol del llamador en el servidor.

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1";
const APPWRITE_PROJECT = process.env.APPWRITE_PROJECT_ID || "6a74eb5d00352efbb42c";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.APPWRITE_DATABASE_ID || "6a74eb9800061d4c7979";
const USERROLES_COLLECTION = process.env.USERROLES_COLLECTION_ID || "userroles";
const JWT_SECRET = process.env.JWT_SECRET || "cambia-este-secreto-en-netlify-2026";

const headersJSON = {
  "X-Appwrite-Project": APPWRITE_PROJECT,
  "X-Appwrite-Key": APPWRITE_API_KEY,
  "Content-Type": "application/json",
};

const headersClient = {
  "X-Appwrite-Project": APPWRITE_PROJECT,
  "Content-Type": "application/json",
};

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

// ---------- helpers de Appwrite ----------

async function appwriteFetch(path, method = "GET", body, client = false) {
  const res = await fetch(`${APPWRITE_ENDPOINT}${path}`, {
    method,
    headers: client ? headersClient : headersJSON,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { status: res.status, data };
}

// Obtener el registro de userroles por UUID de auth
// Filtramos en memoria (colección pequeña, evita dependencia de índices).
async function getRoleByUserId(userId) {
  const { data } = await appwriteFetch(
    `/databases/${DB_ID}/collections/${USERROLES_COLLECTION}/documents?limit=100`
  );
  const docs = data.documents || [];
  return docs.find((d) => d.userId === userId) || null;
}

function json(obj, status = 200) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

function getBearer(event) {
  const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

// ---------- handler principal ----------

export async function handler(event, context) {
  // Netlify Functions clásico (zip): event.path o event.rawUrl
  const rawUrl = event.rawUrl || `https://example.com${event.path || "/"}`;
  const url = new URL(rawUrl);
  const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const method = (event.httpMethod || "GET").toUpperCase();

  try {
    // ===== LOGIN =====
    if (path === "login" && method === "POST") {
      const { email, password } = JSON.parse(event.body || "{}");
      if (!email || !password) return json({ error: "Email y contraseña requeridos" }, 400);

      // 1) autenticar contra Appwrite Auth nativo
      const auth = await appwriteFetch("/account/sessions/email", "POST", { email, password }, true);
      if (auth.status !== 201) return json({ error: "Credenciales incorrectas" }, 401);

      const userId = auth.data.userId || (auth.data.user && auth.data.user.$id);
      if (!userId) return json({ error: "No se pudo identificar el usuario" }, 401);

      // 2) leer rol desde userroles (llave foránea: userId = $id de Auth)
      const roleDoc = await getRoleByUserId(userId);
      if (!roleDoc) return json({ error: "Usuario sin rol asignado" }, 403);
      if (roleDoc.active === false) return json({ error: "Cuenta inactiva" }, 403);

      // 3) firmar JWT propio del backend (válido 12h)
      const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
      const token = await signJWT({
        sub: userId,
        role: roleDoc.role,
        name: roleDoc.name,
        email: roleDoc.email,
        mustChangePw: roleDoc.mustChangePw === true,
        exp,
      });

      return json({
        jwt: token,
        userId,
        name: roleDoc.name,
        email: roleDoc.email,
        role: roleDoc.role,
        mustChangePw: roleDoc.mustChangePw === true,
      });
    }

    // ===== CAMBIO DE CONTRASEÑA (primer login) =====
    if (path === "change-password" && method === "POST") {
      const { jwt, newPassword } = JSON.parse(event.body || "{}");
      const me = await verifyJWT(jwt);
      if (!me) return json({ error: "Sesión inválida" }, 401);

      // El backend (con API key) cambia la contraseña del usuario en Auth
      const upd = await appwriteFetch(`/users/${me.sub}/password`, "PATCH", { password: newPassword });
      if (upd.status !== 200) {
        const err = upd.data && (upd.data.message || JSON.stringify(upd.data));
        return json({ error: err || "No se pudo cambiar la contraseña" }, 400);
      }

      // quitar flag mustChangePw en userroles
      const roleDoc = await getRoleByUserId(me.sub);
      if (roleDoc) {
        await appwriteFetch(
          `/databases/${DB_ID}/collections/${USERROLES_COLLECTION}/documents/${roleDoc.$id}`,
          "PATCH",
          { data: { mustChangePw: false } }
        );
      }
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
      const { data } = await appwriteFetch(
        `/databases/${DB_ID}/collections/${USERROLES_COLLECTION}/documents?limit=100`
      );
      const users = (data.documents || []).map((d) => ({
        $id: d.$id,
        userId: d.userId,
        name: d.name,
        email: d.email,
        role: d.role,
        active: d.active,
        mustChangePw: d.mustChangePw,
      }));
      return json({ users, callerRole: me.role });
    }

    // ===== CREAR USUARIO (admin o lider) =====
    if (path === "users" && method === "POST") {
      if (!isAdmin && !isLider) return json({ error: "Sin permiso" }, 403);
      const { name, email, password, role } = JSON.parse(event.body || "{}");
      if (!name || !email || !password || !role) return json({ error: "Faltan campos" }, 400);
      if (!["admin", "lider"].includes(role)) return json({ error: "Rol inválido" }, 400);

      // crear en Auth nativo (usa API key del backend, no auth de cliente)
      const created = await appwriteFetch(
        "/users",
        "POST",
        { userId: "unique()", email, password, name }
      );
      if (created.status !== 201) {
        const err = created.data && (created.data.message || JSON.stringify(created.data));
        return json({ error: err || "No se pudo crear el usuario" }, 400);
      }
      const newUserId = created.data.$id;

      // insertar en userroles
      const inserted = await appwriteFetch(
        `/databases/${DB_ID}/collections/${USERROLES_COLLECTION}/documents`,
        "POST",
        {
          documentId: "unique()",
          data: {
            userId: newUserId,
            name,
            email,
            role,
            mustChangePw: true,
            active: true,
            createdBy: me.sub,
          },
        }
      );
      if (inserted.status !== 201) {
        return json({ error: "Usuario Auth creado pero falló el registro de rol" }, 500);
      }
      return json({ ok: true, userId: newUserId }, 201);
    }

    // ===== ACTUALIZAR USUARIO (rol, activar/desactivar) =====
    if (path.startsWith("users/") && method === "PATCH") {
      const targetId = path.split("/")[1];
      const body = JSON.parse(event.body || "{}");
      const { role, active } = body;

      const roleDoc = await getRoleByUserId(targetId);
      if (!roleDoc) return json({ error: "Usuario no encontrado" }, 404);

      // LÍDER: NO puede cambiar su propio rol a admin
      if (isLider && me.sub === targetId && role && role !== "lider") {
        return json({ error: "Un líder no puede cambiar su propio rol" }, 403);
      }
      // LÍDER: NO puede eliminar ni cambiar a admin
      if (isLider && role === "admin" && roleDoc.role !== "admin") {
        return json({ error: "Un líder no puede asignar rol admin" }, 403);
      }

      const updateData = {};
      if (typeof role !== "undefined") updateData.role = role;
      if (typeof active !== "undefined") updateData.active = active;

      const upd = await appwriteFetch(
        `/databases/${DB_ID}/collections/${USERROLES_COLLECTION}/documents/${roleDoc.$id}`,
        "PATCH",
        { data: updateData }
      );
      if (upd.status !== 200) return json({ error: "No se pudo actualizar" }, 500);
      return json({ ok: true });
    }

    // ===== ELIMINAR USUARIO =====
    if (path.startsWith("users/") && method === "DELETE") {
      const targetId = path.split("/")[1];
      const roleDoc = await getRoleByUserId(targetId);
      if (!roleDoc) return json({ error: "Usuario no encontrado" }, 404);

      // LÍDER: NO puede eliminar usuarios
      if (isLider) return json({ error: "Un líder no puede eliminar usuarios" }, 403);

      // eliminar de userroles
      const delRole = await appwriteFetch(
        `/databases/${DB_ID}/collections/${USERROLES_COLLECTION}/documents/${roleDoc.$id}`,
        "DELETE"
      );
      // eliminar de Auth (API key del backend)
      const delAuth = await appwriteFetch(`/users/${targetId}`, "DELETE");
      if (delRole.status !== 204 && delRole.status !== 200) {
        return json({ error: "No se pudo eliminar el registro de rol" }, 500);
      }
      return json({ ok: true });
    }

    return json({ error: "Ruta no encontrada" }, 404);
  } catch (e) {
    console.error("ERROR handler:", e);
    return json({ error: "Error interno" }, 500);
  }
}
