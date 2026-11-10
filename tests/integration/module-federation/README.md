# Weather Lab

The built-in Modern.js Module Federation playground uses the unified React APIs from `@modern-js/runtime/mf`. The weather UI is the demo and the browser E2E fixture. Old signal pages and their sidebar layout have been removed.

## Run

After installing dependencies and building the Modern.js workspace packages, run from the repository root:

```sh
pnpm --filter mf-lab-tests dev
pnpm --filter mf-lab-tests test
```

Open http://localhost:4300/. Stop the interactive lab with Ctrl+C. Add `--production` to the dev command to inspect production builds. Select an existing Chrome installation with `PUPPETEER_EXECUTABLE_PATH` when needed. `MF_LAB_VERBOSE=1` prints child-process logs.

| Route                                  | Purpose                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                    | Rendering comparison, CSR and SSR weather documents                                                                                          |
| `/data`                                | CSR, SSR, CSR with MF data and SSR with MF data                                                                                              |
| `/advanced`                            | Weather release replacement, data recovery, loader lifecycle, remote data sources and independent weather stations                           |
| `/bridge-ssr/*`                        | Complete remote weather application with overview, forecast details, favorites and real deferred loading and recovery                        |
| `/stores/:storeId/inventory/*`         | Route-mounted product application, automatic basename, host/remote navigation and independent memory cards                                   |
| `/stores/:storeId/retry/*`             | One-time provider failure and retry with isolated neighboring mounts                                                                         |
| `/browser-consumer/{adapter,direct}/*` | Separate React roots consuming a Modern application through the browser adapter or Core without navigation, with a live Host Router observer |
| `/weather`                             | Internal weather document used by the comparison and advanced frames                                                                         |

Advanced frames select their experiment through `/weather?scenario=...`. These share the weather layout and do not add separate demo routes. Removed routes such as `/static`, `/recovery`, `/compare` and `/unified` return 404. Navigation and history are tested from the root Weather Lab.

The public `/bridge-stream`, `/route-exports`, `/bridge-failure` and `/input-forms` routes are removed and return 404. Their contract fixtures live in `fixtures/bridge-contracts` and are copied only into test workspaces. The former three-panel Bridge input demonstration lives there as `/bridge-inputs`, also unavailable in the public lab. The application suite disables those copies to verify the real public route set.

## Independent Service App lab

Service runs allocate a fresh free port group instead of the interactive Weather Lab ports. Start from the repository root:

```sh
node tests/integration/module-federation/scripts/service-lab.mjs
node tests/integration/module-federation/scripts/service-lab.mjs --production
```

The output records the producer, business API, SSR Host and CSR Host ports, their process IDs and access URLs. The same configuration supplies manifest URLs, assets, loader requests, same-origin ingress and HMR. Only processes started by this run are stopped with Ctrl+C.

Both Hosts consume the same route-selected weather application, declared with `isService: true`. The SSR response contains real producer HTML. The CSR Host disables page SSR and requests progressive HTML after mounting. Use `?late=1&delay=5000` to connect after document completion while a slow outlook remains pending. Station props, saved state, navigation and reconnect use the existing application instance. `?multi=1` mounts an independent second instance, `?declarative=1&static=1` selects the declarative/static input combination, and `?declarative=1&memory=1` uses an explicit memory route. Factory cases cover both `createModernReactRemote` with inferred basename and `createReactRemote` with explicit basename.

The producer result cache is explicitly enabled for this fixture. Exact matching page requests can reuse a completed transcript, including ready and updates. Browser ingress uses trusted deployment bindings and keeps the fixture service credential out of browser artifacts. See the [Service App guide](../../../packages/document/docs/en/guides/topic-detail/module-federation/service-app.mdx) for deployment, TLS origin binding, limits and release requirements.

For performance runs, `MF_SERVICE_WEATHER_DELAY=0` removes the station API's deliberate 900 ms wait in the Service lab. Use `delay=0` in the page URL to remove the independent detail delay as well. Record both delayed and zero-delay runs separately. This setting does not change the regular lab.

Fault-only queries `serviceFault=early` and `serviceFault=late` exercise HTTP 503 and a real producer disconnect. Tests release the latter through the existing response gate only after proving interaction. A recovered `csr=1` document is a recovery assertion and is never counted as SSR success.

## Unified API integration

Ordinary and nested weather consumers call `createReactRemote` with functions such as `() => loadRemote('alias/Expose')`. After the function resolves, the framework API selects the renderer from the loaded module's runtime provenance and Snapshot metadata. Components use the existing SSR, hydration, CSS/assets and data-fetch pipeline. Fault wrappers supply request-specific props and data-fetch parameters without mutating a loaded component or server-wide flag.

`Independent weather stations` uses the same factory API and the declarative `ReactRemote` API. Its producer imports `createBridgeComponent` from the framework entry. The manifest marks that expose with `render: 'bridge'` and `isService: false`. Server HTML contains placeholders, and each client mount owns a separate producer Root. Renaming a station preserves its observations, disconnecting destroys it, and reconnecting creates a fresh station. This fixture remains a CSR-only Bridge regression. The full and selected Modern application exports use the SSR adapters described below.

The `/input-forms` fixture covers MF loader functions and synchronous or asynchronous functions returning preloaded MF namespaces or default components. It uses static MF imports for the preloaded values and does not add identity markers. Every ordinary input runs through factory and declarative consumers in both SSR and CSR, preserving local state across props updates. Function inputs are Node-loadable in the SSR cases. A guarded noSSR function fails if called on the server, and Bridge loader inputs still emit server placeholders. Intentional function failures appear only after a user action and exercise retry without disturbing neighboring instances. The matching consumer Runtime supplies provenance for preloaded exports, without producer protocol changes.

Runtime registration and prefetch continue using Enhanced and the existing data-prefetch plugin. The fixture does not call the old `createLazyComponent` consumer API. Each producer has one canonical runtime name with an alias. Registering the same container under multiple names would evaluate a second server entry against an existing instance and can break remote chunk initialization.

The checked-in MF dependencies are pinned to published preview `0.0.0-feat-enhanced-runtime-unification-20261110060527`, including the function-only consumer contract, preloaded-export identity and generated `loadRemote` props inference without a global consumer type registry. Integration apps, examples, runtime peers and the adapter use the same preview. Published-package validation must install from the checked-in lockfile without local Core overrides. This preview includes the shared Router connector, the Bridge SSR engine and unified consumers, the native POP loader-redirect fix, and progressive producer results without a duplicate final snapshot. Release acceptance uses an independent registry installation without local Core overrides, including package exports, generated consumer types and the full development/production suite.

## Bridge application SSR

`WeatherApp` and `ProductApp` use `createModernBridgeComponent`, which binds Modern's `render`, `hydrate` and `renderStream` callbacks. `OrdersApp` passes those same callbacks explicitly to `createBridgeComponent`. Both forms use the shared Core Bridge consumer and stream compositor.

`/bridge-ssr` mounts one complete `provider/WeatherApplication` through `createModernReactRemote` and the function input `() => loadRemote('provider/WeatherApplication')`. The producer export calls `createRoot({ route: '/weather-application' })` and `createModernBridgeComponent`. Its own layout, Router, station loader and pages live in `provider/src/routes/weather-application`. The Host catch-all route supplies the mount prefix, so remote navigation updates the Host URL and browser history.

Start at `/bridge-ssr` or `/bridge-ssr/overview`, save the station, select an hour and adjust the wind. Open `/bridge-ssr/forecast`, filter the five-day list and choose a day. Details such as `/bridge-ssr/forecast/wed` support direct SSR navigation. Save that day and open `/bridge-ssr/favorites` to return to it. Station and day favorites, the filter, selected hour and wind direction belong to the producer layout and survive page navigation, browser back/forward and Host label updates. A document reload or disconnect/reconnect starts a fresh application.

The pages directly reuse `CurrentWeather`, `HourlyWeather`, `DaysWeather` and `WindWeather` from `provider/src/weather-ui.tsx`. Optional controlled props leave existing consumers' defaults intact. Air quality, UV and sunset cards are shared in `weather-cards.tsx`. The original font, cloud SVG, sky, card and responsive styles now live in `provider/src/weather-base.css` and `weather-scene.css`, imported by the application and the original Host weather document. Host navigation, comparison, Inspect and experiment controls remain in Host styles. The standalone producer entry is `http://localhost:4301/weather-application/overview`.

Each forecast detail returns immediate day information plus a deferred `/bridge-data` request. Only the outdoor outlook shows a loading state. The rest of the application remains available. Under “Try the forecast service”, “Load a slow outlook” requests a real delayed API response and “Try a service failure” requests a 503. “Retry outlook” makes a fresh successful request, retaining the layout and selections. Loader signals handle HTTP disconnects. Because a deferred server request can outlive the committed navigation, every outlook also has a unique cancellation token. Page cleanup cancels that pending job through the local API, including an initially streamed SSR job. Tokens are per request and do not affect neighboring mounts. Tests use the existing service gates to control delayed SSR data and verify hydration restores it without another request.

Cancellation and late delivery have separate regressions. The late-delivery test assigns A and B distinct response markers for one request sequence. After A hydrates its pending shell, a document-specific gateway gate buffers the original response tail while the producer finishes A's request. The test requires a real Bridge `update` frame containing A's marker in that buffer, then unmounts A and waits for the remounted application to display B. Only then does it release the unchanged HTTP bytes. A browser observer forwards every frame to the original `window.__MF_BRIDGE_SSR__.accept` and records it after the call returns. The received A update must equal the buffered frame. After the old stream's `done`, B must retain its content, DOM node identities, favorites and hourly selection, with no A content. The test releases both gates and restores the observer in `finally`. It does not disable cancellation or replace Router, Bridge or data restoration.

The original `WeatherApp` remains the full root export. `ProductApp`, `OrdersApp`, component exposes and the selected `CurrentWeatherApp`, `WeatherForecastApp` and `AirQualityApp` keep their existing contracts. The test-only `/bridge-inputs` fixture uses `() => loadRemote(...)` for current weather and forecast, and `() => AirQuality` for the static import. These two function forms use different exposes, with factory and declarative APIs, noSSR and instance controls. Direct string consumption is no longer supported.

`bridge-ssr.test.ts` registers an independent `setupLab` for each API and mode. Every registration creates a temporary workspace and starts fresh provider and Host Node processes. Test-only instrumentation records export and route-page evaluation on the server and in the browser. A test-only query filter first renders no inputs, then static air quality, loaded current weather and loaded forecast in order. Before each step the relevant lazy export/page must not have evaluated, and afterward only the matching weather content and completed SSR frames may appear. Preloading air quality must not evaluate the other exports. The tests also inspect the actual producer scope graphs and all compiled Host remote-module dependencies, including other entries and barrels. The observer neither wraps exports nor bypasses caches, and is absent from the interactive fixture.

HTTP tests decode all three applications' real HTML, `ready` and `done` frames. Browser tests delay the Host entry script, record server DOM nodes and require hydration to retain their identity. Local service counts and browser loader requests distinguish three restored SSR snapshots from the one intentionally client-only request. Props updates retain the existing Root nodes, selected forecast route, saved location and temperature unit. Repeated air-quality mounts have independent state, and disconnect/reconnect destroys only the removed instances. Both APIs run these checks in development and production. The full/selected application, independent hydration, deferred stream, cancellation and late-frame checks remain in `bridge-stream.test.ts`.

The existing development-only `SSRLiveReload` component emits a script during client-only mounting, so React logs “Encountered a script tag while rendering React component”. This is also reproducible on the test-only `/route-exports?csr=1`. The input fixture tests require exactly this one diagnostic in development and zero console errors in production. Unexpected console errors and recoverable hydration errors fail the tests. This fixture does not change the production runtime to silence that existing diagnostic.

The test-only `/bridge-stream` fixture holds one deferred loader at a test-controlled service gate. Another root must become interactive first. Releasing the gate restores deferred data without another loader request. The same fixture checks HTTP disconnect cancellation and ignores late frames after browser unmount. The test-only `/bridge-failure` checks an actual failed Bridge SSR stream and the existing one-time document recovery to `csr=1`, independently of application loader errors and successful SSR assertions.

The optional application isolation fixture adds a Chinese Host and English/French mounts of the same producer, including a client-only mount. It verifies each application's own translations, restored locale, loader data and streamed DOM identity. Route prefetch checks actual producer data requests and route chunks, all three prefetch settings and ordinary Host links. This fixture is copied only for `application-isolation.test.ts`, leaving the interactive demo unchanged.

The first Bridge SSR validation baseline is React and React DOM 19.3.1. Browser Router and explicit `memoryRoute` participate in the SSR cases. Existing Hash navigation remains a CSR regression because HTTP requests do not carry the fragment. The development and production suites require the same React version on the producer server and browser. No React patch or source path rewriting is installed by the adapter.

## Weather scenarios

Rendering compares two iframe documents containing current weather from a Modern producer, hourly weather from a dynamically registered Rslib producer, daily weather through an independent nested Modern build, and wind through nested Modern and dynamic Rslib consumption. Smaller viewports omit the decorative cards to keep the interactive modules visible.

The data page compares four documents. Ordinary client fetching and MF data loading use the same local weather API. SSR with MF data includes the actual result in the response HTML. Data prefetch starts before the CSR remote component renders. It defaults to on, reuses a promise by MF data key within one browser document, evicts failed requests and never caches server requests. Tests verify the real request count with prefetch on and off, fresh requests after reload, and Element Timing under a controlled component-download delay.

Advanced scenarios retain the existing raw runtime registration experiment for switching independently built weather releases. Its rendering-only expose has no data-loader sibling, preserving the original component-only experiment while using the unified consumer. This does not implement the future `updateRemotes` API or promise automatic cache invalidation. Data recovery exercises the client-loader and host-retry paths. Lifecycle compares parent updates with a remote remount and checks the no-data-loader module separately. Remote data sources compare Modern and Rslib server loaders.

## Route-mounted applications

`createModernReactRemote` reads the local Modern route boundary and connects that mount to host history. An E2E host basename of `/admin` and the route `/stores/:storeId/inventory/*` produce `/admin/stores/100/inventory` as the mount prefix. A direct URL is `/admin/stores/100/inventory/detail/42?tab=stock#summary`. The `/product` selector only chooses exported application content. The exported application matches `/detail/42?tab=stock#summary` locally, including the location exposed to its components. Navigation adds or removes only the consumer mount prefix. The standalone producer and server loader data endpoints keep their original paths. Business navigation uses relative links and remains the producer's responsibility.

The adjacent cards use `createReactRemote` with explicit `memoryRoute` and keep independent navigation. The Remote owns product navigation. The Host fieldset is explicitly a routing protocol test harness for push, replace, slow navigation and mount changes. A mount basename is fixed for its lifetime. Changing the matched store ID changes the basename and creates a fresh application, cancelling the old loaders and releasing its subscriptions. Props updates and internal navigation preserve state within the same mount, while adjacent memory cards stay independent. Native back navigation checks both browser loader requests and the local service count to reject duplicate requests or unintended cancellation. Separate React roots cover the real browser adapter and Core consumption without a navigation adapter. Initial redirects must notify the Host even while a loading chunk delays the Remote commit. The direct deep-link cases also hold the Host entry script, verify actual Bridge HTML frames and require the initial remote DOM to survive hydration without a browser loader request. Hash Router coverage uses a CSR host because URL fragments are unavailable during SSR.

## Faults and diagnostics

The comparison pages and advanced experiments expose actual remote HTTP 503, server-rendering, component-rendering, weather API and invalid-response failures. Nested weather also supports an inner remote HTTP failure. Clearing a fault reloads its isolated document. Recovery badges only appear after a real recovery path reports an event.

`createReactRemote` supplies the consumer error fallback. MF runtime hooks remain visible for remote loading failures. React still reports errors for intentionally failed streaming boundaries. Data-prefetch failures may also report the existing rejected data-loader promise. Fault tests check the specific errors and counts. Other page errors fail the tests, and no global suppression is used.

Inspect defaults to off and uses the existing runtime `onLoad` decorator. Labels identify each ordinary remote, its manifest and nested chain. Producer colors are shared across frames and survive reloads. Toggling Inspect must preserve remote state and data requests. Bridge provider factories are excluded from the component decorator using manifest protocol metadata.

The local API returns deterministic weather after 900 ms and assigns a request ID. Interactive ports are 4300 for the gateway, 4306 for the API and 4307 for the underlying host. Provider and library version-two builds use separate origins. Weather SVGs, remote station images, CSS and cloud imagery are local. No public weather, font or image service is required.

## Timing metrics

`Data visible` measures the later first paint of the actual temperature and condition through Element Timing. Placeholders and error cards do not create this metric. Browsers without Element Timing show a visibility estimate marked `≈`.

`Client ready` records key weather controls completing hydration or mounting through their effects. Interaction remains verified by saving a station, choosing an hourly forecast and adjusting the wind. These are diagnostic observations, not a performance ranking.

The script-delay control delays the actual host entry request by 0, 1500 or 3000 ms with caching disabled. Tests hold that request while checking server-painted weather and disabled controls, then release it and verify hydration and interaction. Frame messages validate origin and source, and a handshake replays metrics painted before the parent UI mounts.

## E2E mapping

| File                            | Coverage                                                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rendering.test.ts`             | Ordinary SSR, remote CSS and image origins, dynamic hourly interactions, nested daily weather, nested wind, root navigation/history, removed-route 404s, custom manifests and dev remote revalidation  |
| `data-fetch.test.ts`            | Modern and Rslib data sources, host query forwarding, client/host recovery, rerender/remount, no-data-loader behavior and actual prefetch effects                                                      |
| `comparison.test.ts`            | Two/four weather panels, raw SSR differences, local requests, script delay, Element Timing, visibility estimates and desktop bounds                                                                    |
| `inspect.test.ts`               | Real remote identities, expandable nested chains, consistent colors, state/request preservation and data-frame inspection                                                                              |
| `advanced.test.ts`              | Independent producer release replacement and experiment isolation                                                                                                                                      |
| `error-recovery.test.ts`        | HTTP/render/data failures, handling events, interactive neighbors and recovery after clearing faults                                                                                                   |
| `unified.test.ts`               | Weather expose protocols, factory/declarative Bridge stations, server placeholders, independent state, prop updates and destroy/remount through Advanced                                               |
| `input-types.test.ts`           | Actual MF producer/consumer API type generation, Modern public factories and declarative consumer, strict ESM/CJS positive and negative props/export checks                                            |
| `input-forms.test.ts`           | Literal and function inputs, preloaded namespace/default values, SSR/CSR, noSSR deferral, Bridge placeholders, props/state and retry parity                                                            |
| `activation.test.ts`            | Real CLI activation, disabling, config/dependency errors, legacy coexistence, DTS output and native ESM builds                                                                                         |
| `route-navigation.test.ts`      | Host basename, deep links, query/hash, local selected-app paths, bidirectional history, basename remounts, props/internal-navigation state, retries, loader cancellation and memory isolation          |
| `route-scope.test.ts`           | Actual compiler dependency graphs, full and selected app exports, ancestor and dynamic child loaders, error recovery, state updates and instance isolation                                             |
| `bridge-ssr.test.ts`            | Separate-process cold input resolution for both APIs, compiled dependency graphs, weather HTML/frames, delayed Host script, DOM identity, restored data, props/Router/state, repeated mounts and noSSR |
| `weather-application.test.ts`   | Complete producer application, public route 404s, standalone rendering, deep-link SSR, styles, DOM reuse, restored data, URL/history, shared selections, deferred requests and recovery                |
| `bridge-stream.test.ts`         | Full and selected applications, independent hydration, deferred data restoration, HTTP cancellation and late frames after unmount                                                                      |
| `bridge-failure.test.ts`        | Sanitized stream errors and explicit one-time CSR recovery, tested independently from successful SSR                                                                                                   |
| `ordinary-react.test.ts`        | Ordinary production CSR, string SSR and stream SSR, DOM identity, interaction and absence of the Bridge engine                                                                                         |
| `runtime-exports.test.ts`       | Built Node callback exports and existing Router Context identity, without claiming published-package acceptance                                                                                        |
| `application-isolation.test.ts` | Host/producer locales and dictionaries, repeated producer mounts, SSR DOM reuse, CSR without a local snapshot, producer route data/code prefetch and ordinary Host Link behavior                       |

Each browser file runs dev and production suites, retry 0, with one worker in the dedicated Rstest configuration. Every `describeLab` registration owns a temporary source copy, writable caches and service processes. In particular the two Bridge input API registrations do not share a Node service process. Installed packages are linked individually and are never modified by the tests. The runner starts producers before consumers, waits for HTTP readiness and cleans up after failures. Temporary workspaces keep tests independent of the interactive demo.

```sh
MF_LAB_MODE=dev pnpm --filter mf-lab-tests test tests/rendering.test.ts
MF_LAB_MODE=production pnpm --filter mf-lab-tests test tests/unified.test.ts
pnpm --filter mf-lab-tests test tests/data-fetch.test.ts -t prefetches
```

Type checking remains enabled. Fixture tsconfigs exclude `node_modules`, `dist` and `dist-v2` so directory watchers do not traverse linked monorepo dependencies. With `MF_LAB_DIAGNOSTICS=1`, failures also report owned processes and slow requests.

### Parallel CI and complete coverage

The Module Federation E2E workflow runs five test jobs on independent runners. Every job keeps one worker and zero retries. Each Lab retains its own source copy, writable caches, Node services and browser. The build and service startup order inside a Lab, and the case order inside each `describeLab`, remain unchanged. Factory and declarative cold-load groups continue to start separate Node services.

| Job                | MF cases |
| ------------------ | -------: |
| `lab-dev-A`        |       46 |
| `lab-dev-B`        |       58 |
| `lab-production-A` |       46 |
| `lab-production-B` |       57 |
| `common`           |       22 |

The common job also runs `rootExposes.test.ts` and `routeScope.test.ts` once each, using their existing package configurations. These unit cases are checked separately from the 259 MF cases.

[`scripts/groups.mjs`](./scripts/groups.mjs) owns the A/B/common file assignments. Both Rstest selection and result verification use it. Unknown, duplicate and unassigned files, empty groups and invalid environment parameters fail before services start. When adding or removing cases, update the committed [`case-manifest.json`](./case-manifest.json) from a successful full serial report and review the identity diff.

```sh
# All 259 MF cases, serially, with the original local entry point
pnpm --filter mf-lab-tests test --bail=1

# One file group and mode
MF_LAB_SUITE=lab MF_LAB_MODE=dev MF_LAB_SHARD=A pnpm --filter mf-lab-tests test --bail=1
MF_LAB_SUITE=lab MF_LAB_MODE=production MF_LAB_SHARD=B pnpm --filter mf-lab-tests test --bail=1
MF_LAB_SUITE=common pnpm --filter mf-lab-tests test --bail=1

# CI-equivalent execution with logs, identities, timings and cleanup audits
node tests/integration/module-federation/scripts/run.mjs lab-dev-A /tmp/mf-dev-A-run-1
node tests/integration/module-federation/scripts/run.mjs common /tmp/mf-common-run-1

# Complete serial reference, including the two unit suites
node tests/integration/module-federation/scripts/run.mjs serial /tmp/mf-serial-run-1
node tests/integration/module-federation/scripts/results.mjs baseline /tmp/mf-serial-run-1 tests/integration/module-federation/case-manifest.json

# Fast positive and negative checks, without starting services
node --test tests/integration/module-federation/scripts/parallelism.test.mjs
```

`MF_LAB_SUITE` accepts `lab` or `common`. `MF_LAB_SHARD` accepts `A` or `B` and requires `MF_LAB_SUITE=lab`. Lab mode accepts `dev` or `production`, with both modes selected when omitted. The common suite rejects mode and shard parameters. An omitted suite preserves the original behavior, including common tests when only `MF_LAB_MODE` is set. Do not combine this partitioning with Rstest's native `--shard`.

The report records repository-relative filenames, explicit mode, the complete suite path, expanded case name and Rstest project. The final `module-federation-e2e` check compares the complete identity multiset with the serial manifest. It requires all five jobs, every expected file result, zero failed/skipped/todo/retried cases, no hook or unhandled errors, successful resource audits and both unit reports. Reports must match the current commit, workflow run and attempt. Missing artifacts, cancelled jobs and unexpected skips fail the check. Rerun all jobs after a failed attempt so all five reports belong to the same attempt.

Each artifact name includes its job, run ID and attempt. Logs, reports, cleanup evidence and optional screenshots live in that job's artifact directory. Screenshots also include their mode. Set `MF_LAB_SCREENSHOTS=1` to capture the existing recovery screenshots. Each Lab owns its browser profile inside its temporary workspace and removes it after Chrome closes. The ordinary React suite likewise owns and removes its own profile. `run.mjs` observes descendants, process groups and a dedicated temporary directory, records leaks before fallback cleanup, and fails when services, browsers or test workspaces remain after the command. A fresh artifact directory is required for each run.

Every runner independently installs the lockfile, restores Nx cache, builds Modern.js and installs the pinned Puppeteer Chrome. Only the common job saves Nx cache. The summary shows measured MF and command durations. These exclude setup, installation, repository builds and artifact upload. Use GitHub's job start/end timestamps to compute total runner minutes and workflow elapsed time, including the summary job. The 12–16 minute workflow target remains an estimate until repeated CI measurements establish the actual result.

The workflow targets pull requests and pushes to `feat/module-federation-builtin` and `main`, and supports manual dispatch. Sources of the original coverage are Core's `apps/modernjs-ssr` and `apps/modern-component-data-fetch`, with their assertions expressed through weather components and the unified framework API.

Exported applications use the producer Browser/Hash Router configuration by default. Independent cards explicitly set `memoryRoute`. URL-connected Hash mounts configure both Host and producer as Hash Routers. Browser instances share window history.
