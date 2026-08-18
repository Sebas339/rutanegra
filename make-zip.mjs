// Crea rutanegra-deploy.zip con solo el código fuente (sin node_modules/dist/.git/.env)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ZipArchive } from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "rutanegra-deploy.zip");

const excludeDirs = new Set(["node_modules", "dist", ".git", ".netlify", "dist-zip"]);
const excludeFiles = new Set([".env", "rutanegra-deploy.zip", ".env.example", "make-zip.mjs"]);

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
