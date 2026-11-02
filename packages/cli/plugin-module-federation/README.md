# Modern.js Module Federation

The built-in adapter is applied by app-tools when module-federation.config.ts exists. Users install @module-federation/enhanced and configure MF without registering this package manually. Set moduleFederation to false to retain the legacy plugin. Simultaneous activation fails before legacy configuration evaluation.

The adapter preserves the modern-js-v3 2.9.2 behavior and uses MF preview `0.0.0-feat-bridge-route-navigation-20261028125233` for the engine, Bridge, Node adapter and related packages. Runtime APIs and types use @module-federation/enhanced/runtime, without extra runtime or runtime-core application dependencies. This preview includes the unified React consumers and expose protocol metadata. Bridge SSR, Service App execution and additional shared tree-shaking work remain outside this phase.

The adapter defaults the top-level shareStrategy to loaded-first for browser and server builds. Explicit strategy configuration is preserved. The MF runtime supplies this default to shared entries without an extra strategy runtime plugin.

## Package boundaries

app-tools imports only the activation entry and configuration types. The activation entry checks config presence, explicit disabling, legacy registration and the application's engine dependency before dynamically importing the implementation. Configuration paths are relative to appDirectory.

This package consumes lower-level builder, server and plugin APIs. Its structural CLI interface avoids a runtime, type or build dependency on app-tools or the Modern runtime package. Browser and SSR hooks are internal implementation files. Injected server/runtime entries resolve from this package so applications do not need to declare this adapter as a direct dependency.

## Capability and test mapping

| Existing capability                                                                                          | Implementation                                                    | Coverage                                                                                   |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Config loading, independent CSR/SSR patches, async entries, optimization defaults, producer lazy compilation | src/cli/configPlugin.ts                                           | configPlugin.test.ts, lab activation.test.ts                                               |
| Automatic activation, disabling, inline/custom config and legacy conflict detection                          | src/cli/activation.ts, src/cli/index.ts                           | activation.test.ts, lab activation.test.ts                                                 |
| Browser/server federation, manifests and static asset public paths                                           | src/cli/plugin.ts, src/cli/ssrPlugin.ts                           | ssrPlugin.test.ts, lab rendering.test.ts                                                   |
| Runtime sharing and Node support                                                                             | src/cli/configPlugin.ts                                           | configPlugin.test.ts, lab rendering and fault suites                                       |
| SSR data execution and client-to-server loader calls                                                         | src/ssr-runtime/injectDataFetchFunctionPlugin.tsx, src/cli/server | lab data-fetch.test.ts and error-recovery.test.ts                                          |
| Development remote revalidation and flushing                                                                 | src/ssr-runtime/devPlugin.tsx                                     | lab rendering.test.ts                                                                      |
| Production server chunks, CORS and bounded file caching                                                      | src/server                                                        | staticMiddleware.test.ts, fileCache.test.ts, fileCache.real.test.ts, lab rendering.test.ts |
| Remote replacement, nested loading and runtime plugins                                                       | MF engine and Bridge integration                                  | lab advanced.test.ts and inspect.test.ts                                                   |
| Data prefetch and loader lifecycle                                                                           | MF Bridge integration                                             | lab data-fetch.test.ts and comparison.test.ts                                              |
| DTS and custom output roots                                                                                  | MF engine and config adapter                                      | lab activation.test.ts                                                                     |
| Existing shared tree-shaking switch                                                                          | src/cli/plugin.ts, src/cli/ssrPlugin.ts                           | adapter branch compatibility tests                                                         |

The lab runs development and production build plus serve against independent temporary workspaces. It checks original SSR responses, hydration and real interaction, actual failed HTTP responses, runtime hooks, fallbacks, isolation and restoration. Prefetch benefit uses final real-data paint timestamps from the same navigation origin, with identical controlled component-download delays.

Legacy compatibility remains covered both by the CLI tests and the i18n MF fixtures, which explicitly disable built-in MF.

Direct Bridge imports do not enable the MF engine's automatic router alias by default because Modern owns router integration. An explicit bridge.enableBridgeRouter setting is preserved.

## Verification

From the workspace root:

```sh
pnpm --filter @modern-js/plugin-module-federation build
pnpm --filter @modern-js/plugin-module-federation test
pnpm --filter @modern-js/app-tools build
pnpm --filter @modern-js/app-tools test
pnpm --filter mf-lab-tests test
MF_LAB_MODE=dev pnpm --filter mf-lab-tests test tests/data-fetch.test.ts -t prefetch
```

Select an existing Chrome installation with PUPPETEER_EXECUTABLE_PATH if required. Build outputs, dependencies and writable caches belong to the task worktree. Keep errors strict outside explicitly asserted fault scenarios.

Applications use createBridgeComponent, createReactRemote and ReactRemote from
@modern-js/runtime/mf. Modern supplies Bridge, while applications install Enhanced.
Direct Bridge imports remain supported for existing integrations.

The package exports root CLI registration, config-plugin, ssr-plugin, data-fetch-server-plugin, configuration types and package metadata. Injected server and runtime files resolve within the adapter. Runtime aliases use the app context metaName.
The framework MF entry only exposes the three React APIs and their types.
General runtime APIs continue to come from @module-federation/enhanced/runtime.
The producer registers its framework import with the engine's manifest analyzer.
Bridge SSR, Service App execution and remote version replacement are separate capabilities.
