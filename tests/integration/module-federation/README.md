# Federation lab

A combined SSR and data-fetch regression playground for the existing `@module-federation/modern-js-v3@2.9.2` plugin. This project establishes a baseline before moving the adapter into Modern.js. Shared tree shaking and the new RFC runtime APIs are outside its scope.

## Run

From the repository root, after installing dependencies and building the Modern.js workspace packages:

```sh
pnpm --filter mf-lab-tests dev
pnpm --filter mf-lab-tests test
```

The interactive lab opens at http://localhost:4300. Stop it with Ctrl+C. Add `--production` to the dev script to inspect production builds. Set `MF_LAB_MODE=dev` or `MF_LAB_MODE=production` to run one test mode. Use `PUPPETEER_EXECUTABLE_PATH` to select an existing Chrome installation when needed. Set `MF_LAB_VERBOSE=1` to print child-process logs.

The test command runs the same assertions against Modern development servers and production build + serve. It uses available ports, starts providers before consumers, waits for HTTP readiness, and stops child processes after failures. The root framework suite also discovers these tests.

## Weather comparison pages

The main navigation has three destinations. The original regression routes remain directly accessible for focused tests.

- `/compare`: side-by-side CSR and SSR documents with the same local fixture data. Current weather is a static Modern remote, hourly weather is a dynamically registered Rslib remote, the five-day forecast passes through the nested Modern build, and the wind dial passes through dynamically loaded nested and Rslib builds.
- `/compare-data`: four isolated documents for CSR, SSR, CSR + MF data-fetch and SSR + MF data-fetch. The first two request weather after mounting. The latter two use the real remote `WeatherData.data` loader. SSR + data-fetch includes the API result in its HTML. CSR + data-fetch uses the adapter's `noSSR` component boundary and runs its loader in the browser.
- `/advanced`: weather version replacement, data recovery and lifecycle experiments in one selector.

Both comparison pages fit a desktop viewport. Smaller screens stack the panels. On shorter desktops the decorative air-quality, UV and sunset cards are omitted so the four rendering modules remain visible. The compact four-way comparison omits nested modules.

The shell renders no remote weather components itself. Each panel supplies one animated sky behind its translucent glass header and transparent weather iframe, so the clouds remain continuous across both areas. Standalone weather routes retain their own sky. Each iframe has independent React and MF state and always runs JavaScript. Changing the startup delay or reloading recreates the documents. The default is No delay. The test runner proxies the host and delays the actual host entry script by 0, 1500 or 3000 ms, with caching disabled for that entry. This is a network delay, not a simulated loading screen.

**Data prefetch** defaults to on in the four-way comparison. It calls the existing MF runtime's `prefetch()` while the CSR data route initializes, before React renders its lazy remote. Turning it off reloads the frames and leaves normal data fetching enabled. SSR + data-fetch continues fetching on the server in either mode. With this adapter, CSR prefetch invokes the raw loader without retaining its return value, so the demo's weather loader reuses its promise by MF data key within a browser document. Failed requests are evicted and server requests are never cached. Tests verify one API request per client panel with either setting and fresh requests after reload. Prefetch changes startup behavior, not the final forecast; the difference is visible during loading rather than after all data arrives.

The local API returns deterministic weather after 900 ms and assigns a request ID. It is started and stopped with the test applications. In interactive mode, the public gateway is port 4300, the API is 4306 and the underlying Modern host is 4307. CI allocates these ports independently. Weather icons and procedural cloud imagery are bundled SVG, and fonts use the system stack. No public weather, image, map or font service is required.

Frame messages validate origin and source. Client takeover is reported after mounting, while interaction is only verified after a real save, forecast selection or wind adjustment. Times are measured from each document's navigation start, and data readiness is a client observation rather than a server paint measurement. Tests inspect the raw HTML separately to verify server-rendered content. These are diagnostic timings, not a performance ranking.

The comparison tests check HTML differences, actual API and MF loader use, independent interactive frames, the script-delay response, local-only requests and desktop viewport bounds. The original regression assertions remain in place.

### Inspect remotes

Enable **Inspect** in either comparison page to outline the remote components. Labels show the first remote loaded by the host, its exposed module and registered manifest URL. Re-exported boundaries sharing the same visible element use one outline. Expand the source label to reveal the nested producer and its own manifest link, connected beneath the first source with a producer-colored dot. Escape or a click outside collapses it. Single-source components have no expand control. Hover a link for its full URL and runtime request details.

Colors are generated from a random session palette keyed by the remote container name. All frames and modules from the same remote share one color, and frame reloads keep that color. A re-exported component uses the first remote's color, which stays unchanged when its source chain is expanded.

The host and nested consumer register the same runtime plugin through `runtimePlugins`. Its `apply(instance)` / `onLoad` hooks decorate React component exports using runtime metadata, including dynamically registered remotes. Data loaders are excluded. Module property descriptors preserve named exports and non-enumerable MF module IDs. The React inspection UI loads asynchronously after remote initialization to avoid consuming React during runtime bootstrap.

The decorator keeps a `display: contents` boundary in both SSR and CSR. Inspection adds a portal overlay measured with ResizeObserver rather than changing the weather layout. Toggling it sends origin/source-checked messages into the existing frames and does not remount components, reload documents or fetch weather again. Inspection defaults to off and remains selected across frame reloads.

## Build boundaries

| Source     | Role                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| `host`     | One Modern consumer with routes for both original suites               |
| `provider` | Modern SSR producer with static components and data loaders            |
| `nested`   | An independent Modern build with static and dynamic nested consumption |
| `library`  | Rslib dual-target producer for dynamic loading and CSR data fetching   |

The provider and library each build a second version from the same source, into `provider/dist-v2` and `library/dist/v2`. These are served at separate origins for browser replacement tests. The second Modern version is a CSR build. The library serves real Rslib dual-target build artifacts in both test modes. The primary Modern applications use development servers in dev mode and build + serve in production mode. The SSR producer keeps the default `dist` output because the existing adapter’s development manifest middleware reads that directory.

## Original coverage mapping

Sources are the MF core repository's `apps/modernjs-ssr` and `apps/modern-component-data-fetch`.

| Original scenario                  | Lab route                           | Assertions                                                                                                           |
| ---------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Static remote                      | `/static`                           | Remote HTML in the server response, hydrated interaction, CSS and image origin                                       |
| Dynamic remote                     | `/dynamic`                          | Runtime registration, Rslib SSR, hydrated interaction, CSS                                                           |
| Nested remote                      | `/nested`                           | Real host → nested build → provider chain, SSR, independently split child components and interaction                 |
| Dynamic nested remote              | `/dynamic-nested`                   | Runtime loading at both boundaries, SSR, CSS, async child components and interaction                                 |
| Client routing                     | `/static` ↔ `/nested`               | Back/forward and interaction without a document reload                                                               |
| Static/dynamic version replacement | `/replace`                          | Sunny 24° version one changes to rainy 16° version two through forced registration, with interaction after each load |
| Custom manifest and entry paths    | Provider `/static/mf-manifest.json` | Manifest metadata and accessible server entry                                                                        |
| SSR data fetching                  | `/data`                             | Server data in the first HTML response and hydrated interaction                                                      |
| CSR with server data               | `/csr`                              | Component absent from server HTML, data request through host, forwarded query                                        |
| Client/server downgrade            | `/recovery`                         | Intentional initial failures recover through the two distinct loaders                                                |
| Data-loader lifecycle              | `/lifecycle`                        | Parent rerender preserves data, remount refetches, no-data loader runs once                                          |

Browser page errors fail the tests, except in the intentional recovery scenario. The existing adapter renders an error fallback on the server and recovers data in the browser, so React 19 reports two recoverable hydration mismatches. That test explicitly checks both reports and both successful data results. Other page errors still fail it. No fixed sleeps are used as readiness assertions. The visual design uses local system fonts and bundled styles, with no external image or font requests.

## Dependency baseline

The fixtures pin the existing MF adapter and runtime to 2.9.2. The published bridge package references runtime types without declaring those dependencies. Explicit runtime dependencies, TypeScript paths, and the runtime alias keep the fixture on one version when the workspace also contains older MF examples. No MF or Modern implementation is patched. Remote declaration files describe the fixture contracts, while remote DTS generation remains disabled.
