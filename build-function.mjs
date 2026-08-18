// Construye la Netlify Function como un unico archivo CJS autocontenido.
// pg se empaqueta (bundle) adentro, asi funciona en deploy por ZIP sin node_modules.
// Netlify sirve netlify/functions/auth.cjs como la funcion "auth" en /.netlify/functions/auth
import { build } from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(__dirname, "netlify/functions/auth.mjs");
const out = path.join(__dirname, "netlify/functions/auth.cjs");

await build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  outfile: out,
  // sin externos: pg y todo se incluye inline
});

const sz = fs.statSync(out).size;
console.log(`Function bundlizada: ${out} (${(sz / 1024).toFixed(1)} KB, pg inline)`);
