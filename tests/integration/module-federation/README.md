# Weather Lab

The built-in Modern.js Module Federation playground uses the unified React APIs from `@modern-js/runtime/mf`. The weather UI is the demo and the browser E2E fixture. Old signal pages and their sidebar layout have been removed.

## Run

After installing dependencies and building the Modern.js workspace packages, run from the repository root:

```sh
pnpm --filter mf-lab-tests dev
pnpm --filter mf-lab-tests test
```

Open http://localhost:4300/. Stop the interactive lab with Ctrl+C. Add `--production` to the dev command to inspect production builds. Select an existing Chrome installation with `PUPPETEER_EXECUTABLE_PATH` when needed. `MF_LAB_VERBOSE=1` prints child-process logs.

| Route       | Purpose                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `/`         | Rendering comparison, CSR and SSR weather documents                                                                |
| `/data`     | CSR, SSR, CSR with MF data and SSR with MF data                                                                    |
| `/advanced` | Weather release replacement, data recovery, loader lifecycle, remote data sources and independent weather stations |
| `/weather`  | Internal weather document used by the comparison and advanced frames                                               |

Advanced frames select their experiment through `/weather?scenario=...`. These share the weather layout and do not add separate demo routes. Removed routes such as `/static`, `/recovery`, `/compare` and `/unified` return 404. Navigation and history are tested from the root Weather Lab.

## Unified API integration

Ordinary and nested weather consumers call `createReactRemote` with registered `alias/Expose` strings. The framework API selects the renderer from the Snapshot returned by the completed runtime resolution chain before executing the exposed module. Components use the existing SSR, hydration, CSS/assets and data-fetch pipeline. Fault wrappers supply request-specific props and data-fetch parameters without mutating a loaded component or server-wide flag.

`Independent weather stations` uses the same factory API and the declarative `ReactRemote` API. Its producer imports `createBridgeComponent` from the framework entry. The manifest marks that expose with `render: 'bridge'` and `isService: false`. Server HTML contains placeholders, and each client mount owns a separate producer Root. Renaming a station preserves its observations, disconnecting destroys it, and reconnecting creates a fresh station. Bridge SSR is outside this phase.

Runtime registration and prefetch continue using Enhanced and the existing data-prefetch plugin. The fixture does not call the old `createLazyComponent` consumer API. Each producer has one canonical runtime name with an alias. Registering the same container under multiple names would evaluate a second server entry against an existing instance and can break remote chunk initialization.

The MF dependencies are pinned to published preview `0.0.0-feat-enhanced-runtime-unification-20261027114159`, which contains the unified consumers and per-expose protocol metadata. Keep the integration, examples and runtime peer versions aligned. Validate the registry packages without local overrides when updating these pins.

## Weather scenarios

Rendering compares two iframe documents containing current weather from a Modern producer, hourly weather from a dynamically registered Rslib producer, daily weather through an independent nested Modern build, and wind through nested Modern and dynamic Rslib consumption. Smaller viewports omit the decorative cards to keep the interactive modules visible.

The data page compares four documents. Ordinary client fetching and MF data loading use the same local weather API. SSR with MF data includes the actual result in the response HTML. Data prefetch starts before the CSR remote component renders. It defaults to on, reuses a promise by MF data key within one browser document, evicts failed requests and never caches server requests. Tests verify the real request count with prefetch on and off, fresh requests after reload, and Element Timing under a controlled component-download delay.

Advanced scenarios retain the existing raw runtime registration experiment for switching independently built weather releases. Its rendering-only expose has no data-loader sibling, preserving the original component-only experiment while using the unified consumer. This does not implement the future `updateRemotes` API or promise automatic cache invalidation. Data recovery exercises the client-loader and host-retry paths. Lifecycle compares parent updates with a remote remount and checks the no-data-loader module separately. Remote data sources compare Modern and Rslib server loaders.

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

| File                     | Coverage                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rendering.test.ts`      | Ordinary SSR, remote CSS and image origins, dynamic hourly interactions, nested daily weather, nested wind, root navigation/history, removed-route 404s, custom manifests and dev remote revalidation |
| `data-fetch.test.ts`     | Modern and Rslib data sources, host query forwarding, client/host recovery, rerender/remount, no-data-loader behavior and actual prefetch effects                                                     |
| `comparison.test.ts`     | Two/four weather panels, raw SSR differences, local requests, script delay, Element Timing, visibility estimates and desktop bounds                                                                   |
| `inspect.test.ts`        | Real remote identities, expandable nested chains, consistent colors, state/request preservation and data-frame inspection                                                                             |
| `advanced.test.ts`       | Independent producer release replacement and experiment isolation                                                                                                                                     |
| `error-recovery.test.ts` | HTTP/render/data failures, handling events, interactive neighbors and recovery after clearing faults                                                                                                  |
| `unified.test.ts`        | Weather expose protocols, factory/declarative Bridge stations, server placeholders, independent state, prop updates and destroy/remount through Advanced                                              |
| `activation.test.ts`     | Real CLI activation, disabling, config/dependency errors, legacy coexistence, DTS output and native ESM builds                                                                                        |

Each browser file runs dev and production suites, retry 0, with one worker in the dedicated Rstest configuration. Every file owns a temporary source copy and writable caches. Installed packages are linked individually and are never modified by the tests. The runner starts producers before consumers, waits for HTTP readiness and cleans up after failures. Temporary workspaces keep tests independent of the interactive demo.

```sh
MF_LAB_MODE=dev pnpm --filter mf-lab-tests test tests/rendering.test.ts
MF_LAB_MODE=production pnpm --filter mf-lab-tests test tests/unified.test.ts
pnpm --filter mf-lab-tests test tests/data-fetch.test.ts -t prefetches
```

Type checking remains enabled. Fixture tsconfigs exclude `node_modules`, `dist` and `dist-v2` so directory watchers do not traverse linked monorepo dependencies. With `MF_LAB_DIAGNOSTICS=1`, failures also report owned processes and slow requests.

The Module Federation E2E workflow targets pull requests and pushes to `feat/module-federation-builtin` and `main`. It builds app-tools, runtime and their dependencies, installs the pinned Puppeteer browser and runs the complete suite. The workflow also declares manual dispatch. Sources of the original coverage are Core's `apps/modernjs-ssr` and `apps/modern-component-data-fetch`, with their assertions now expressed through weather components and the unified framework API.
