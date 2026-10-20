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
