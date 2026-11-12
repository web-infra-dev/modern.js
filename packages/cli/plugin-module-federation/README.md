# Modern.js Module Federation

The built-in adapter is applied by app-tools when module-federation.config.ts exists. Users install @module-federation/enhanced and configure MF without registering this package manually. Set moduleFederation to false to retain the legacy plugin. Simultaneous activation fails before legacy configuration evaluation.

The adapter preserves the modern-js-v3 2.9.2 component integration and uses matching MF engine, Bridge, Node adapter and related packages. Runtime APIs and types use @module-federation/enhanced/runtime, without extra runtime or runtime-core application dependencies. Bridge application SSR additionally requires the engine's renderer callbacks and shared stream support. Service App deployment uses the same application providers and consumers with private service bindings. Additional shared tree-shaking work remains separate.

The adapter defaults the top-level shareStrategy to loaded-first for browser and server builds. Explicit strategy configuration is preserved for ordinary remotes. Service App bindings reject version-first with a configuration diagnostic because it discovers containers before expose selection. The MF runtime supplies the loaded-first default to shared entries without an extra strategy runtime plugin.

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

The package exports root CLI registration, config-plugin, ssr-plugin, data-fetch-server-plugin, Service HTTP middleware through service, configuration types and package metadata. Injected server and runtime files resolve within the adapter. Runtime aliases use the app context metaName.
The framework MF entry also provides Modern application renderer callbacks and a provider helper.
General runtime APIs continue to come from @module-federation/enhanced/runtime.
The producer registers its framework import with the engine's manifest analyzer.
Service deployment is documented in the [Service App guide](../../document/docs/en/guides/topic-detail/module-federation/service-app.mdx). Coordinated server remote replacement is described below.

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

## SSR cache updates

Set `moduleFederation: { ssr: { cacheUpdates: true } }` in `modern.config.ts` to
enable server ownership tracking and the service-lifetime update manager. Modern
binds the manager to its application resources, including Service ingress and
producer caches. Application code does not need to connect the low-level
`createSSRUpdateAdapter` manually.

This work currently requires the locally built Rspack native binding and matching
JavaScript package with SSR invalidation and `updateEntryExports` support, together
with the matching MF runtime and Modern builds. An unsupported Rspack build is
rejected during configuration. The local validation setup does not imply that
these capabilities are available in an existing published version.

Server code imports the public APIs from `@modern-js/runtime/mf`:

<!-- prettier-ignore -->
```ts
import { shouldUpdateRemote, updateRemotes } from '@modern-js/runtime/mf'

const remote = {
  name: 'shop',
  entry: 'https://cdn.example.com/shop/mf-manifest.json',
}

// Run from compiled Modern server code outside an active SSR request.
if (await shouldUpdateRemote(remote, { revalidate: true })) {
  const result = await updateRemotes([remote], { revalidate: true })
  console.log(result.changed, result.generation)
}
```

`shouldUpdateRemote` returns `Promise<boolean>` and checks candidate deployment
data without changing the active runtime. The registered manifest URL can stay
the same. A supplied `moduleInfo` contains a fresh manifest or provider snapshot.
`updateRemotes` checks again when the operation executes and returns a
`Promise<RemoteUpdateResult>`, including `operationId`, `changed` and the available
generation or reload scope. Both APIs accept `signal`, `revalidate` and
`application`. Use `application` to select the MF application name when several
services share a process and there is no owning request context. The name must
select one service in that case. Same-name services remain isolated by their
owning request context, and ambiguous background selections are rejected. These APIs
require a running Modern server with the capability enabled and do not perform
browser-side remote replacement.

Import these APIs from Modern-compiled server code. A release controller can
trigger that code through an application-controlled endpoint, which must use
the after-response form when its request is owned by the update coordinator. The complete
`mf` entry also exports React and rendering integrations and currently does not
support direct import by an unbundled standalone Node script.

Once an update selects candidate module information, Host runtimes and the
application's Service ingress use that captured snapshot through rebuilding.
User `afterResolve` plugins must preserve its deployment identity. Changes to
request headers and other request policy remain supported. Capturing metadata
does not retain overwritten artifact bytes, so production releases still need
immutable versioned resources.

Provider lookup reuses the MF build identifier derived from its provider name
and manifest `buildVersion`. Concurrent versions of one provider need distinct
build versions, such as a per-release `MF_BUILD_VERSION` supplied during build.
Do not rewrite that manifest field independently of the compiled runtime.

When a selected provider is already used by another application, a new Host
adopts that provider's loaded singleton records of the same package version
before evaluating its renderer. This keeps retained components and the Host on
the same runtime dependencies. Non-singleton dependencies and other package
versions retain their normal MF selection. Conflicting loaded singletons among
the selected providers fail initialization.

An explicit remote `client` entry is embedded in HTML published after that update.
Subsequent updates to that remote must also supply its matching client entry.
Already-issued HTML is unchanged. Keeping those documents usable requires an
initial release mapping and retained immutable browser assets.

Inside an owning SSR request or loader, submit a deferred update instead:

<!-- prettier-ignore -->
```ts
const receipt = updateRemotes([remote], { defer: 'after-response' })
console.log(receipt.operationId, receipt.phase)
```

This overload returns a synchronous `RemoteUpdateReceipt`, not a completion
Promise. It schedules execution after the request's response and registered
producer work settle. A plain update from that active request is rejected because
waiting for its own drain would deadlock. The receipt identifies accepted work,
not successful publication. Its `revision` is diagnostic metadata, not a release
ordering input.

Production performs no automatic discovery or browser reload. A deployment
controller calls these APIs explicitly. Development automatically checks configured
manifest URLs in the background, applies a changed successful build, and only then
asks connected consumer browsers to reload the document. Component, loader and
CSS edits create a new coordinated build version shared by browser and Node
runtime identifiers and manifests. Failed compilation or
publication does not send a success reload, and no extra watcher configuration is
needed after enabling `cacheUpdates` on the cooperating apps.

Service version conflicts use the reserved typed HTTP 409 protocol, not arbitrary
business 409 responses. Modern ingress and Bridge error frames preserve that
protocol. These errors reach the existing error UI without a generic CSR redirect,
because CSR would still use the same Service protocol. In development,
the next successful background update reloads the page, without replaying the
failed Service POST. Production leaves recovery to the application's policy.

The resource owner drains affected response streams and registered producer work
before invalidation. Complete static ownership allows selective entry reloads.
Dynamic consumption or incomplete ownership requires an application rebuild.
A destructive failure can leave SSR unavailable until a later successful update.
Neither cancellation nor an update failure guarantees restoration of already
invalidated application state. Production deployments that retain old HTML also
need matching immutable browser assets and release metadata.

The low-level `createSSRUpdateAdapter` requires explicit runtime ownership.
Execute compiled entry loading and reloading through `adapter.run`, including
`run: adapter.run` in the resource application options. Bind consumers created
through runtime APIs with `adapter.bindRuntime(instance)`. Instances are never
adopted merely because their names match in the global federation registry.
The automatically installed server plugin supplies this ownership for normal apps.

See the [SSR update guide](../../document/docs/zh/guides/topic-detail/module-federation/ssr-update.mdx),
[server coordination contract](../../server/core/SSR_REQUEST_COORDINATION.md)
and [local integration runners](../../../tests/integration/module-federation/ssr-update/README.md)
for examples, validation and limits. The work owner is server-local, including on
Service producers, and is never serialized into Service requests or responses.
