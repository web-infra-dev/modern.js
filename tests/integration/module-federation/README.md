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

## Unified API integration

Ordinary and nested weather consumers call `createReactRemote` with registered `alias/Expose` strings. The framework API selects the renderer from the Snapshot returned by the completed runtime resolution chain before executing the exposed module for these string inputs. Components use the existing SSR, hydration, CSS/assets and data-fetch pipeline. Fault wrappers supply request-specific props and data-fetch parameters without mutating a loaded component or server-wide flag.

`Independent weather stations` uses the same factory API and the declarative `ReactRemote` API. Its producer imports `createBridgeComponent` from the framework entry. The manifest marks that expose with `render: 'bridge'` and `isService: false`. Server HTML contains placeholders, and each client mount owns a separate producer Root. Renaming a station preserves its observations, disconnecting destroys it, and reconnecting creates a fresh station. This fixture remains a CSR-only Bridge regression. The full and selected Modern application exports use the SSR adapters described below.

The `/input-forms` fixture covers registered strings, MF loader functions, and synchronous or asynchronous functions returning preloaded MF namespaces or default components. It uses static MF imports for the preloaded values and does not add identity markers. Every ordinary input runs through factory and declarative consumers in both SSR and CSR, preserving local state across props updates. Function inputs are Node-loadable in the SSR cases. A guarded noSSR function fails if called on the server, and Bridge loader inputs still emit server placeholders. Intentional function failures appear only after a user action and exercise retry without disturbing neighboring instances. The matching consumer Runtime supplies provenance for preloaded exports, without producer protocol changes.

Runtime registration and prefetch continue using Enhanced and the existing data-prefetch plugin. The fixture does not call the old `createLazyComponent` consumer API. Each producer has one canonical runtime name with an alias. Registering the same container under multiple names would evaluate a second server entry against an existing instance and can break remote chunk initialization.

The checked-in MF dependencies are pinned to published preview `0.0.0-feat-enhanced-runtime-unification-20261104092109`, including matching function-input SSR, preloaded-export identity and generated props inference. Integration apps, examples, runtime peers and the adapter use the same preview. Published-package validation must install from the checked-in lockfile without local Core overrides. This preview includes the shared Router connector, the Bridge SSR engine and unified consumers, the native POP loader-redirect fix, and progressive producer results without a duplicate final snapshot. Release acceptance uses an independent registry installation without local Core overrides, including package exports, generated consumer types and the full development/production suite.

## Bridge application SSR

`WeatherApp` and `ProductApp` use `createModernBridgeComponent`, which binds Modern's `render`, `hydrate` and `renderStream` callbacks. `OrdersApp` passes those same callbacks explicitly to `createBridgeComponent`. Both forms use the shared Core Bridge consumer and stream compositor.

`/bridge-ssr` mounts one complete `provider/WeatherApplication` through `createModernReactRemote` and the function input `() => loadRemote('provider/WeatherApplication')`. The producer export calls `createRoot({ route: '/weather-application' })` and `createModernBridgeComponent`. Its own layout, Router, station loader and pages live in `provider/src/routes/weather-application`. The Host catch-all route supplies the mount prefix, so remote navigation updates the Host URL and browser history.

Start at `/bridge-ssr` or `/bridge-ssr/overview`, save the station, select an hour and adjust the wind. Open `/bridge-ssr/forecast`, filter the five-day list and choose a day. Details such as `/bridge-ssr/forecast/wed` support direct SSR navigation. Save that day and open `/bridge-ssr/favorites` to return to it. Station and day favorites, the filter, selected hour and wind direction belong to the producer layout and survive page navigation, browser back/forward and Host label updates. A document reload or disconnect/reconnect starts a fresh application.

The pages directly reuse `CurrentWeather`, `HourlyWeather`, `DaysWeather` and `WindWeather` from `provider/src/weather-ui.tsx`. Optional controlled props leave existing consumers' defaults intact. Air quality, UV and sunset cards are shared in `weather-cards.tsx`. The original font, cloud SVG, sky, card and responsive styles now live in `provider/src/weather-base.css` and `weather-scene.css`, imported by the application and the original Host weather document. Host navigation, comparison, Inspect and experiment controls remain in Host styles. The standalone producer entry is `http://localhost:4301/weather-application/overview`.

Each forecast detail returns immediate day information plus a deferred `/bridge-data` request. Only the outdoor outlook shows a loading state. The rest of the application remains available. Under “Try the forecast service”, “Load a slow outlook” requests a real delayed API response and “Try a service failure” requests a 503. “Retry outlook” makes a fresh successful request, retaining the layout and selections. Loader signals handle HTTP disconnects. Because a deferred server request can outlive the committed navigation, every outlook also has a unique cancellation token. Page cleanup cancels that pending job through the local API, including an initially streamed SSR job. Tokens are per request and do not affect neighboring mounts. Tests use the existing service gates to control delayed SSR data and verify hydration restores it without another request.

The original `WeatherApp` remains the full root export. `ProductApp`, `OrdersApp`, component exposes and the selected `CurrentWeatherApp`, `WeatherForecastApp` and `AirQualityApp` keep their existing contracts. Those three selected applications exercise string, MF loader and preloaded inputs in the test-only `/bridge-inputs` fixture, with factory and declarative APIs, noSSR and instance controls. The demo cleanup does not narrow the supported consumer API.

`bridge-ssr.test.ts` registers an independent `setupLab` for each API and mode. Every registration creates a temporary workspace and starts fresh provider and Host Node processes. Test-only instrumentation records export and route-page evaluation on the server and in the browser. A test-only query filter first renders no inputs, then preloaded, string and loader inputs in order. Before each step the relevant lazy export/page must not have evaluated, and afterward only the matching weather content and completed SSR frames may appear. Preloading air quality must not evaluate the other exports. The tests also inspect the actual producer scope graphs and all compiled Host remote-module dependencies, including other entries and barrels. The observer neither wraps exports nor bypasses caches, and is absent from the interactive fixture.

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

The Module Federation E2E workflow targets pull requests and pushes to `feat/module-federation-builtin` and `main`. It builds app-tools, runtime and their dependencies, installs the pinned Puppeteer browser and runs the complete suite. The workflow also declares manual dispatch. Sources of the original coverage are Core's `apps/modernjs-ssr` and `apps/modern-component-data-fetch`, with their assertions now expressed through weather components and the unified framework API.

Exported applications use the producer Browser/Hash Router configuration by default. Independent cards explicitly set `memoryRoute`. URL-connected Hash mounts configure both Host and producer as Hash Routers. Browser instances share window history.
