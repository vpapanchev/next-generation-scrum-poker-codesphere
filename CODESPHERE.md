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
| Deploy config | `ci.yml`                                                                                                 | One Reactive service plus the Workspace Router.                                                                                |

DynamoDB-specific behaviour that is lost: TTL deletion is emulated with a
60-second sweep, and **all state disappears on restart/redeploy**. Groups and
votes do not survive a Sync.

## Deploy

1. Push this repository (or branch) to a git remote the workspace can reach.
2. In the Codesphere workspace, open the CI/Landscape config and let it pick up
   `ci.yml` from the repository root.
3. Set the service availability to **Always on**. Do not use "Off when unused":
   the service would be scaled to zero and open WebSocket connections would drop.
4. Click **Sync**. The `prepare` stage installs dependencies and builds the
   frontend, then the landscape provisions `scrum-poker` and `cs-router`.
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

- **Unknown `plan` IDs.** Plan IDs are per installation. `20` and `101` come from
  the Codesphere docs fixtures. Pick a plan in the UI and let it rewrite
  `ci.yml` if Sync rejects them.
- **`node` too old or missing in `prepare`.** Vite 8 needs Node >= 20.19. Add a
  first prepare step: `nix-env -iA nixpkgs.nodejs_22`.
- **WebSocket upgrade does not survive the router.** The router is supposed to
  pass upgrades through. If it does not, fall back to exposing the port
  directly: set `network.ports` to `[{ port: 3000, isPublic: true }]`, re-run
  `prepare` with `API_URL=<the public wss URL>` instead of `''`, and drop the
  runtime fallback.
- **`/healthz` is fine but the page 503s.** `STATIC_DIR` does not point at the
  build output. It is resolved relative to the service working directory
  (`frontend/dist` by default).
