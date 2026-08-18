// Crea rutanegra-deploy.zip con el sitio compilado (dist/) + functions + config.
// NO excluye dist/: el navegador carga dist/assets/index-*.js (frontend compilado).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ZipArchive } from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "rutanegra-deploy.zip");

// Solo excluimos lo que NO debe subirse nunca
const excludeDirs = new Set(["node_modules", ".git", ".netlify", "dist-zip"]);
const excludeFiles = new Set([
  ".env",
  ".env.example",
  "rutanegra-deploy.zip",
  "make-zip.mjs",
  "package-lock.json", // opcional: Netlify reinstala. Quitar si quieres mas ligero.
]);

const out = fs.createWriteStream(OUT);
const archive = new ZipArchive({ zlib: { level: 9 } });
archive.pipe(out);

function walk(dir, base) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (excludeDirs.has(entry.name)) continue;
    if (excludeFiles.has(entry.name)) continue;
    if (entry.isDirectory()) {
      walk(full, rel);
    } else {
      archive.file(full, { name: rel });
    }
  }
}
walk(__dirname, "");
archive.finalize();
out.on("close", () => {
  console.log(`ZIP creado: ${OUT} (${archive.pointer()} bytes)`);
});
