# LiquorFlow production deployment

Deploy the **frontend** and **backend** as separate services. MongoDB Atlas and Firebase Admin credentials stay on the backend only.

## Directory layout

| Component | Root directory | Package |
|-----------|----------------|---------|
| Frontend (Vite + TanStack Start) | `liquorflow-dashboard-main/` | `package.json` at app root |
| API (Express + MongoDB) | `liquorflow-dashboard-main/backend/` | `backend/package.json` |

## Frontend (e.g. Vercel, Cloudflare Pages, static host)

### Build

```bash
cd liquorflow-dashboard-main
npm ci
npm run build
```

Output: `dist/` (client + server bundles per TanStack Start / Vite).

### Environment (build time)

Set in the hosting dashboard — **never** put Admin SDK secrets here.

| Variable | Example |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase web app |
| `VITE_FIREBASE_AUTH_DOMAIN` | |
| `VITE_FIREBASE_PROJECT_ID` | |
| `VITE_FIREBASE_STORAGE_BUCKET` | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | |
| `VITE_FIREBASE_APP_ID` | |
| `VITE_API_BASE_URL` | `https://api.yourdomain.com` |

Auth uses the Firebase **client** SDK only. All shop data calls `VITE_API_BASE_URL`.

### Commands

- **Build:** `npm run build`
- **Local preview:** `npm run preview` (after build)

## Backend (e.g. Railway, Render, Fly.io, VPS)

### Quick deploy (Railway — recommended)

1. Push `backend/` to GitHub (`liquorflow-dashboard` repo).
2. [Railway](https://railway.app/) → **New Project** → **Deploy from GitHub** → select the repo.
3. **Settings** → **Root Directory** = `backend` (or deploy only the `backend` folder as a service).
4. **Variables** — copy from `backend/.env` (do not commit `.env`):
   - `MONGODB_URI`, `MONGODB_DB_NAME`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (paste key with literal `\n` newlines as in `.env`)
   - `CLIENT_ORIGIN` = your production frontend URL(s), comma-separated
   - Railway sets `PORT` automatically — leave `HOST` unset or `0.0.0.0`
5. **Networking** → generate a public domain (e.g. `https://liquorflow-api.up.railway.app`).
6. Atlas → **Network Access** → allow `0.0.0.0/0` (or Railway’s egress IPs if you restrict later).
7. Smoke test: `GET https://<your-railway-domain>/health`
8. Frontend build env: `VITE_API_BASE_URL=https://<your-railway-domain>` then rebuild/redeploy the frontend.

`backend/Dockerfile` + `railway.toml` are included for Docker-based deploys.

### Quick deploy (Render)

1. Commit and push the repo (including `backend/`) to GitHub.
2. [Render](https://render.com/) → **New** → **Web Service** → connect `liquorflow-dashboard`.
3. **Root Directory:** `backend`
4. **Build:** `npm ci --include=dev && npm run build` · **Start:** `npm start`  
   (`--include=dev` is required on Render so TypeScript is available during build.)
5. **Health Check Path:** `/health`
6. **Environment** (from `backend/.env`, never commit the file):

   | Key | Notes |
   |-----|--------|
   | `MONGODB_URI` | Atlas SRV string |
   | `MONGODB_DB_NAME` | `liquorflow` |
   | `FIREBASE_PROJECT_ID` | Same as web app |
   | `FIREBASE_CLIENT_EMAIL` | Service account |
   | `FIREBASE_PRIVATE_KEY` | One line with `\n` for newlines (Render multiline secret works too) |
   | `CLIENT_ORIGIN` | See Capacitor note below |
   | `HOST` | `0.0.0.0` |

   Render injects `PORT` automatically.

7. Atlas → **Network Access** → allow `0.0.0.0/0` (Render has no fixed egress IP on free tier).
8. After deploy, open `https://<service>.onrender.com/health`.
9. Optional: `backend/render.yaml` can seed a blueprint; secrets still go in the dashboard.

#### Android (Capacitor) + Render API

- Release builds bake in `VITE_API_BASE_URL=https://<your-render-host>` at **build time** (`.env.production` or CI env before `npm run build` + `npx cap sync android`).
- Capacitor native `fetch` often sends **no `Origin` header**; this API allows that. You can still set `CLIENT_ORIGIN=https://localhost` for Capacitor live-reload if you test from a WebView origin.
- Do **not** use `http://localhost:5000` in Play Store builds.

```bash
# Example production Android build (from app root)
# Set VITE_API_BASE_URL in .env.production first
npm run build
npx cap sync android
```

Then smoke-test login → create/select shop on a device with the Render API running.

### Build & start

```bash
cd liquorflow-dashboard-main/backend
npm ci
npm run build
npm start
```

- **Build:** `npm run build` → `dist/`
- **Production start:** `npm start` → `node dist/server.js`
- **Local dev:** `npm run dev` (tsx watch)

Listens on `process.env.PORT` (default `5000`) and `HOST` (default `0.0.0.0`).

### Environment (runtime)

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGODB_URI` | Yes | Atlas connection string — server only |
| `MONGODB_DB_NAME` | Yes | e.g. `liquorflow` |
| `FIREBASE_PROJECT_ID` | Yes | Same project as client Auth |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account |
| `FIREBASE_PRIVATE_KEY` | Yes | Use `\n` for newlines in platform UI |
| `PORT` | No | Set by host (Railway/Render inject this) |
| `HOST` | No | Default `0.0.0.0` |
| `CLIENT_ORIGIN` | Yes | Deployed frontend URL(s), comma-separated |

Example production CORS:

```
CLIENT_ORIGIN=https://app.yourdomain.com,https://www.yourdomain.com
```

### Health check

`GET /health` → `{ "status": "ok" }`

### API surface

- `POST /api/shops` — create shop (Bearer token; `ownerUid` from verified token)
- `GET /api/shops` — list shops for authenticated user
- `GET|PATCH /api/shops/:shopId` — shop profile
- Products, sales, invoices, orders under `/api/shops/:shopId/...`

## Security checklist

- [ ] `.env` and `backend/.env` are **not** in Git (see `.gitignore`)
- [ ] No `firebase-adminsdk*.json` committed — use env vars
- [ ] `VITE_*` contains only Firebase **web** config + public API URL
- [ ] Atlas network access allows backend egress IPs (or `0.0.0.0/0` during setup, then restrict)
- [ ] `CLIENT_ORIGIN` matches exact production frontend origin (scheme + host)

## Post-deploy smoke test

1. Open production frontend → login (Firebase Auth).
2. Network tab: API requests include `Authorization: Bearer …`.
3. Create or select shop → dashboard loads products from API.
4. Complete a test sale → stock and sales history update.
5. `GET https://api.yourdomain.com/health` returns OK.

## Data migration

Run Firestore → MongoDB from a secure machine with Admin credentials — see `MIGRATION.md`. Do not run migration automatically on deploy.
