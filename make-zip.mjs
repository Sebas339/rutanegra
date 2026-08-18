// Crea rutanegra-deploy.zip con el sitio compilado (dist/) + functions + config.
// NO excluye dist/: el navegador carga dist/assets/index-*.js (frontend compilado).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ZipArchive } from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "rutanegra-deploy.zip");

// Solo excluimos lo que NO debe subirse nunca.
// Excepción: netlify/functions/node_modules SÍ se incluye (pg en CJS, requerido en runtime).
const EXCLUDE_ROOT_DIRS = new Set([
  "node_modules", // raíz: no va (es giant). Solo va netlify/functions/node_modules
  ".git",
  ".netlify",     // cache local de Netlify CLI (incluye .netlify/db) — no subir
  "dist-zip",
  "tmp",
]);
const EXCLUDE_ROOT_FILES = new Set([
  ".env",
  ".env.example",
  ".DS_Store",
  "rutanegra-deploy.zip",
  "make-zip.mjs",
  "package-lock.json",
  "smoke.mjs",
  "smoke2.mjs",
]);

const out = fs.createWriteStream(OUT);
const archive = new ZipArchive({ zlib: { level: 9 } });
archive.pipe(out);

function walk(dir, base) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    // En la raíz excluimos node_modules/dist; pero permitimos
    // netlify/functions/node_modules (pg empaquetado para runtime).
    if (!base) {
      if (EXCLUDE_ROOT_DIRS.has(entry.name)) continue;
      if (EXCLUDE_ROOT_FILES.has(entry.name)) continue;
    }
    if (entry.isDirectory()) {
      walk(full, rel);
    } else {
      if (EXCLUDE_ROOT_FILES.has(entry.name)) continue;
      archive.file(full, { name: rel });
    }
  }
}
walk(__dirname, "");
archive.finalize();
out.on("close", () => {
  console.log(`ZIP creado: ${OUT} (${archive.pointer()} bytes)`);
});
