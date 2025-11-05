# RackRunner

Production-shaped proof of concept for managing hospital meal racks, freezer inventory, and packing plans.

## Monorepo layout

```
apps/
  api/    # Azure Functions + Fastify API
  web/    # Next.js static-export web app
packages/
  db/     # Migration runner (node-postgres)
  types/  # Shared TypeScript definitions
  utils/  # QR helpers
infra/
  azure/  # Function App templates
  dns/    # DNS notes
migrations/
  001_init.sql
```

## Quickstart

1. **Install dependencies**
   ```sh
   pnpm install
   ```
2. **Configure Entra ID**
   - Create an app registration for sandbox with redirect `${SBX_WEB}/auth/callback`.
   - Populate `.env` from `.env.example` with tenant and client details.
3. **Provision sandbox Postgres**
   - Create a database and update `PG*` variables.
   - Run migrations:
     ```sh
     pnpm run migrate:sbx
     ```
4. **Run locally**
   - API: `pnpm --filter @rackrunner/api dev`
   - Web: `pnpm --filter @rackrunner/web dev`
   - Accept camera permissions for the scanner page.
5. **Generate a test QR**
   ```ts
   import { signKv } from "@rackrunner/utils/qr";
   console.log(signKv({ T: "MI", MEAL: "HH", BD: "20251105", SER: "0001" }));
   ```
   Display that string as a QR and scan it in `/scan`.
6. **Manual flow**
   - Scan a rack QR (`signKv({ T: 'RR', ID: 'F-17' })`) to open.
   - Scan meal intake codes 3–5 times.
   - Close the rack to create inventory batches and receive a label data URL.
   - Import packing requirements on `/planner`, allocate FIFO, and observe allocations.

## Scripts

- `pnpm build` – Run build across packages via Turbo.
- `pnpm dev` – Start dev servers in parallel.
- `pnpm lint` – Lint all workspaces.
- `pnpm migrate:sbx` / `pnpm migrate:prod` – Run SQL migrations against sandbox/production.

## CI/CD

- `.github/workflows/web.yml` publishes the web app to GitHub Pages from the `sbx` branch.
- `.github/workflows/api.yml` builds the Azure Functions API and deploys to sandbox (`sbx` branch) or production (`main`).

## Deploy targets

- Sandbox web: https://sbx.paf.tools
- Production web: https://app.paf.tools
- Sandbox API: https://api.sbx.paf.tools
- Production API: https://api.paf.tools
