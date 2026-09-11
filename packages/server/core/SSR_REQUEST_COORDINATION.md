# SSR request coordination and application publication (R2 / R3 / R4)

`createSSRRequestCoordinator` is exported from `@modern-js/server-core/node`.
It coordinates one application owner in one Node process. It does not replace
the HTTP server or restart the process, and introduces no worker orchestration.

`createProdServer({ ssrApplication })` now installs an opt-in application owner
before resource selection and all direct/plugin request middleware. Without this
option the existing request path is retained. Ordinary HTML SSR and standalone
data loaders are supported; RSC is outside scope. This is the application rebuild
path, not the final MF update API or static dependency planner.

## Application publication (R3)

`SSRResourceApplicationOptions` requires the three coordinator limits and an
`onReady(application)` callback. The callback receives `status` and
`update(invalidate)`. The control plane invokes update outside request handling.
The application owner drains existing work, awaits the bundler/remote invalidator,
awaits `dispose(previousResources)`, reloads the declared CommonJS render/loader
roots, rereads templates and JSON manifests, creates a fresh renderer, validates
entry handlers and optional loader bundles, and publishes all resources together.
The HTTP server, port, process, server plugins and logical MF instance remain.

The invalidator owns transitive bundler state and remote changes; `dispose` owns
adapter detachment and application-owned cleanup. They must preserve shared
factories and support explicit retries. `dispose` must release all live adapters
owned by this application, including adapters installed by an unsuccessful create;
a failed create invokes it again before reporting the error. It must not dispose
other applications or the persistent MF control plane. Modern only evicts declared
application roots using canonical `require.resolve` keys. It does not walk and
delete every Node dependency or automatically undo business globals/listeners.

New requests choose templates, manifest, renderer and work context after admission.
Each publication also gets a unique HTML-cache namespace (including custom keys
and custom cache containers); old values expire by their existing TTL and cannot
be served by the new generation. Namespaces are process-local, so separate owners
no longer reuse each other's HTML cache entries when this mode is enabled.
No cache backend flush or broad Node cache deletion is performed.

An optional `validate(resources)` checks the unpublished generation directly.
It must await its complete validation work and must not call back through gated
HTTP requests. Concurrent entry preparation settles before failure is reported.
Missing/invalid SSR handlers, templates, existing loader bundles and malformed
JSON manifests reject publication. Native ESM application entry roots are rejected;
Modern's own ESM distribution may still load the explicitly CommonJS app roots.
After a mutation/preparation failure SSR stays unavailable until an explicit retry;
there is no rollback promise or artificial mutation timeout.

`bypass(request)` may return a Response directly for trusted static/liveness
handlers. Returning undefined enters normal admission. The bypass cannot fall
through to application middleware and must not access application-owned resources.
Without an explicit bypass, requests (including static/API routes) are admitted
through this application-wide owner. Scope-based admission is opt-in through the R4 hooks documented below. A readiness
handler can consult `status`; liveness must not imply readiness during failed
publication. No guessed production queue/time-limit defaults are introduced.

The MF adapter and final remote-update API will compose these hooks. The production
artifact test already supplies the real companion runtime's adapter disposal and
remove/register operations, including failed-candidate cleanup. The companion MF R4 adapter supplies the
static dependency planner and selective path; R5 owns API migration; R6 remains
responsible for the complete deployment/hydration/load/resource acceptance matrix.

## Development branches

Modern SSR cache work integrates into `feat/mf-ssr-clear-cache`, created directly
from `main` at `4af5bf05b6513ee396419fada27f304880c15b67` on 2026-09-10.
Start subsequent Modern work branches from this integration branch and target all
related PRs at it. PR #8861 is rebased onto it; the unrelated
`fix/ssr-chunk-loading-global` commits are not included.

## Ownership contract

An owner constructs a coordinator with explicit `maxPendingRequests`,
`requestTimeoutMs` and `drainTimeoutMs`. There are no unmeasured production
defaults. `handle(request, render)` must wrap selection of the current resources,
loader and renderer. Selecting a handler before entering the gate can serve a
stale generation even if the gate itself is correct.

The callback receives `work.track(promise)`. Register the complete promise chain
for producer/loader work which can outlive the callback or its Response. A tracked
promise remains leased until it settles, including after disconnect or stream
cancellation. Register dependent work before its parent work settles; calling
`track` after the lease finishes is an error. Merely tracking React shell readiness
or returning a Response is insufficient. Arbitrary unregistered business tasks
cannot be discovered automatically.

The coordinator also retains transport ownership until the response body reaches
EOF, errors, or finishes cancellation. The stream wrapper respects backpressure
and does not pre-read the body. Request disconnect cancels its body reader; that
only settles transport ownership. It does not settle independently tracked
producer work. Waiting requests are not rendered and their bodies are not read
by the coordinator.

`update(publish)` serializes operations without coalescing callers. Each operation
closes admission, drains existing leases, invokes the callback, then opens
admission after successful publication. The returned integer is a local serving
generation count, not a remote version or an MF applied-revision API. The callback
must complete validation/publication before resolving. Validate inputs before
calling `update`; the callback may perform irreversible cache mutation.

Drain timeout happens before mutation and restores the preceding serving state.
A callback failure keeps the application unavailable and returns 503 to waiters
and new requests. A subsequent explicit update can recover it. The coordinator
does not promise rollback or timeout an operation which may still be mutating.
Waiters have independent cancellation and a total deadline across repeated wakes;
queue overflow/timeout/unavailability produce 503 with Retry-After. Waking
requests recheck admission before registering a lease.

Calling update from an active request, nesting updates, or entering the gate to
warm up a generation from its own update is rejected to prevent self-waiting.
Warm up the unpublished generation directly. AsyncLocalStorage only detects local
calls in the same context; arbitrary HTTP calls back into the application need
application-level discipline.

Static/liveness traffic should bypass this application-owner gate. Route-specific
ownership, readiness policy, and actual Modern resource switching belong to the
integration phase; this primitive does not infer routes or mutate MF remotes.

## Renderer and loader integration

`RenderOptions.work` is forwarded to `RequestHandlerOptions.work` and the stream
renderer. The runtime request's existing AsyncLocalStorage scope carries it into
nested-route loaders. This explicitly supplied object avoids introducing a second
global request context or an MF-wide HTTP gate.

Node rendering independently reports React all-ready, rejects normal and fallback
template errors, forwards Request abort and body cancellation to React, and tears
down the registered stream chain. It tracks template continuations, React's
rendering lifetime and each exposed extender stream. Both Node and Web rendering
keep the output open until deferred scripts settle and suppress writes after
cancellation. Deferred failures wait for the other registered tasks as well.

Nested-route work registers before invoking the business loader/preload, retains
ownership throughout the loader continuation, and tracks original returned values
before DeferredData wraps them in a cancellation race. A late task whose request
lease has ended is rejected before invoking business code. An aborted deferred
wrapper does not prove its original producer stopped.

The HTML cache forwards cancellation to its input reader, awaits writer
backpressure, propagates stream errors and waits for asynchronous cache writes.
Stale-while-revalidate work is registered even though the HTTP caller receives
cached HTML immediately. An update cannot overtake that old generation's cache
write. The opt-in application owner isolates HTML cache keys across generations; draining
a write alone would not invalidate previously cached HTML.

## Remaining integration boundaries

- RSC, Flight producers, tee branches and RSC payload injection are outside this
  RFC's implementation and acceptance scope, as explicitly agreed on 2026-09-10.
  They do not block R2 or R3. The scope covers ordinary HTML SSR, including its
  React streaming, loaders, remote consumption and HTML caches.
- Extenders can expose their Node stream lifecycle, but arbitrary work hidden
  behind a custom destroy callback or unrelated task is not automatically tracked.
  Custom renderers/producers must register their complete tasks explicitly.
- Nested-route preload imports are tracked. Arbitrary business `React.lazy`,
  background remote loading and imports outside that path must be registered by
  their owner; aborting React cannot cancel their underlying promises. The React
  test intentionally registers its independent lazy-import promise explicitly.
- R3 now supplies admission, work propagation and application-resource publication
  when explicitly enabled. The R4 hooks below provide selective publication; the final MF update API
  remains R5 work.

The Node HTTP adapter already propagates response close to Request.signal. The
new renderer handling consumes that signal without equating disconnect with a
successful drain. No deployment worker rotation or process restart is introduced.

## Validation (2026-09-10)

Baseline: Modern `1340e9c1bc` (`fix/ssr-chunk-loading-global`). Initial work
used `46967f66c0`; the branch was rebased onto the updated remote, dependencies
were installed from its frozen lockfile, and the full package tests/build reran.

Commands executed from the Modern repository:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @modern-js/server-core test -- requestCoordinator.test.ts
pnpm --filter @modern-js/server-core test
pnpm --filter @modern-js/server-core build
pnpm exec biome check packages/server/core/src/adapters/node/requestCoordinator.ts packages/server/core/src/adapters/node/index.ts packages/server/core/tests/adapters/requestCoordinator.test.ts packages/server/core/tests/adapters/requestCoordinator.http.test.ts
pnpm exec changeset status
git diff --check
```

Final package run: 39 tests pass, zero failures/skips; package build and touched
source/test lint and changeset planning pass. The fixed Modern release group may
expand the minor release beyond the single package in this changeset. An initial
Changesets output-file invocation resolved the absolute path under the repository
and failed; the plain status rerun succeeds. The tests cover queue limits/deadlines/cancellation,
drain-before-mutation timeout, failed publication and retry, serialized updates,
self-wait rejection, tracked rejection, body backpressure, and real HTTP streaming
disconnect. The HTTP test keeps a producer leased after client disconnect, waits
for its explicit completion, and serves the new response on the same PID/port.

An initial test held its first response unread and consequently blocked the next
drain; the final test consumes it and checks safe serialization. This was a test
ownership error, not justification to release streams early. No tests were
weakened to treat shell or disconnect as completion.

Full framework/builder E2E and runtime/Rspack/MF suites are not rerun: this change
is an opt-in server-core primitive, with no default renderer integration or
compiler changes. Existing MF baseline tests do not prove this new gate works;
the real HTTP test above exercises it explicitly. No publish commands were run.

## Follow-up validation: renderer lifecycle (2026-09-10)

The follow-up remains on the same PR/branch; it does not wait for the foundation
PR to merge. Regression tests first reproduced template hangs and unhandled
rejections, cache cancellation/error/write races, and premature release of a
loader continuation. Initial route test setup needed the JSX React binding;
that setup failure is not evidence of a product failure.

The HTML stream tests run real React Node and Web rendering with template/context
fixtures. The Web test alias supplies React Web rendering in place of the RSC
entry. RSC validation is outside the agreed scope. React 19 waits for a
potential document preamble when Suspense is at the root; the streaming fixture
uses an application DOM container to obtain a real shell before pending content.
Two real HTTP cases receive the shell, disconnect, keep deferred work leased,
and publish new responses on the same PID and port.

Commands for this follow-up (from Modern unless indicated):

```sh
pnpm --filter @modern-js/runtime exec rstest run tests/ssr/streamLifecycle.test.tsx --reporter verbose --testTimeout 4000
pnpm --filter @modern-js/runtime-utils exec rstest run tests/universal/routeWork.test.ts --testTimeout 3000
pnpm --filter @modern-js/server-core exec rstest run tests/plugins/cacheWork.test.ts --testTimeout 3000
pnpm --filter @modern-js/server-core test
pnpm --filter @modern-js/runtime-utils test
pnpm --filter @modern-js/runtime test
pnpm --filter @modern-js/server-core build
pnpm --filter @modern-js/runtime-utils build
pnpm --filter @modern-js/runtime build
pnpm exec biome check $(git diff --name-only -- '*.ts' '*.tsx' '*.mts') packages/runtime/plugin-runtime/tests/ssr/streamLifecycle.test.tsx packages/runtime/plugin-runtime/tests/ssr/fixtures/renderSSRStream.ts packages/toolkit/runtime-utils/tests/universal/routeWork.test.ts packages/server/core/tests/plugins/cacheWork.test.ts
pnpm exec changeset status
git diff --check
# From /Users/bytedance/outter/core:
SSR_CACHE_STRICT=1 SSR_CACHE_RSPACK_ENTRY=/Users/bytedance/outter/rspack/packages/rspack/dist/index.js SSR_CACHE_MODERN_ENTRY=/Users/bytedance/work/modern.js/packages/server/core/dist/cjs/adapters/node/index.js node --test tools/ssr-cache/baseline.test.cjs
```

The strict local-Rspack/Modern artifact baseline reports 13 tests passing, zero
skips/TODOs/failures in this invocation. It complements the renderer tests; it does
not exercise RSC or the not-yet-installed default application owner. Full framework
and builder E2E and the MF-wide Cypress matrix are not run for this follow-up;
production-generation switching remains to be integrated, and the targeted
artifact/HTTP checks do not replace its future E2E acceptance. No publication.

Final affected-package results: server-core 42/42, runtime-utils 87/87, runtime 61/61; zero failed/skipped tests. All three builds and declaration generation, touched-file Biome, Changesets planning and diff checks pass. The runtime-utils test runner emits a MaxListenersExceededWarning about 11 `modified` listeners; it is recorded rather than suppressed and is not treated as a proven application memory leak or a resolved issue.

A delayed reader-cancellation regression additionally proved that repeated Web cancellation must return the same tracked cancellation promise. The final renderer suite includes 17 lifecycle cases, including this handshake; the final full runtime suite is 61/61.

## Scope decision (2026-09-10)

RSC is explicitly excluded by the user. Continue with ordinary SSR admission,
application-resource ownership, same-process rebuilding and targeted invalidation.
Arbitrary unregistered business background work remains an explicit boundary of
the work-registration contract, rather than a requirement to discover every
possible asynchronous side effect. This scope change is documentation-only;
`git diff --check` was run, and code tests/builds were not repeated because no
runtime or test behavior changed.

## Integration-base validation (2026-09-10)

The four SSR cache commits were rebased from `1340e9c1bc` onto the new integration
branch at `4af5bf05b6`. There were no conflicts. The PR retains the same 24-file
scope, and the custom chunk-loading-global fix from the previous base is absent.
The integration branch itself starts at main, without those feature commits.

After `pnpm install --frozen-lockfile --ignore-scripts`, all three full package
`test` and `build` commands listed above were rerun against the main-derived 3.9.0
dependencies: server-core 42/42, runtime-utils 87/87, runtime 61/61. Builds and
declarations pass. Also rerun:

```sh
pnpm exec biome check $(git diff --name-only feat/mf-ssr-clear-cache...HEAD -- '*.ts' '*.tsx' '*.mts')
pnpm exec changeset status
git diff --check
```

The exact strict local-Rspack/Modern baseline command above was rerun with the new
Modern artifacts: 13/13, no skips/TODOs/failures. The previously recorded
runtime-utils test-runner listener warning remains. Full framework/builder E2E
and the MF-wide Cypress suite were not rerun for this base correction; affected
package tests/builds and the cross-repository artifact regression were used.
RSC remains outside scope. No release or merge was performed.


## R3 verification (2026-09-10)

The current branch starts at integration commit `3d6b2f910d` (merged #8861) and
continues targeting `feat/mf-ssr-clear-cache`. Tests exercise real ServerBase and
createProdServer request chains, not only the coordinator primitive. The CJS
artifact tests are explicit commands after build, outside the Rstest module loader.
On macOS, a first experiment used a noncanonical temporary-directory cache key;
using `require.resolve` fixes that defect. The owner now performs this itself.

The production MF test exposed an additional cross-layer bug: a dynamic registration
name can differ from the provider name in `Shared.from`, and dynamic remotes have
no compile-time remoteInfos. Both runtime-core and the bundler cleanup hook must
resolve this ownership from the runtime registration/resolved container metadata.
Without the companion MF repair the strict shared-identity assertions fail even
though the earlier 13-case baseline passes. The assertions were kept. No Rspack
source or dependency lockfiles were changed for this repair.

Commands (Modern repository unless indicated):

```sh
pnpm --filter @modern-js/server-core exec rstest run tests/adapters/application.test.ts
pnpm --filter @modern-js/plugin-data-loader exec rstest run tests/requestWork.test.ts
pnpm --filter @modern-js/server-core test
pnpm --filter @modern-js/plugin-data-loader test
pnpm --filter @modern-js/server-core build
pnpm --filter @modern-js/plugin-data-loader build
pnpm --filter @modern-js/prod-server build
node --test packages/server/core/tests/application.http.test.cjs
NODE_ENV=production SSR_CACHE_RSPACK_ENTRY=/Users/bytedance/outter/rspack/packages/rspack/dist/index.js SSR_CACHE_MF_ROOT=/Users/bytedance/outter/core node --test packages/server/core/tests/application.mf.test.cjs
pnpm exec biome check $(git diff --cached --name-only -- '*.ts' '*.tsx' '*.mts' '*.cjs')
pnpm exec changeset status
git diff --check
```

The native HTTP tests cover new-resource selection, cached HTML isolation, loader
replacement, direct/pre middleware admission, same PID/port, invalid publication,
retry, native ESM rejection, and waiting for concurrent entry initialization.
The MF artifact test compiles v1/v2/v3 before serving, then updates without host
recompilation or recreating the HTTP server. It asserts queued HTTP requests get
the new version, host/provider shared references remain identical, the logical
MF instance is reused, old/failed adapters are detached, one current adapter remains,
and a business global written by v1 still exists. Failed warmup yields 503 and a
successful explicit retry restores v3.

Standalone loader regressions also cover its work context, cancelled deferred
responses, abort after one field settled, and serialization failure. Response
subscription completion does not settle an independent original business Promise.

Full framework/builder E2E, browser hydration/Cypress, load tests and RSC are not
included in this R3 run. RSC is explicitly excluded; the other broad acceptance
checks remain R6 rather than being represented as passed. The prod-server package
has no unit-test suite; its actual createProdServer entry is exercised above.
No publish commands are run. Exact final counts are recorded with the PR.


Final R3 results: server-core 46/46; plugin-data-loader 10 passed and one existing
skipped case (`should return directly when routeId not exist`). All three affected
package builds and declarations pass. Native HTTP artifacts: 3/3; production MF
artifact: 1/1; prior strict Rspack/Modern baseline: 13/13, with no skips/TODOs.
The companion MF repair passes runtime-core 138/138 and bundler runtime 122/122.
Its repository-wide Prettier gate still reports 683 existing/generated or unrelated
user-dirty files; its changed files pass. This is recorded rather than broad-formatting
the workspace. The production MF test requires both companion repository paths and
fails if they are omitted; it is not silently skipped by the package unit runner.


## Selective entry publication (R4, 2026-09-11)

`resolveScope(request)` returns the complete list of entry names used by a request,
or undefined when unknown. It runs before admission; resources are selected after
admission. Unknown leases intersect every update. `update(invalidate, scope)`
accepts either entry names or a synchronous plan factory evaluated inside the
serialized queue, before closing admission. The invalidator receives the effective
scope; undefined means whole application. Empty scopes and selective updates
without a classifier are rejected before mutation.

`reloadEntry(entryName)` is required with a classifier. On selective publication,
Modern reacquires only selected render and standalone-loader exports through this
callback, without evicting their CommonJS bundle roots. The MF adapter supplies
this callback using the compiler's original entry module in its existing runtime.
`dispose(resources, entries)` and invalidation receive the same effective scope.
Selected maps are replaced atomically; unrelated resources and their HTML-cache
namespaces remain available. Unknown or multi-entry requests use a fresh general
namespace on every publication. A renderer rewrite across the admitted entry
boundary returns 503 before selecting that entry's resources.

Drain includes intersecting response bodies and tracked producers, including unknown
requests. Unaffected requests remain admitted while a scope drains or is unavailable.
A failed mutation/publication keeps the affected scope unavailable; the next explicit
retry expands to whole application so partially replaced resources are never treated
as a valid baseline. A drain timeout occurs before mutation and restores prior state.

The companion `@module-federation/modern-js-v3` adapter owns the MF-specific graph,
static-consumption contract and fallback reasons. Modern server-core has no MF
package dependency or Rspack-specific compiler code. Routing/classifier correctness
and custom middleware consumption remain the application's contract. Several routes
inside a shared Modern entry update together; R4 does not claim arbitrary route-level
isolation. Dynamic consumption and incomplete metadata use the R3 whole-application
path while keeping the HTTP server, PID and port.

### R4 verification

Worktrees: `/private/tmp/modern-r4-static-update` and
`/private/tmp/mf-r4-static-update`. Compiler preview:
`2.2.3-canary-76e8f696-20260911033013`. Commands from Modern:

```sh
pnpm --filter @modern-js/server-core... build
pnpm --filter @modern-js/prod-server... build
pnpm --filter @modern-js/server-core test
SSR_CACHE_MF_ROOT=/private/tmp/mf-r4-static-update node --test packages/server/core/tests/application.static-mf.test.cjs
SSR_STATIC_NUMERIC=1 SSR_CACHE_MF_ROOT=/private/tmp/mf-r4-static-update node --test packages/server/core/tests/application.static-mf.test.cjs
SSR_STATIC_OPTIMIZE=1 SSR_CACHE_MF_ROOT=/private/tmp/mf-r4-static-update node --test packages/server/core/tests/application.static-mf.test.cjs
NODE_ENV=production node --test packages/server/core/tests/application.http.test.cjs
NODE_ENV=production SSR_CACHE_RSPACK_ENTRY=/private/tmp/mf-r4-static-update/node_modules/@rspack/core/dist/index.js SSR_CACHE_MF_ROOT=/private/tmp/mf-r4-static-update node --test packages/server/core/tests/application.mf.test.cjs
pnpm exec biome check $(git diff --name-only -- '*.ts')
pnpm exec changeset status
git diff --check
```

Server-core: 49 tests pass. Native static cases each pass, including loader replacement,
shared ancestor entries, HTML cache isolation, unrelated module identity, pending
producer drain, cross-entry rewrites, failure/retry and dynamic fallback. HTTP
regression: 3 pass; production dynamic MF regression: 1 pass. Numeric IDs plus
minification retain selective updates. Module concatenation exposes an incomplete
native ancestor closure in this preview: the test asserts explicit
`incomplete-parent-closure` whole-application fallback and successful replacement,
not selective success. No compiler graph is fabricated to bypass this limitation.

The fixture uses real Rspack artifacts and Modern ServerBase/render/resource/cache
plugins; the production dynamic regression additionally exercises createProdServer.
Full framework/builder E2E, browser hydration/Cypress, sustained load and heap/handle
soaks are not run for R4 and remain R6 acceptance. The prod-server package has no
unit suite; its production entry is exercised by the artifact regression. RSC is
explicitly excluded. No publish commands are run.


## R4 concatenation follow-up (2026-09-11)

The companion Rspack correction reconstructs MF consumer ancestry from emitted
modules' outgoing edges. A source module concatenated into several pages/loaders
can share dependency IDs whose incoming view retains just one rewritten origin;
that was the source of the previous incomplete-parent-closure fallback. Modern's
planner and safety checks are unchanged. The artifact regression now requires
selective success under concatenation and accepts an explicit
SSR_CACHE_RSPACK_ENTRY for testing the patched native compiler.

The optimized test passes with the patched compiler and fails with the published
2.2.3-canary-76e8f696-20260911033013 preview at the selective-plan assertion. Normal
and numeric/minified variants also pass with the patch. Pages and standalone
loaders update together while the independent entry continues serving and keeps
its object identity. A stable source merged *inside* an affected entry necessarily
executes with that entry; the test asserts exactly the two affected copies execute
again, while the independent copy remains identical. This does not weaken the
unrelated emitted-module preservation guarantee.

Commands from `/private/tmp/modern-r4-static-update`:

```sh
# Expected red with the published preview:
SSR_STATIC_OPTIMIZE=1 SSR_CACHE_MF_ROOT=/private/tmp/mf-r4-static-update node --test packages/server/core/tests/application.static-mf.test.cjs
# Patched compiler: each command passes one native HTTP/artifact test.
SSR_STATIC_OPTIMIZE=1 SSR_CACHE_RSPACK_ENTRY=/private/tmp/rspack-mf-concat/packages/rspack/dist/index.js SSR_CACHE_MF_ROOT=/private/tmp/mf-r4-static-update node --test packages/server/core/tests/application.static-mf.test.cjs
SSR_STATIC_NUMERIC=1 SSR_CACHE_RSPACK_ENTRY=/private/tmp/rspack-mf-concat/packages/rspack/dist/index.js SSR_CACHE_MF_ROOT=/private/tmp/mf-r4-static-update node --test packages/server/core/tests/application.static-mf.test.cjs
SSR_CACHE_RSPACK_ENTRY=/private/tmp/rspack-mf-concat/packages/rspack/dist/index.js SSR_CACHE_MF_ROOT=/private/tmp/mf-r4-static-update node --test packages/server/core/tests/application.static-mf.test.cjs
pnpm exec biome check packages/server/core/tests/application.static-mf.test.cjs
git diff --check
```

This follow-up changes only tests and verification documentation in Modern, so no
new package build, full unit suite or changeset is required. Existing built Modern
artifacts are exercised directly. Full framework/browser/load acceptance remains
R6; RSC stays excluded. Rspack's new regression passes in standard and runtime-module
modes (2 cases), its existing metadata and SSR serial regressions pass (4 cases),
and the external native MF/Modern baseline passes 23 cases. A new Rspack preview or
release is still needed to distribute the compiler fix; the old preview retains
its conservative fallback. No dependency lockfile is changed or package published.
