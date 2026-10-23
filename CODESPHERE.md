# Deploying this fork on Codesphere

This fork is a **PoC** for running the scrum poker on Codesphere. It is not meant
to be merged back upstream — the AWS deployment path (Lambda + API Gateway +
DynamoDB) is intentionally traded for a single-process setup.

## What changed compared to upstream

| Area          | Change                                                                                                   | Why                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| State         | `backend/shared/database/*` now uses an in-memory store (`store.ts`) instead of DynamoDB                 | No Docker daemon in a Codesphere workspace, and no managed DynamoDB. Avoids a second service and a cross-service database URL. |
| Server        | `backend/local/server.ts` serves `frontend/dist` **and** the WebSocket endpoint `/ws` on one HTTP server | Single port, single origin. No CORS, no mixed-content, no build-time URL guessing.                                             |
| Binding       | Server listens on `0.0.0.0`, port from `PORT` (default 3000)                                             | The original local server bound to `localhost:8080`, which is unreachable from outside the pod.                                |
| Frontend URL  | `frontend/src/config.ts` falls back to `wss://<current host>/ws` when `API_URL` is empty                 | Same-origin deployment without baking the Codesphere domain into the build.                                                    |
| Health        | `/healthz`                                                                                               | Used as the `healthEndpoint` in `ci.yml`.                                                                                      |
| Deploy config | `ci.yml` (schema `v0.2`)                                                                                 | One Reactive service, routed at `/` via `isPublic` + `network.path`.                                                           |

DynamoDB-specific behaviour that is lost: TTL deletion is emulated with a
60-second sweep, and **all state disappears on restart/redeploy**. Groups and
votes do not survive a Sync.

## Why schema v0.2

The platform behind this workspace rejects `schemaVersion: v0.5` with a parser
error (`expected ... { "steps", "healthEndpoint" } | literal | literal | literal`),
so this landscape uses the schema that a working `ci.yml` in the same
installation uses: **v0.2**. That means:

- no `type: router` service — routing is per service via `isPublic` and
  `network.path`
- no `volumeMounts` — the workspace is available at `/home/user/app` already
- small plan ids such as `plan: 8`

## Deploy

1. Push this repository (or branch) to a git remote the workspace can reach.
2. In the Codesphere workspace, open the CI/Landscape config and let it pick up
   `ci.yml` from the repository root.
3. Set the service availability to **Always on**. Do not use "Off when unused":
   the service would be scaled to zero and open WebSocket connections would drop.
4. Click **Sync**. The `prepare` stage installs dependencies and builds the
   frontend, then the landscape provisions the `scrum-poker` service.
5. Open the Landscape domain. Confirm `/healthz` returns `ok` first.

Whenever dependencies, build steps or `ci.yml` change, run `prepare` again and
re-Sync.

## Known limits

- **One replica only.** Connection IDs are resolved against sockets held in
  process memory, so a second replica cannot deliver messages to clients
  connected to the first. A production version needs shared pub/sub and shared
  state (e.g. Valkey + a real database).
- No persistence. Restarting the service clears every group.
- The AWS Lambda entry points (`backend/*/src/app.ts`) still compile, but the
  database functions no longer talk to DynamoDB, so the AWS deployment path is
  broken by design.

## Local check (without Docker)

```sh
npm ci
API_URL='' npm run build:frontend
PORT=3000 npm run start:codesphere
# then open http://localhost:3000
```

The original development flow (`npm start`, Vite on 5175 + backed by
dynamodb-local in Docker) is unchanged for the database-free parts, but the
backend no longer needs a database.

## If the first Sync does not go through

- **Parser error about the schema.** This installation only understands older
  `schemaVersion` values. `v0.2` is the one proven to work here; do not bump it
  to `v0.5` just because the public docs show it.
- **`node` too old or missing in `prepare`.** Vite 8 needs Node >= 20.19. The
  `Ensure Node.js` step installs `nixpkgs.nodejs_22` in that case.
- **WebSocket upgrade fails behind the path route.** Re-run `prepare` with
  `API_URL=<the public wss URL>` instead of `''` (the frontend then no longer
  derives the URL at runtime), or expose the port directly with the advanced
  network shape (`network.ports`) and use that URL.
- **`/healthz` is fine but the page 503s.** `STATIC_DIR` does not point at the
  build output. It is resolved relative to the service working directory
  (`frontend/dist` by default).
