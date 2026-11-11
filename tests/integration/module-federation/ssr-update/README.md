# SSR update integration

These checks migrate the earlier SSR update proof of concept to the built-in Modern MF plugin and the current application runtime. They use real production bundles and the Node HTTP server. They do not implement automatic producer discovery or development browser notifications.

Build the task's Rspack native binding and JavaScript packages, MF Core packages, and Modern packages first. Install the locally packed Rspack and MF packages through temporary pnpm overrides in the isolated Modern checkout. Keep the native binding paired with its Rspack JavaScript package. Local package paths and generated validation lockfiles must not be committed as release dependencies.

The host enables `moduleFederation.ssr.cacheUpdates`. The low-level `createSSRUpdateAdapter` export from `@modern-js/plugin-module-federation/ssr-update` is connected explicitly to `createProdServer({ ssrApplication })` for this experimental integration. It retains the proof of concept's revision-based API. The final framework-bound update API and update source are separate work.

Allocate and supervise the test's `HOST` and `ASSETS` ports before starting it. The runners read the actual allocated ports from `JO_PORT_HOST` and `JO_PORT_ASSETS`.

Run `static.test.cjs` with `node --test` in each of these modes:

- Default named modules
- `SSR_STATIC_NUMERIC=1` for numeric IDs and minification
- `SSR_STATIC_OPTIMIZE=1` for concatenated and minimized modules

The static test checks selective publication across affected entries, independent module state and cache preservation, in-flight producer drain, failed publication recovery, and whole-application rebuilding after dynamic consumption.

Run `node --expose-gc production.cjs` for actual Modern builds, HTTP rendering, browser hydration, cancellation and repeated updates. Set `PUPPETEER_EXECUTABLE_PATH` if Chrome is not installed in Puppeteer's cache. The runner records resolved package roots and versions in `packages.json`, and update timing and memory observations in `metrics.json` under the printed fixture directory.

The production test keeps an existing browser on its original release, hydrates saved old HTML after the server changes, checks the update-time CSR shell, and verifies that loader work remains owned after a response disconnects. At least 70 updates run in the same process and on the same listening port. Memory observations describe this fixture and do not establish a process memory bound or cleanup of arbitrary business side effects.

Run `node bridge.cjs` with a separately allocated `HOST` and `ASSETS` pair for the current Modern Bridge application path. This builds both producer versions and the Host, disconnects a request whose producer loader is still running, and verifies that invalidation waits for that original work. It then checks that the Modern root and application context are recreated, a new page hydrates v2, and both an existing browser and saved old HTML retain interactive v1. The runner saves its package audit, update result and browser resource requests in `result.json` under the printed fixture directory.
