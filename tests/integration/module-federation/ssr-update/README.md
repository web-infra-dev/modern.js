# SSR update integration

These checks cover the built-in Modern MF plugin and the current application runtime. The production runners use real built bundles and the Node HTTP server. The development runner starts separate producer and consumer `modern dev` processes and exercises automatic updates through source edits.

Build the task's Rspack native binding and JavaScript packages, MF Core packages, and Modern packages first. Install the locally packed Rspack and MF packages through temporary pnpm overrides in the isolated Modern checkout. Keep the native binding paired with its Rspack JavaScript package. Local package paths and generated validation lockfiles must not be committed as release dependencies.

The host enables `moduleFederation.ssr.cacheUpdates`. The original static, production and Bridge runners connect the low-level `createSSRUpdateAdapter` to `createProdServer({ ssrApplication })` to exercise ownership and cache behavior directly. `formal-production.cjs` covers the application-bound `@modern-js/runtime/mf` APIs through the service-lifetime server plugin. The development runners use the automatically installed plugin and its build subscriptions or request-time manifest fallback.

Allocate and supervise the test's `HOST` and `ASSETS` ports before starting it. The runners read the actual allocated ports from `JO_PORT_HOST` and `JO_PORT_ASSETS`.

Run `node formal-production.cjs` to check the public asynchronous `shouldUpdateRemote` and `updateRemotes` APIs against a fixed manifest URL, no-op detection, rollback to a previous deployment and synchronous `after-response` receipts. Its request-context check rejects a normal update that would wait for its own request to drain.

Run `node identity.cjs` with a registered `HOST`, `HOST_B` and `ASSETS` group to build two same-name hosts with distinct build IDs and consume two versions of the same provider. Updating and closing one host must preserve the other host's active request, runtime object, remote cache and rendered output. The request-bound API must select its own manager, while a background call using the ambiguous application name must reject. After both hosts consume v2, moving one back to v1 must preserve the other's v2 provider. The remaining host must still update after its sibling closes. Finally, every captured provider must complete disposal and the fixture's instance, shared and snapshot roots must be released.

Run `static.test.cjs` with `node --test` in each of these modes:

- Default named modules
- `SSR_STATIC_NUMERIC=1` for numeric IDs and minification
- `SSR_STATIC_OPTIMIZE=1` for concatenated and minimized modules

The static test checks selective publication across affected entries, independent module state and cache preservation, in-flight producer drain, failed publication recovery, and whole-application rebuilding after dynamic consumption.

Run `node --expose-gc production.cjs` for actual Modern builds, HTTP rendering, browser hydration, cancellation and repeated updates. Set `PUPPETEER_EXECUTABLE_PATH` if Chrome is not installed in Puppeteer's cache. The runner records resolved package roots and versions in `packages.json`, and update timing and memory observations in `metrics.json` under the printed fixture directory.

The production test keeps an existing browser on its original release, hydrates saved old HTML after the server changes, checks the update-time CSR shell, and verifies that loader work remains owned after a response disconnects. At least 70 updates run in the same process and on the same listening port. Memory observations describe this fixture and do not establish a process memory bound or cleanup of arbitrary business side effects.

Run `node bridge.cjs` with a separately allocated `HOST` and `ASSETS` pair for the current Modern Bridge application path. This builds both producer versions and the Host, disconnects a request whose producer loader is still running, and verifies that invalidation waits for that original work. It then checks that the Modern root and application context are recreated, a new page hydrates v2, and both an existing browser and saved old HTML retain interactive v1. The runner saves its package audit, update result and browser resource requests in `result.json` under the printed fixture directory.

## Development source updates

`subscriptions.cjs` uses direct producer manifest addresses, with `dts: false` on every app. Allocate `HOST`, `PROVIDER` and `BROKER` ports, reserving the default broker port 16322. The nested mode also needs `MIDDLE`. Run these modes independently:

```sh
node tests/integration/module-federation/ssr-update/subscriptions.cjs ordinary
node tests/integration/module-federation/ssr-update/subscriptions.cjs nested
node tests/integration/module-federation/ssr-update/subscriptions.cjs bridge
node tests/integration/module-federation/ssr-update/subscriptions.cjs service
node tests/integration/module-federation/ssr-update/subscriptions.cjs service-csr
node tests/integration/module-federation/ssr-update/subscriptions.cjs build-serve
```

Ordinary and nested modes deliberately start the consumer before its producer, require initial SSR preparation to fail, then verify recovery without a consumer rebuild. An independent subscriber waits for the Host to publish the applied provider version before the test sends its next HTTP request. Component dependencies, loader-only edits and component function edits must produce current SSR and interactive browser content. Ordinary, nested and Bridge modes require the same document and preserved counter state. Service and static-producer modes require a new document after each update. Bridge and Service modes also unmount and remount the updated remote.

The nested fixture is A→B→C. Changing A must reach C while the build versions of B and C remain unchanged. `build-serve` serves real production producer artifacts through a static HTTP server with an explicit CORS allowance for the consumer. Rebuilding that producer produces no development notification. The next Host HTTP request must update its Node graph and trigger browser reload.

The default browser driver uses the workspace Puppeteer dependency. `MF_DEV_BROWSER_DRIVER` can select an absolute path to a driver factory with `open`, `evaluate`, `click` and `close` methods for another browser environment. `MF_DEV_NO_BROWSER=1` runs only the Node assertions and does not establish browser behavior. Each fixture retains package roots, publications, source-edit results, browser state and process logs in its temporary directory.

### Manifest gateway fallback

Allocate and supervise a separate `HOST`, `PROVIDER` and `MANIFEST` port group. After the workspace packages are built and their local dependencies installed, run:

```sh
node tests/integration/module-federation/ssr-update/dev.cjs ordinary
node tests/integration/module-federation/ssr-update/dev.cjs bridge
node tests/integration/module-federation/ssr-update/dev.cjs service
node tests/integration/module-federation/ssr-update/dev.cjs service-csr
```

Omitting the argument runs Bridge and Service SSR sequentially. Run `service-csr` separately for a Service consumer with `server.ssr: false`. The runner requires `JO_PORT_HOST`, `JO_PORT_PROVIDER` and `JO_PORT_MANIFEST` and keeps its source copies, writable build caches and browser profile inside a temporary fixture directory. It links the existing workspace packages and does not install packages or run a production build. It verifies the advertised app ports and its manifest gateway listener against the allocated values.

Both apps enable `moduleFederation.ssr.cacheUpdates`. The gateway address differs from the producer's published identity, so this runner exercises request-time fallback. The producer manifest URL remains unchanged throughout the run. The test edits the producer's component, loader and CSS sources, including separate CSS-only and loader-only changes, a syntax error followed by repair, and consecutive saves. Each update sends an HTTP request and requires the already-open browser to reload into an interactive document. SSR modes also require new HTTP SSR content. The ordinary mode uses a static React component import and a separately imported remote loader, requiring their direct HTML markers with no Bridge frames. Bridge and Service SSR decode the Bridge HTML frames and require the producer's component and loader markers before browser hydration. Compiler IDs and manifest content versions are recorded separately. The test never calls the update adapter or reloads the browser to make the assertion pass. A compilation error must keep the producer manifest unavailable with HTTP 503 and `no-store`, must not trigger document reload, and completed updates must settle without a reload loop.

The CSR consumer must return an HTML shell without provider SSR frames. The browser must then make a real Service HTTP request whose NDJSON HTML frames contain the requested component and loader versions. Every update requires a fresh matching Service response after the source edit, including CSS-only changes. Browser appearance alone cannot satisfy this assertion, and these results do not claim Host SSR support.

The manifest gateway forwards the producer's real manifest without modification. Only the Service mismatch case briefly holds the previous manifest to model delayed discovery. The runner pauses an actual browser Service POST, edits the producer, waits for its successful compilation and releases the unchanged POST. The new producer must reject its old build identity with the reserved typed 409 protocol through Modern's ingress. Manifest visibility resumes when that response arrives, and the consumer must automatically update and reload into interactive SSR without looping. Assets and Service requests always reach the real producer, and the runner clears the manifest hold and pending request on failure or cancellation.

`packages.json` records the resolved compiler, native binding and MF package roots. `provider.log`, `host.log` and `result.json` retain process ownership, source-edit results, manifest fingerprints and build versions, runtime identity evidence, actual document navigation counts and Service HTTP observations. `last-ssr.html` saves the last raw HTTP body even on failure, and successful SSR responses are retained by component and loader version. These development checks are separate from the production release-retention assertions above.
