# Weather Lab

The built-in Modern.js Module Federation playground uses the unified React APIs from `@modern-js/runtime/mf`. The weather UI is the demo and the browser E2E fixture. The sidebar groups rendering comparisons, SSR updates and Service App experiments.

## Run

After installing dependencies and building the Modern.js workspace packages, run from the repository root:

```sh
pnpm --filter mf-lab-tests dev
pnpm --filter mf-lab-tests test
```

Open http://localhost:4300/. Stop the interactive lab with Ctrl+C. Add `--production` to the dev command to inspect production builds. Select an existing Chrome installation with `PUPPETEER_EXECUTABLE_PATH` when needed. `MF_LAB_VERBOSE=1` prints child-process logs.

| Route                                  | Purpose                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                    | Rendering comparison with CSR, SSR, Bridge SSR and Service App documents                                                                     |
| `/data`                                | CSR, SSR, CSR with MF data and SSR with MF data                                                                                              |
| `/advanced`                            | Weather release replacement, data recovery, loader lifecycle, remote data sources and independent weather stations                           |
| `/bridge-ssr/*`                        | Complete remote weather application with overview, forecast details, favorites and real deferred loading and recovery                        |
| `/stores/:storeId/inventory/*`         | Route-mounted product application, automatic basename, host/remote navigation and independent memory cards                                   |
| `/stores/:storeId/retry/*`             | One-time provider failure and retry with isolated neighboring mounts                                                                         |
| `/browser-consumer/{adapter,direct}/*` | Separate React roots consuming a Modern application through the browser adapter or Core without navigation, with a live Host Router observer |
| `/weather`                             | Internal weather document used by the comparison and advanced frames                                                                         |

Advanced frames select their experiment through `/weather?scenario=...`. These share the weather layout and do not add separate demo routes. Removed routes such as `/static`, `/recovery`, `/compare` and `/unified` return 404. Navigation and history are tested from the root Weather Lab.

The public `/bridge-stream`, `/route-exports`, `/bridge-failure` and `/input-forms` routes are removed and return 404. Their contract fixtures live in `fixtures/bridge-contracts` and are copied only into test workspaces. The former three-panel Bridge input demonstration lives there as `/bridge-inputs`, also unavailable in the public lab. The application suite disables those copies to verify the real public route set.

## Comparison controls

The root comparison selects every available rendering mode by default. Data fetching and prefetch are off. Apply configuration to refresh the frames together. Inspect toggles debug overlays without reloading a frame.

Data fetching adds a neighboring frame for each selected mode. Ordinary components use MF data-fetch. Bridge and Service applications use their existing producer route loaders. The baseline supplies fixed loader results without calling the weather API. Unconfigured application routes keep their real loaders.

Prefetch adds a separate resource-warmed Bridge or Service frame. It fetches the current configured manifest and prefetches browser assets without evaluating a container, running loaders or requesting a Service response. Resource preparation happens before frame navigation and its duration is shown separately. Ordinary CSR retains its MF data-prefetch experiment. Concurrent frames share browser HTTP caches, so this is a loading-flow experiment rather than an isolated performance ranking.

Open `/service/forecast/today?lab=service&tab=load` for click-to-load comparison. Both host frames use CSR. One button mounts a Service App on the left and an ordinary Bridge CSR application on the right. Nothing mounts before the click. Both content-visible estimates and enabled-control times use the same click timestamp. Optional application loaders and resource warming apply to both sides. Warming does not cache the Service response stream. Clicking again remounts both applications and starts new measurements.

In development, the SSR update workbench provides source links for the selected experiment. Click a link to open its producer file and line through the existing development server editor integration. Ordinary SSR points to the weather title, nested SSR provides the intermediate entry and Rslib wind component, and Bridge SSR points to the application layout. The page stays open while the editor launches.

## Independent Service App lab

Service runs allocate a fresh free port group instead of the interactive Weather Lab ports. Start from the repository root:

```sh
node tests/integration/module-federation/scripts/service-lab.mjs
node tests/integration/module-federation/scripts/service-lab.mjs --production
```

The output records the producer, business API, SSR Host and CSR Host ports, their process IDs and access URLs. The same configuration supplies manifest URLs, assets, loader requests, same-origin ingress and HMR. Only processes started by this run are stopped with Ctrl+C.

Both Hosts consume the same route-selected weather application, declared with `isService: true`. The SSR response contains real producer HTML. The CSR Host disables page SSR and requests progressive HTML after mounting. Use `?late=1&delay=5000` to connect after document completion while a slow outlook remains pending. Station props, saved state, navigation and reconnect use the existing application instance. `?multi=1` mounts an independent second instance, `?declarative=1&static=1` selects the declarative/static input combination, and `?declarative=1&memory=1` uses an explicit memory route. Factory cases cover both `createModernReactRemote` with inferred basename and `createReactRemote` with explicit basename.

The producer result cache is explicitly enabled for this fixture. Exact matching page requests can reuse a completed transcript, including ready and updates. The producer publishes its origin once, automatically serves its base URL aliases, and needs no handwritten Service handler. Browser ingress reads trusted Snapshots and keeps the fixture service credential out of browser artifacts. See the [Service App guide](../../../packages/document/docs/en/guides/topic-detail/module-federation/service-app.mdx) for deployment, TLS origin binding, limits and release requirements.

`Disconnect` unmounts the application and cancels an unfinished Service request. `Connect` mounts a fresh instance. `Change station` switches the Host's label prop between Hangzhou and West Lake, so existing application state should survive that update.

The first Service test in each fresh dev/production Lab requests Service SSR, then another page path with `?local=1` for ordinary Bridge SSR from the same producer, then Service SSR again. It requires real remote HTML and completed streams on every response, while the Host's Node entry probe records loading counts of 0, 1 and 1. The probe normally allows actual JS loading. `MF_SERVICE_BLOCK_NODE=1` retains the separate blocking control.

For performance runs, `MF_LAB_WEATHER_DELAY=0` removes the station API's deliberate 900 ms wait in any lab, including Bridge SSR and the update previews. The Service-only lab also accepts its existing `MF_SERVICE_WEATHER_DELAY=0` setting. Use `delay=0` in the page URL to remove the independent detail delay as well. Record both delayed and zero-delay runs separately. Without either setting, the station API retains its 900 ms delay.

Fault-only queries `serviceFault=early` and `serviceFault=late` exercise HTTP 503 and a real producer disconnect. Tests release the latter through the existing response gate only after proving interaction. A recovered `csr=1` document is a recovery assertion and is never counted as SSR success.

## Unified API integration

Ordinary and nested weather consumers call `createReactRemote` with functions such as `() => loadRemote('alias/Expose')`. After the function resolves, the framework API selects the renderer from the loaded module's runtime provenance and Snapshot metadata. Components use the existing SSR, hydration, CSS/assets and data-fetch pipeline. Fault wrappers supply request-specific props and data-fetch parameters without mutating a loaded component or server-wide flag.

`Independent weather stations` uses the same factory API and the declarative `ReactRemote` API. Its producer imports `createBridgeComponent` from the framework entry. The manifest marks that expose with `render: 'bridge'` without a `servicePath`. Server HTML contains placeholders, and each client mount owns a separate producer Root. Renaming a station preserves its observations, disconnecting destroys it, and reconnecting creates a fresh station. This fixture remains a CSR-only Bridge regression. The full and selected Modern application exports use the SSR adapters described below.

The `/input-forms` fixture covers MF loader functions and synchronous or asynchronous functions returning preloaded MF namespaces or default components. It uses static MF imports for the preloaded values and does not add identity markers. Every ordinary input runs through factory and declarative consumers in both SSR and CSR, preserving local state across props updates. Function inputs are Node-loadable in the SSR cases. A guarded noSSR function fails if called on the server, and Bridge loader inputs still emit server placeholders. Intentional function failures appear only after a user action and exercise retry without disturbing neighboring instances. The matching consumer Runtime supplies provenance for preloaded exports, without producer protocol changes.

Runtime registration and prefetch continue using Enhanced and the existing data-prefetch plugin. The fixture does not call the old `createLazyComponent` consumer API. Each producer has one canonical runtime name with an alias. Registering the same container under multiple names would evaluate a second server entry against an existing instance and can break remote chunk initialization.

The checked-in MF dependencies are pinned to published preview `0.0.0-feat-mf-ssr-update-current-20261124030451`, including the function-only consumer contract, preloaded-export identity and generated `loadRemote` props inference without a global consumer type registry. Integration apps, examples, runtime peers and the adapter use the same preview. Published-package validation must install from the checked-in lockfile without local Core overrides. This preview includes the shared Router connector, the Bridge SSR engine and unified consumers, the native POP loader-redirect fix, and progressive producer results without a duplicate final snapshot. It also includes Service metadata, progressive HTTP rendering and deferred private policy lookup for ordinary nested Node containers. Release acceptance uses an independent registry installation without local Core overrides, including package exports, generated consumer types and the full development/production suite.

## Producer updates and SSR cache validation

The homepage uses three sidebar sections: **渲染对比**, **SSR 更新**, and **Service 应用**. There is no global top navigation. Public routes remain unchanged, with query parameters selecting the active workbench or embedded document.

- **渲染对比** defaults to all configured rendering mechanisms: CSR, SSR, Bridge SSR and Service App in the complete lab. Data-fetch and prefetch comparisons default off. Edit the controls, then click **应用** to reload the comparison documents together. Inspect and opening advanced settings preserve the iframe instances. Each rendering mechanism groups its baseline and enabled variants together. Ordinary data comparisons use the same local API. Bridge and Service keep their application loader semantics. CSR prefetch has its own comparison with an otherwise identical MF data-fetch document. SSR already restores initial data and does not pretend to gain another browser prefetch sample. Desktop overview fits all configured groups within the viewport and scales each iframe visually without reloading it. Use **滚动大图** or the frame's open link for larger content. All workbenches, child tabs and the translucent sidebar share the pale gradient and geometric background. Common actions use SVG icons, with short labels or accessible names. Repeated explanatory paragraphs are omitted from the interface. Inspect is a separate display control on the right and does not apply data settings.
- **SSR 更新** has **热更新** and **缓存与内存** tabs on `/?lab=ssr`. Choose ordinary components, nested SSR or a Bridge application. The cache tab combines version selection, update-request handling and GC samples. Optional repeated switching validates each fresh raw SSR response before collecting the next memory sample. Tables show process identities, baseline deltas and per-round samples. A changed PID is reported rather than compared as the same process.
- **Service 应用** has **加载对比**, **热更新与 SSR 依赖**, and **版本与内存**. The load tab at `/service/forecast/today?lab=service&tab=load` uses CSR hosts on both sides. One shared **加载** button mounts the Service App on the left and ordinary Bridge CSR on the right, with the same click timestamp. The direct `?late=1` route remains available. Service memory samples include the Host and both independently running producer releases.
- In Build + serve, select a different producer version and set **等待** to zero, 1, 3 or 5 seconds, or **手动放行**, then click **更新**. Delays run inside the real invalidation boundary after admission closes. Expand **缓存更新期间的请求**, choose a request policy and click **＋请求** for each independent document. **放行** remains available while the server is held, including after navigation back to the page. Request admission deadlines remain in effect independently of a manual hold.
- The update result shows the actual local or application mode, affected entries, duration and fallback reasons. **入口变化** compares runtime and root-module identities before and after the operation. A stable PID alone does not prove a local update. CSR documents do not count as successful SSR responses.
- `MF_LAB_SSR_SCOPE=entries` reuses `/` and `/weather` as separate static compiled entries. The homepage stays available during weather-only updates. Startup requires matching local Rspack asynchronous startup export support. The weather component keeps its compiled static import and passes that value to `createReactRemote({ remote: () => Weather })`. This preserves static dependency ownership while reusing the normal remote metadata and SSR stylesheet injection. Tests require `mode: entries`, unchanged homepage runtime/module identities, a replaced weather root and the selected version's CSS in the SSR HTML before weather content.
- Set `MF_LAB_SERVICE_NESTED=1` with `--updates=ordinary` in the complete production lab for Service-internal ordinary/nested SSR. Choose **Service producer** as the request-update owner to switch its library dependency while retaining its root release. Service render POSTs support waiting/rejection, not an HTML CSR shell. Rejection can appear inside an already-started Host response.
- `MF_LAB_PARTIAL_ORIGIN` and `MF_LAB_UPDATE_ORIGIN` link actual separately running static and Build + serve configurations from the relevant workbench. `MF_LAB_WEATHER_DELAY=0` removes simulated API latency. Ports always come from the allocated map. Frame metrics use Element Timing where available and explicitly label application paint estimates. Concurrent frames share browser network and HTTP caches, so samples are observations, not performance rankings.

Fault simulation targets are labeled explicitly and affect ordinary CSR/SSR weather modules only. After editing the type/target or checkbox, apply the configuration, or use **恢复正常并刷新**. Browser failures retain the real MF hook path in an iframe-lifetime runtime. SSR makes the actual failing HTTP request without registering a fake remote in the process-lifetime runtime, so later dev readiness cannot repeatedly discover that intentional failure. Service and Bridge cards already execute their application loaders. The CSR MF prefetch experiment does not claim to preload or cache a Service SSR response stream.

Regression coverage remains under `tests/integration/module-federation/tests`, using the same controls, actual documents and production update APIs.

Producer updates use the original Weather Lab routes. Select a scenario when starting it:

```sh
pnpm --filter mf-lab-tests dev --updates=all
pnpm --filter mf-lab-tests dev --updates=ordinary
pnpm --filter mf-lab-tests dev --updates=bridge
pnpm --filter mf-lab-tests dev --updates=service
pnpm --filter mf-lab-tests dev --production --updates=service
```

`--updates=all` starts the complete Weather Lab, including the Host, producer, nested producer and both library releases, directly from this repository's demo directories. Open `/` for the complete CSR/SSR comparison, `/bridge-ssr/forecast/today` for Bridge SSR, or `/service/forecast/today` for Service App. No scenario query is required. These pages observe the same source edits, without copied workspaces or competing compilation outputs. This combined producer includes Service exposes, so its updates can require document reloads. Combined mode is development-only. Ordinary mode also starts the complete comparison dependencies. Isolated Bridge and Service modes start the Host and their producer.

Edit `tests/integration/module-federation/provider/src/update-version.tsx` from the repository root and watch the original page update through the real development subscription and HMR or reload path. The primary Rslib library runs `rslib mf-dev` with Browser and Node watch builds. Shared source such as `provider/src/weather-ui.tsx` is therefore recompiled when used through `nested/WeatherWind` → `dynamic/WeatherWind`. The secondary library release remains a built snapshot for explicit version-switch scenarios. Development does not call the update API or assign a new iframe URL. The comparison includes hourly, nested daily and wind components both before and after an update. Tests check the raw SSR response as well as hydrated interactions.

Production builds and serves two complete producer versions with distinct `MF_BUILD_VERSION` values shared by their Browser and Node builds. Choose v1 or v2 and click **Update and render**. A Host fixture endpoint calls public `shouldUpdateRemote` and submits `updateRemotes` with `defer: 'after-response'` from `@modern-js/runtime/mf/update`, supplying matching server and browser entry URLs. After that response ends, the controls check whether the target is active. The comparison replaces its existing iframes at the same URLs, while Bridge and Service reload their existing page. The control request never waits for its own work to drain. The endpoint does not clear private caches or restart the Host. **GC and sample memory** shows the actual service process PID, heap, RSS, external memory and buffers. Service mode includes both producer processes.

`tests/remote-updates.test.ts` runs both modes with ordinary, Bridge and Service scenarios. Development requires automatic browser updates plus new raw SSR output. Production warms both releases, captures three post-GC baseline samples, alternates versions ten times, verifies each document and hydrated interaction, then captures three final samples. The actual process PIDs must remain unchanged. Service requests must execute in the producer and the Host must not load its Node container. Results include each round, baseline and final medians, ranges and byte differences. A positive delta is reported as an observation rather than hidden behind an arbitrary memory allowance. Ten rounds do not establish that a process cannot leak. For the 100-update investigation, controls, heap retaining paths and diagnostic options, see [the memory investigation](./memory-investigation.md).

```sh
MF_LAB_MODE=dev pnpm --filter mf-lab-tests test tests/remote-updates.test.ts
MF_LAB_MODE=production pnpm --filter mf-lab-tests test tests/remote-updates.test.ts
```

Set `MF_LAB_ARTIFACT_DIR` to retain HTML, measurements and Rstest results outside the temporary workspace. Set `PUPPETEER_EXECUTABLE_PATH` to use an installed Chrome. `MF_LAB_PORTS` supplies the actual allocated app ports. A supervised runner can also set `MF_LAB_RUNNER_PORT`. Development subscription tests need the MF broker port 16322 available for their own process.

Additional regressions use the same Rstest entry point and live in `tests/`, with shared ESM builders under `tests/ssr-update/`:

| Tests                                         | Coverage                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ssr-static`                                  | Named, numeric and concatenated module graphs, affected and unrelated caches, drain, publication failure and whole-application fallback                      |
| `ssr-update-api`, `ssr-update-identity`       | Asynchronous checks, explicit production updates, no-op, rollback, after-response and multiple Host/build ownership                                          |
| `ssr-release-retention` | Old browser and saved HTML retention, cancellation, queued requests and producer work draining                                                               |
| `ssr-dev-fallback`, `ssr-dev-subscriptions`   | Fixed manifest gateways, failed builds and recovery, nested propagation, late producers, static producers and Service 409 recovery without POST replay       |
| `ssr-dev-admission`, `ssr-admission-response` | Request admission during rebuilds, cancellation and timeout, static producers, failed acknowledgement recovery, cyclic dependencies and early HTTP responses |

These tests use the locally built Modern, MF and matching Rspack/native packages during joint development. Temporary dependency overrides and validation lockfiles are not release dependencies. Preview publication remains a separate step.

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

Rendering compares independent iframe documents containing current weather from a Modern producer, hourly weather from a dynamically registered Rslib producer, daily weather through an independent nested Modern build, and wind through nested Modern and dynamic Rslib consumption. Smaller viewports omit the decorative cards to keep the interactive modules visible.

The data page compares four documents. Ordinary client fetching and MF data loading use the same local weather API. SSR with MF data includes the actual result in the response HTML. Data prefetch starts before the CSR remote component renders. It defaults to off in the workbench, reuses a promise by MF data key within one browser document, evicts failed requests and never caches server requests. Tests verify the real request count with prefetch on and off, fresh requests after reload, and Element Timing under a controlled component-download delay.

Advanced scenarios retain the existing raw runtime registration experiment for switching independently built weather releases. Its rendering-only expose has no data-loader sibling, preserving the original component-only experiment while using the unified consumer. This does not implement the future `updateRemotes` API or promise automatic cache invalidation. Data recovery exercises the client-loader and host-retry paths. Lifecycle compares parent updates with a remote remount and checks the no-data-loader module separately. Remote data sources compare Modern and Rslib server loaders.

## Route-mounted applications

`createModernReactRemote` reads the local Modern route boundary and connects that mount to host history. An E2E host basename of `/admin` and the route `/stores/:storeId/inventory/*` produce `/admin/stores/100/inventory` as the mount prefix. A direct URL is `/admin/stores/100/inventory/detail/42?tab=stock#summary`. The `/product` selector only chooses exported application content. The exported application matches `/detail/42?tab=stock#summary` locally, including the location exposed to its components. Navigation adds or removes only the consumer mount prefix. The standalone producer and server loader data endpoints keep their original paths. Business navigation uses relative links and remains the producer's responsibility.

The adjacent cards use `createReactRemote` with explicit `memoryRoute` and keep independent navigation. The Remote owns product navigation. The Host fieldset is explicitly a routing protocol test harness for push, replace, slow navigation and mount changes. A mount basename is fixed for its lifetime. Changing the matched store ID changes the basename and creates a fresh application, cancelling the old loaders and releasing its subscriptions. Props updates and internal navigation preserve state within the same mount, while adjacent memory cards stay independent. Native back navigation checks both browser loader requests and the local service count to reject duplicate requests or unintended cancellation. Separate React roots cover the real browser adapter and Core consumption without a navigation adapter. Initial redirects must notify the Host even while a loading chunk delays the Remote commit. The direct deep-link cases also hold the Host entry script, verify actual Bridge HTML frames and require the initial remote DOM to survive hydration without a browser loader request. Hash Router coverage uses a CSR host because URL fragments are unavailable during SSR.

## Faults and diagnostics

The comparison pages and advanced experiments expose actual remote HTTP 503, server-rendering, component-rendering, weather API and invalid-response failures. Nested weather also supports an inner remote HTTP failure. Clearing a fault reloads its isolated document. Recovery badges only appear after a real recovery path reports an event.

`createReactRemote` supplies the consumer error fallback. MF runtime hooks remain visible for remote loading failures. React still reports errors for intentionally failed streaming boundaries. Data-prefetch failures may also report the existing rejected data-loader promise. Fault tests check the specific errors and counts. Other page errors fail the tests, and no global suppression is used.

Inspect defaults to off and uses the existing runtime `onLoad` decorator. Labels identify each ordinary remote, its manifest and nested chain. Producer colors are shared across frames and survive reloads. Toggling Inspect must preserve remote state and data requests. Bridge provider factories are excluded from the component decorator using manifest protocol metadata.

The local API returns deterministic weather after 900 ms and assigns a request ID. Interactive ports are 4300 for the gateway, 4306 for the API and 4307 for the underlying host. Provider and library version-two builds use separate origins. Weather SVGs, remote station images, CSS and cloud imagery are local. No public weather, font or image service is required.

For externally reserved test ports, set `MF_LAB_PORTS` to a JSON object. Ordinary Labs require `host`, `provider`, `nested`, `library`, `providerV2`, `libraryV2`, `api` and `hostInternal`. Service Labs require `provider`, `api`, `serviceSSR` and `serviceCSR`. A combined object supports both suites. Each active service must have a distinct valid port. Explicit assignments are preserved and port conflicts fail instead of allocating replacements. Without this variable, tests keep their existing automatic port allocation.

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

Each Lab file runs dev and production suites, retry 0, with one worker in the dedicated Rstest configuration. Common contract regressions run once. Every `describeLab` registration owns a temporary source copy, writable caches and service processes. In particular the two Bridge input API registrations do not share a Node service process. Installed packages are linked individually and are never modified by the tests. The runner starts producers before consumers, waits for HTTP readiness and cleans up after failures. Temporary workspaces keep tests independent of the interactive demo.

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
| `lab-dev-B`        |       83 |
| `lab-production-A` |       46 |
| `lab-production-B` |       86 |
| `common`           |       59 |

The common job also runs `rootExposes.test.ts` and `routeScope.test.ts` once each, using their existing package configurations. These 33 unit cases are checked separately from the 320 MF cases.

[`scripts/groups.mjs`](./scripts/groups.mjs) owns the A/B/common file assignments. Both Rstest selection and result verification use it. Unknown, duplicate and unassigned files, empty groups and invalid environment parameters fail before services start. When adding or removing cases, update the committed [`case-manifest.json`](./case-manifest.json) from a successful full serial report and review the identity diff.

```sh
# All 320 MF cases, serially, with the original local entry point
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
node --test tests/integration/module-federation/scripts/parallelism.test.mjs tests/integration/module-federation/scripts/process-tracker.test.mjs
```

`MF_LAB_SUITE` accepts `lab` or `common`. `MF_LAB_SHARD` accepts `A` or `B` and requires `MF_LAB_SUITE=lab`. Lab mode accepts `dev` or `production`, with both modes selected when omitted. The common suite rejects mode and shard parameters. An omitted suite preserves the original behavior, including common tests when only `MF_LAB_MODE` is set. Do not combine this partitioning with Rstest's native `--shard`.

The report records repository-relative filenames, explicit mode, the complete suite path, expanded case name and Rstest project. The final `module-federation-e2e` check compares the complete identity multiset with the serial manifest. It requires all five jobs, every expected file result, zero failed/skipped/todo/retried cases, no hook or unhandled errors, successful resource audits and both unit reports. Reports must match the current commit, workflow run and attempt. Missing artifacts, cancelled jobs and unexpected skips fail the check. Rerun all jobs after a failed attempt so all five reports belong to the same attempt.

Each artifact name includes its job, run ID and attempt. Logs, reports, cleanup evidence and optional screenshots live in that job's artifact directory. Screenshots also include their mode. Set `MF_LAB_SCREENSHOTS=1` to capture the existing recovery screenshots. Each Lab owns its browser profile inside its temporary workspace and removes it after Chrome closes. The ordinary React suite likewise owns and removes its own profile. `run.mjs` observes descendants, process groups and a dedicated temporary directory, records leaks before fallback cleanup, and fails when services, browsers or test workspaces remain after the command. It tracks PID and process birth time, keeps its supervisor alive through the audit, and revalidates each process before signaling it so reused identifiers do not grant ownership of unrelated processes. A fresh artifact directory is required for each run.

Every runner independently installs the lockfile, restores Nx cache, builds Modern.js and installs the pinned Puppeteer Chrome. Only the common job saves Nx cache. The summary shows measured MF and command durations. These exclude setup, installation, repository builds and artifact upload. Use GitHub's job start/end timestamps to compute total runner minutes and workflow elapsed time, including the summary job. The 12–16 minute workflow target remains an estimate until repeated CI measurements establish the actual result.

The workflow targets pull requests and pushes to `feat/module-federation-builtin` and `main`, and supports manual dispatch. Sources of the original coverage are Core's `apps/modernjs-ssr` and `apps/modern-component-data-fetch`, with their assertions expressed through weather components and the unified framework API.

Exported applications use the producer Browser/Hash Router configuration by default. Independent cards explicitly set `memoryRoute`. URL-connected Hash mounts configure both Host and producer as Hash Routers. Browser instances share window history.
