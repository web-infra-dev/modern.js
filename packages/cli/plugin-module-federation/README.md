# Modern.js Module Federation

The built-in adapter is applied by app-tools when module-federation.config.ts exists. Users install @module-federation/enhanced and configure MF without registering this package manually. Set moduleFederation to false to retain the legacy plugin. Simultaneous activation fails before legacy configuration evaluation.

The adapter preserves the modern-js-v3 2.9.2 component integration and uses matching MF engine, Bridge, Node adapter and related packages. Runtime APIs and types use @module-federation/enhanced/runtime, without extra runtime or runtime-core application dependencies. Bridge application SSR additionally requires the engine's renderer callbacks and shared stream support. Service App execution and additional shared tree-shaking work remain separate capabilities.

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
The framework MF entry also provides Modern application renderer callbacks and a provider helper.
General runtime APIs continue to come from @module-federation/enhanced/runtime.
The producer registers its framework import with the engine's manifest analyzer.
Service App execution and remote version replacement remain separate capabilities.

## Modern application SSR

Export a Modern Root through the provider helper to use framework rendering,
loader snapshots and independent hydration with the shared Bridge implementation:

```tsx
import '@modern-js/runtime/registry';
import { createRoot } from '@modern-js/runtime/react';
import { createModernBridgeComponent } from '@modern-js/runtime/mf';

const Root = createRoot({ route: '/product' });
export default createModernBridgeComponent({ rootComponent: Root });
```

The existing `createBridgeComponent` remains available. An explicit equivalent
passes `render`, `hydrate` and `renderStream` from `@modern-js/runtime/mf` to it.
Generic CSR providers do not need these callbacks. The Node build selects the
server callbacks while the browser uses the existing Browser Router, or the
configured Hash Router. Only an explicit `memoryRoute` selects independent memory
navigation.

`route` selects exported content. Mounting this Root at `/inventory` exposes its
detail page at `/inventory/detail/42`. The initial server request, restored loader
data and browser Router use that same mount. The original `/product` path is only
relevant to the producer's standalone application and its separate data endpoints.
Props updates retain the hydrated Root and Router. A changed mount basename
creates a new instance and cleans up the previous one.

The Host adapter supplies request and document lifecycle information to Core's
shared stream engine. It does not implement another consumer or change Router
package aliases. Browser and Node exports use the same application definition,
and browser entrypoints do not import the Node stream engine. Hash navigation
retains its CSR behavior because the initial HTTP request does not carry the URL
fragment.

The initial Modern Bridge SSR validation baseline is React and React DOM 19.3.1,
with matching producer server and browser versions. Unpatched React 18.3.1 has a
Node streaming UTF-8 boundary bug that can emit NUL bytes and corrupt HTML in
development and production. See [React #26228](https://github.com/facebook/react/pull/26228)
and [React #31134](https://github.com/facebook/react/issues/31134). It is outside
the initial SSR support boundary. The adapter does not patch React, strip bytes,
or add a runtime version guard. Existing CSR support remains unchanged.
