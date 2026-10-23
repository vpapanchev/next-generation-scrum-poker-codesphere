# next-generation-scrum-poker

Prototype for a new Scrum Poker

## Why this fork exists

This repository is a fork of [tng/next-generation-scrum-poker](https://github.com/tng/next-generation-scrum-poker),
used as a proof of concept for running the app on [Codesphere](https://codesphere.com).
It is not intended to be merged back upstream.

Upstream deploys to AWS (API Gateway WebSocket + Lambda + DynamoDB). This fork
replaces that with a single Node process that fits a Codesphere landscape: one
HTTP server serves the built frontend and the WebSocket endpoint on the same
origin, and application state lives in process memory instead of DynamoDB.

- `ci.yml` — the Codesphere landscape definition
- [`CODESPHERE.md`](CODESPHERE.md) — what changed, how to deploy, known limits

## Development

To test and develop backend and frontend, run

```shell
npm start
```

This launches the local WebSocket gateway on port 8080. State is kept in memory,
so no database or Docker daemon is needed.

In parallel, it will use [Vite](https://vitejs.dev) to serve your app on [http://localhost:5175](http://localhost:5175). Vite will automatically update the browser via hot module reloading on save while providing extremely fast rebuilds.

## Production Build

To generate a production build for the frontend, run

```sh
API_URL=wss://my.api.gateway.com npm run build:frontend
```

replacing the API gateway with your production gateway. If you do not specify it, the development gateway will be used.

This will generate a folder `frontend/dist` that contains a directly deployable artifact without external dependencies that can be served as a static website.

To test the production build locally, run

```shell
npm run preview
```

Note that you can also specify an `API_URL` for `npm start` and `npm run preview`.

To build the backend, run

```shell
npm run build:backend
```

which will generate `build` folders for each backend function that can be deployed as AWS lambda functions.

## Tests

To run the frontend unit tests via [Vitest](https://vitest.dev), run

```shell
npm test
```

To run all E2E tests via [Playwright](https://playwright.dev), install playwright first once with `npx playwright install`, then run

```shell
npm run e2e
```

The tests start the local backend and frontend automatically; if they are already running, Playwright reuses them. Work on single E2E tests with

```shell
npm run e2e:ui
```

which will start the Playwright test runner in UI mode. You can then select the tests you want to run and also watch tests.

To debug a test in the browser, run

```shell
npx playwright test <test-file-name.spec.ts> --debug
```

## License

[Licensed under Apache License Version 2.0](LICENSE)
