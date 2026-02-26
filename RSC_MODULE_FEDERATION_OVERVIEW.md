# Module Federation + RSC Technical Specification (Current Branch)

This document describes how Module Federation + React Server Components (RSC)
works in this branch based on actual implementation.

Primary implementation paths:
- `packages/modernjs-v3/src/cli/index.ts`
- `packages/modernjs-v3/src/cli/configPlugin.ts`
- `packages/modernjs-v3/src/cli/ssrPlugin.ts`
- `packages/modernjs-v3/src/cli/mfRuntimePlugins/*`
- `packages/modernjs-v3/src/runtime/rsc-bridge-expose.ts`
- `packages/modernjs-v3/src/runtime/rsc-client-callback-bootstrap.js`
- `packages/runtime/render/src/client/callServer.ts`
- `packages/runtime/render/src/server/rsc/rsc.tsx`
- `packages/server/core/src/adapters/node/plugins/resource.ts`
- `packages/modernjs-v3/src/server/*`
- `tests/integration/rsc-mf/*`

## 1) Runtime Components and Responsibilities

The system has four cooperating parts:

1. Config/build patching
- Implemented by `moduleFederationConfigPlugin` and `moduleFederationSSRPlugin`.
- Converts user MF config into CSR/SSR target-specific configs and runtime plugin stacks.

2. Host runtime bridge
- Implemented by `rsc-bridge-runtime-plugin`.
- Loads the remote bridge expose, merges manifest metadata into host runtime manifest,
  and creates proxy action modules.

3. Remote runtime bridge
- Implemented by `rsc-bridge-expose`.
- Exposes `{ getManifest, executeAction }` so host can discover and execute remote actions.

4. Client/server action transport
- Client: `callServer.ts` plus callback bootstrap resolver.
- Server: `rsc.tsx` action endpoint (`x-rsc-action` based dispatch).

## 2) Build-Time Specification

### 2.1 Plugin entry wiring

`moduleFederationPlugin` in `packages/modernjs-v3/src/cli/index.ts`:
- Initializes shared mutable plugin options (`csrConfig`, `ssrConfig`, plugin refs).
- Registers browser MF plugin on web target.
- Registers server runtime plugin `@module-federation/modern-js-v3/server`.
- Chains:
  - `moduleFederationConfigPlugin(...)`
  - `moduleFederationSSRPlugin(...)`

### 2.2 Config loading and cloning

`getMFConfig` in `configPlugin.ts`:
- Source precedence:
  1. `userConfig.config` if provided.
  2. else `module-federation.config.ts` from project root.
- Uses `jiti` with ESM resolve enabled.

`moduleFederationConfigPlugin`:
- Creates isolated CSR and SSR copies of MF config (`csrConfig`, `ssrConfig`).
- Applies target-specific patching per bundler chain target (`web` vs non-web).

### 2.3 Required contracts and enforced invariants

In `patchMFConfig` and `assertRscMfConfig`:
- `mfConfig.name` is required, otherwise throws.
- If `experiments.rsc === true`, then:
  - `experiments.asyncStartup` must be `true`.
  - server runtime plugin list must include `@module-federation/node/runtimePlugin`.
- Default `remoteType` becomes `'script'` when unset.

### 2.4 Runtime plugin injection rules

`patchMFConfig` injects:
- Always:
  - `@module-federation/modern-js-v3/shared-strategy`
- SSR + dev only:
  - `@module-federation/modern-js-v3/resolve-entry-ipv4`
- RSC enabled and remotes present:
  - `rsc-bridge-runtime-plugin` (resolved local/esm/cjs path)
- Server target only:
  - `@module-federation/node/runtimePlugin`
  - `@module-federation/node/record-dynamic-remote-entry-hash-plugin` (dev only)
  - `@module-federation/modern-js-v3/inject-node-fetch`

### 2.5 RSC expose normalization

`setRscExposeConfig` in `configPlugin.ts`:
- For each user expose (except internal bridge expose):
  - Prepends `RSC_CLIENT_CALLBACK_BOOTSTRAP_MODULE` to expose import list.
  - Sets `layer = 'react-server-components'`.
- Ensures internal expose exists:
  - `./__rspack_rsc_bridge__ -> rsc-bridge-expose` module, same RSC layer.

### 2.6 Dev server and source defaults

`moduleFederationConfigPlugin` config output:
- Sets `REMOTE_IP_STRATEGY` define always.
- Sets `FEDERATION_IPV4` define in SSR dev mode.
- When exposes exist, adds wildcard CORS headers for dev server.
- Sets `source.enableAsyncEntry` to:
  - explicit user value if provided
  - else `!enableRsc` fallback

## 3) Server-Side Loading and Static Asset Support

### 3.1 Strategy-based bundle loading in server-core

`packages/server/core/src/adapters/node/plugins/resource.ts`:
- Introduces strategy registry:
  - `registerBundleLoaderStrategy`
  - `getBundleLoaderStrategies`
- `loadBundle(filepath)` algorithm:
  1. `require` / `compatibleRequire`
  2. if immediate non-promise export: return
  3. if promise export: await once
  4. if unresolved/error: iterate registered strategies
  5. if still unresolved: log and return `undefined`

### 3.2 Async-startup loader strategy

`packages/modernjs-v3/src/server/asyncStartupLoader.ts`:
- Detects async-startup signature:
  - `var __webpack_exports__ = __webpack_require__.x();`
  - and `__webpack_require__.mfAsyncStartup`
- Rewrites call to:
  - `__webpack_require__.x({}, [])`
- Executes patched bundle in VM context and returns exports.

### 3.3 Server plugin registration

`packages/modernjs-v3/src/server/index.ts`:
- Registers `mfAsyncStartupLoaderStrategy` globally into server-core loader registry.
- In production:
  - adds static middleware serving only `/bundles/*.js|.json`
- Optional:
  - adds wildcard CORS middleware when `MODERN_MF_AUTO_CORS` is set.

## 4) RSC Bridge Protocol

### 4.1 Internal bridge expose

Remote exposes:
- Key: `./__rspack_rsc_bridge__`
- Interface:
  - `getManifest(): ManifestLike`
  - `executeAction(actionId: string, args: unknown[]): Promise<unknown>`

`ManifestLike` shape:
- `serverManifest?: Record<string, any>`
- `clientManifest?: Record<string, any>`
- `serverConsumerModuleMap?: Record<string, any>`

### 4.2 Host merge behavior

In `rsc-bridge-runtime-plugin.ts`, `ensureRemoteAliasMerged(alias, args)`:
1. Ensure single in-flight merge per alias via `aliasMergePromises`.
2. Install proxy module ID:
   - `__modernjs_mf_rsc_action_proxy__:<alias>`
3. Load remote bridge:
   - `${alias}/__rspack_rsc_bridge__`
4. Read remote manifest and merge into host `__webpack_require__.rscM`.
5. Track alias as merged (`mergedRemoteAliases`).

### 4.3 ID namespacing and mapping

Module ID namespace:
- `remote-module:<alias>:<rawModuleId>`

Action ID namespace:
- `remote:<alias>:<rawActionId>`

Why these are different namespaces:
- `remote-module:*` is used for module identity inside `clientManifest` and
  `serverConsumerModuleMap` (module graph identity).
- `remote:*` is used for server action references in `serverManifest` and
  request header `x-rsc-action` (action invocation identity).
- Keeping them distinct avoids conflating module resolution IDs with action
  dispatch IDs, even when both originate from the same remote alias.

Action remap map:
- global key: `__MODERN_RSC_MF_ACTION_ID_MAP__`
- semantics:
  - `rawActionId -> remote:<alias>:rawActionId` when unique
  - `rawActionId -> false` when collision across remotes is detected

Conflict policy:
- `assertNoConflict` throws if two remotes produce different payloads for same manifest key.

## 5) Client Action Dispatch Specification

### 5.1 Core call path

`packages/runtime/render/src/client/callServer.ts`:
- `requestCallServer(id, args)`:
  - resolves action ID through global resolver key `__MODERN_RSC_ACTION_RESOLVER__`
  - endpoint:
    - `'/'` for `main`/`index`/missing entry
    - else `/${window.__MODERN_JS_ENTRY_NAME}`
  - request:
    - `method: POST`
    - header `Accept: text/x-component`
    - header `x-rsc-action: <resolved-action-id>`
    - body `encodeReply(args)`

Branch history note:
- This resolver indirection is new on this branch.
- On `main`, `callServer` sent the incoming action ID directly in
  `x-rsc-action` with no global remap hook.

### 5.2 Bootstrap resolver and callback install

`rsc-client-callback-bootstrap.js`:
- Calls `setResolveActionId(resolveActionId)` once.
- Repeatedly installs `setServerCallback` into discovered client.browser runtimes.
- Hooks webpack chunk loader (`__webpack_require__.e`) to re-install callbacks after late chunk loads.

Branch history note:
- `rsc-client-callback-bootstrap.js` and the chunk-loader hook are added on this
  branch (not present on `main`).
- The hook is a runtime compatibility workaround to catch callbacks loaded after
  initial bootstrap. A cleaner long-term option would be a first-class runtime
  lifecycle event from federation/runtime instead of patching `__webpack_require__.e`.

`resolveActionId(id)` behavior:
1. If already prefixed (`remote:`), return as-is.
2. If remap entry is string, return mapped prefixed ID.
3. If remap entry is `false`, return raw ID.
4. Else:
  - attempts fallback alias resolution when a single remote alias can be inferred,
  - otherwise waits briefly on remap waiters map.

## 6) Server Action Execution Specification

`packages/runtime/render/src/server/rsc/rsc.tsx`:
- Reads header `x-rsc-action`.
- Loads action via `loadServerAction(serverReference)`.
- Decodes args:
  - `multipart/form-data` -> `decodeReply(formData)`
  - else text -> `decodeReply(text)`
- Executes action (`await Promise.resolve(action.apply(null, args))`).
- Renders response stream via `renderToReadableStream`.

Error behavior:
- Missing action header: `404`.
- Decode failure: `400`.
- Execution failure: `500`.
- In development, `500` includes error message/stack in body.

## 7) SSR Remote Entry URL Normalization

In `rsc-bridge-runtime-plugin.ts`:
- Snapshot patching normalizes:
  - `ssrPublicPath`
  - `remoteEntry.path`
  - `ssrRemoteEntry` fallbacks from snapshot metadata
- If remote entry is broken (`undefined`, empty, malformed), plugin attempts to reconstruct from snapshot fields.
- Node-like runtime branch may prefix entry path with `bundles/` when `ssrRemoteEntry` is missing.

Recommendation:
- Preferred steady-state is to require a complete snapshot contract (non-undefined
  `ssrRemoteEntry`/public path fields) from upstream runtime metadata.
- Current reconstruction logic exists for compatibility with incomplete snapshots
  seen in practice; it should be reduced/removed once snapshot completeness is guaranteed.

## 8) Fixture Specification (`tests/integration/rsc-mf`)

Host config (`tests/integration/rsc-mf/host`):
- `server.rsc = true`
- `source.enableAsyncEntry = false`
- `moduleFederationPlugin({ ssr: true })`
- remote manifest URL uses `RSC_MF_REMOTE_PORT` and points to `/static/mf-manifest.json`

Remote config (`tests/integration/rsc-mf/remote`):
- `server.rsc = true`
- `server.ssr = true`
- `source.enableAsyncEntry = false`
- `output.assetPrefix = http://127.0.0.1:${remotePort}`
- MF exposes include server/client components + actions.
- MF experiments include:
  - `asyncStartup: true`
  - `rsc: true`

Tested contracts:
- Remote server components render in host RSC route.
- Remote client components hydrate and function in host page.
- Remote actions execute via host endpoint and carry expected action headers.
- Expose list includes user exposes plus `./__rspack_rsc_bridge__`.

## 9) Known Caveats (Current State)

1. Fallback alias auto-prefixing
- In the bootstrap resolver, unresolved raw IDs may be auto-prefixed to a fallback alias when one remote is detectable.
- This can misroute host-local actions in mixed host+remote pages.

2. Double `bundles/` risk
- SSR entry normalization can build `.../bundles/bundles/...` URLs for certain snapshot/publicPath combinations.

3. Collision path with `false` remap values
- On raw action ID collisions across remotes, remap map stores `false`.
- Resolver then sends raw ID, while host manifest action keys are namespaced (`remote:<alias>:...`), causing unresolved lookup without explicit disambiguation.

## 10) Practical Integration Rules

Use these rules to avoid known failure modes:
- Always set `experiments.asyncStartup = true` when using `experiments.rsc = true`.
- Keep unique action IDs across remotes when possible.
- Keep remote snapshot fields complete (`publicPath` and remote entry metadata) in SSR.
- For fixture-like setups, keep `source.enableAsyncEntry = false` for host and remote until async-entry semantics are explicitly validated for your target.
