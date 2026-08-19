# Ruta Negra Manizales

Plataforma web para **Ruta Negra Manizales**: muestra rutas/eventos próximos, convenios con empresas aliadas y un panel de administración (usuarios, estadísticas y convenios).

**Live app**: https://rutanegra.netlify.app

## Stack

- **Frontend**: React + Vite + TypeScript (estética oscura, minimalista).
- **Backend**: Netlify Functions (`netlify/functions/auth.mjs`, empaquetado en `auth.cjs`).
- **Base de datos**: PostgreSQL (Netlify Postgres).
- **Rutas protegidas** con JWT (login en `/login`, panel en `/admin/*`).

## Estructura

- `src/pages/Index.tsx` — Home (rutas/eventos + footer redes).
- `src/pages/ConveniosPublic.tsx` — Página pública de convenios (filtro y agrupación por ciudad).
- `src/pages/Convenios.tsx` — Panel admin: crear / editar / eliminar convenios (campo `ciudad` separado de dirección).
- `src/pages/Users.tsx` — Gestión de usuarios (el líder no puede desactivar/eliminar admins).
- `src/components/Navbar.tsx` — Navegación pública (`Inicio | Acceso`, `Convenios | Acceso`) y admin.
- `src/components/Footer.tsx` — Iconos de Instagram y TikTok.
- `netlify/functions/auth.mjs` — API: auth, usuarios, estadísticas y convenios.

## Desarrollo local

Necesitas Node.js y npm.

```sh
npm i
npm run dev
```

## Despliegue

El build del frontend se genera con:

```sh
node build-function.mjs   # regenera netlify/functions/auth.cjs
npm run build             # compila el frontend a dist/
node make-zip.mjs         # empaqueta dist/ + auth.cjs en rutanegra-deploy.zip
```

Sube `rutanegra-deploy.zip` manualmente en Netlify (Site settings → Deploys → Deploy manually).

> Variables de entorno requeridas en Netlify: `DATABASE_URL`, `JWT_SECRET` y `FALLBACK_DATABASE_URL`.
