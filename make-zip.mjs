// Crea rutanegra-deploy.zip con el sitio compilado (dist/) + functions + config.
// NO excluye dist/: el navegador carga dist/assets/index-*.js (frontend compilado).
// La Function se entrega como netlify/functions/auth.cjs (CJS autocontenido con pg inline),
// generado por build-function.mjs. No se incluye node_modules ni auth.mjs (fuente).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ZipArchive } from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "rutanegra-deploy.zip");

const EXCLUDE_ROOT_DIRS = new Set([
  "node_modules", // raíz: no va (es giant)
  ".git",
  ".netlify",     // cache local de Netlify CLI — no subir
  "dist-zip",
  "tmp",
]);
const EXCLUDE_ROOT_FILES = new Set([
  ".env",
  ".env.example",
  ".DS_Store",
  "rutanegra-deploy.zip",
  "make-zip.mjs",
  "build-function.mjs",
  "package-lock.json",
  "smoke.mjs",
  "smoke2.mjs",
]);

// Archivos/dirs dentro de netlify/functions que NO van al ZIP
// (auth.mjs es fuente; auth.cjs es el bundle; node_modules ya no se usa)
const EXCLUDE_FUNCTIONS = new Set(["auth.mjs", "node_modules"]);

const out = fs.createWriteStream(OUT);
const archive = new ZipArchive({ zlib: { level: 9 } });
archive.pipe(out);

function walk(dir, base) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (!base) {
      if (EXCLUDE_ROOT_DIRS.has(entry.name)) continue;
      if (EXCLUDE_ROOT_FILES.has(entry.name)) continue;
    }
    if (base === "netlify/functions" && EXCLUDE_FUNCTIONS.has(entry.name)) continue;
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
