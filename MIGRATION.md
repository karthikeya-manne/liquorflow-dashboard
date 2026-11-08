# LiquorFlow: Firestore → MongoDB

## Authentication architecture (unchanged)

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Frontend | Firebase Auth SDK (`src/lib/firebase.ts`, `auth-context.tsx`) | Email/password signup, login, logout, password reset, profile password change |
| Backend | Firebase Admin SDK (`backend/src/config/firebase.ts`) | Verify `Authorization: Bearer <ID token>` on every `/api/*` route |
| Application data | MongoDB Atlas | Shops, products, sales, invoices, orders — keyed by `ownerUid` (Firebase UID) |

Passwords and Firebase credentials are **not** stored in MongoDB. Shop access is enforced server-side via `shops.ownerUid === verified UID` (`getAuthorizedShop`). There is no multi-admin / shared-shop model in the current codebase—only shop owners.

Firestore is no longer used for shop workflows. Legacy `users/{uid}/products` remains only in deprecated demo helpers under `src/lib/firestore/`.

## Local dev: OneDrive / `node_modules` errors

If `npm run dev` fails with **“The cloud operation was unsuccessful”** or missing `@firebase/*` files, OneDrive Files On-Demand often leaves `node_modules` as online-only placeholders.

1. Right-click the project folder → **Always keep on this device** (or move the repo outside `OneDrive`).
2. Delete and reinstall deps:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```
3. The frontend uses **Firebase Auth only** (no Firestore SDK in the bundle). Shop data goes through `VITE_API_BASE_URL`.

## Prerequisites

- MongoDB Atlas cluster (replica set — required for multi-document transactions)
- Firebase project with **Authentication** (client) and **Admin service account** (API + migration)
- Node.js 20+

## 1. Backend environment

```bash
cd backend
cp .env.example .env
```

Fill `backend/.env`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB_NAME` | e.g. `liquorflow` |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Private key (use `\n` for newlines in `.env`) |
| `PORT` | Default `5000` |
| `CLIENT_ORIGIN` | Frontend URL, e.g. `http://localhost:5173` |

```bash
npm install
npm run dev
```

Health check: `GET http://localhost:5000/health`

### Troubleshooting: frontend shows `Failed to fetch` / create shop fails

The UI calls `VITE_API_BASE_URL` (default `http://localhost:5000`). If the API is down, every shop action fails.

1. In a **second terminal**: `cd backend` → `npm run dev`. You must see `LiquorFlow API listening on ...:5000`.
2. Open `http://localhost:5000/health` in the browser — should return JSON, not “can’t connect”.
3. Add your dev origin to `CLIENT_ORIGIN` in `backend/.env` (e.g. `http://localhost:8081` if Vite picked port 8081), then restart the API.
4. If the API exits with **SSL / `tlsv1 alert internal error`**: fix Atlas **Network Access** (your IP), ensure the cluster is **not paused**, and confirm the database user password in `MONGODB_URI`. Test the same URI in **MongoDB Compass**.

## 2. Frontend environment

In project root `.env` (see `.env.example`):

```
VITE_API_BASE_URL=http://localhost:5000
```

Keep existing `VITE_FIREBASE_*` values for login.

```bash
npm install
npm run dev
```

## 3. Migrate Firestore data (mandatory before cutover)

Read-only on Firestore; writes only to MongoDB.

```bash
cd backend
npm run migrate -- --dry-run
npm run migrate
```

Options:

- `--dry-run` — report counts without writing
- `--collection=shops|products|sales|invoiceHistory|orders` — partial run

Re-runs are idempotent (skips documents with matching `legacyFirestoreId`).

### Post-migration checks

- Compare shop, product, and sale counts in Atlas vs Firestore console
- Spot-check a shop’s products and recent sales totals
- Log file: console summary table from the script

## 4. Production

1. Deploy API (Railway, Render, Fly.io, VPS, etc.) with backend env vars
2. Set `CLIENT_ORIGIN` to your Vercel/production frontend URL
3. Set `VITE_API_BASE_URL` on the frontend build to the API URL
4. Atlas → Network Access: allow API host IPs or `0.0.0.0/0` (restrict when possible)

### Android (Capacitor)

Use your production API URL in `.env` for release builds (not `localhost`).

## 5. Rollback

1. Remove or unset `VITE_API_BASE_URL` and redeploy frontend (legacy Firestore paths remain in `use-products` / template routes only)
2. Firestore data is never deleted by the migration script
3. MongoDB can be left as-is for a later retry

## Schema mapping

| Firestore | MongoDB collection | ID mapping |
|-----------|-------------------|------------|
| `shops/{id}` | `shops` | `legacyFirestoreId` |
| `shops/{id}/products/{pid}` | `products` | `shopId` + `legacyFirestoreId` |
| `shops/{id}/sales/{sid}` | `sales` | `shopId` + `legacyFirestoreId` |
| `shops/{id}/invoiceHistory/{iid}` | `invoiceHistory` | `shopId` + `legacyFirestoreId` |
| `shops/{id}/orders/{oid}` | `orders` | `shopId` + `legacyFirestoreId` |

API routes accept `shopId` as the **Firestore shop document ID** (`selectedShopId` in localStorage) for backward compatibility.
