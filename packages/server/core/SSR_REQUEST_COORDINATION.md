# SSR request coordination and application publication

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
`onReady(application)` callback. The callback receives `status`,
`update(invalidate)`, `defer(operation)` and `assertUpdateAllowed()`.
The control plane invokes update outside request handling; request-side
notifications use `defer` as described below.
The application owner drains existing work, awaits the bundler/remote invalidator,
awaits `dispose(previousResources)`, reloads the declared CommonJS render/loader
roots, rereads templates and JSON manifests, creates a fresh renderer, validates
entry handlers and optional loader bundles, and publishes all resources together.
The HTTP server, port, process and server plugins remain. The invalidator decides
which application-owned MF instances and bundler resources must be replaced.

The invalidator owns transitive bundler state and remote changes; `dispose` owns
adapter detachment and application-owned cleanup. They must preserve resources
still owned by unaffected applications and support explicit retries. `dispose` must release all live adapters
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
The resource plugin serves GET/HEAD requests for known emitted browser-asset
directories before admission, so a CSR shell can load its JS/CSS while an update
is running. These assets are treated as public and bypass user middleware. The
early path excludes SSR bundles, declared server entries, uploads, public-directory
files, directory roots and paths escaping the canonical emitted directories.
It does not make arbitrary static files or API routes public: those requests still
enter admission unless an explicit trusted `bypass` handles them.
Scope-based admission is opt-in through the R4 hooks documented below. A readiness
handler can consult `status`; liveness must not imply readiness during failed
publication. Request queue and timeout limits remain explicit; the bounded
resumption and deferred-submission limits below have configurable defaults.

The companion `@module-federation/modern-js-v3` adapter composes these hooks for
remote replacement, revision comparison and deferred submission. It supplies the
static dependency planner, selective invalidation and whole-application fallback.
Modern owns request admission and publication; the adapter owns MF resources.

## Development branches

Modern SSR cache work integrates into `feat/mf-ssr-clear-cache`, created directly
from `main` at `4af5bf05b6513ee396419fada27f304880c15b67` on 2026-09-10.
Start subsequent Modern work branches from this integration branch and target all
related PRs at it. PR #8861 is rebased onto it; the unrelated
`fix/ssr-chunk-loading-global` commits are not included.

## Ownership contract

An owner constructs a coordinator with explicit `maxPendingRequests`,
`requestTimeoutMs` and `drainTimeoutMs`. `handle(request, render)` must wrap selection of the current resources,
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
A callback failure keeps the affected application scope unavailable. A subsequent
explicit update can recover it. The coordinator
does not promise rollback or timeout an operation which may still be mutating.
Waiters have independent cancellation and a total deadline across repeated wakes;
the default policy returns 503 with Retry-After on queue overflow, timeout or
unavailability. Waking requests recheck admission before registering a lease.

Calling update from an active request, nesting updates, or entering the gate to
warm up a generation from its own update is rejected to prevent self-waiting.
Warm up the unpublished generation directly. AsyncLocalStorage only detects local
calls in the same context; arbitrary HTTP calls back into the application need
application-level discipline.

Emitted browser assets bypass this application-owner gate automatically. Other
static/liveness traffic needs an explicit trusted bypass when appropriate. Route-specific
ownership is supplied by `resolveScope`; this primitive does not infer routes or
mutate MF remotes.

## Requests arriving during an update

`requestPolicy` accepts `'wait'` (default), `'csr'`, `'reject'`, or a synchronous
server-owned function. The function runs only when the request's entries intersect
the closed update scope, before selecting any SSR handler or acquiring a request
lease. Unaffected entries continue serving normally.

```ts
// host/server/ssr-request-policy.ts — load this from stable server configuration,
// not from a replaceable page, loader or remote bundle.
import type { SSRRequestPolicy } from '@modern-js/server-core/node';

export const requestPolicy: SSRRequestPolicy = ({ request, update }) => {
  const pathname = new URL(request.url).pathname;
  // Only this public HTML shell is eligible for early CSR fallback.
  if (pathname === '/public-weather') return 'csr';
  return update.reason === 'updating' ? 'wait' : 'reject';
};
```

Pass the function as `createProdServer({ ssrApplication: { requestPolicy, ... } })`.
The callback receives the Fetch `Request` (`url`, `method`, `headers`, `signal`)
and a frozen update snapshot: `phase`, `generation`, `affectedEntries`,
`activeRequests`, `pendingRequests`, `waitedMs`, and `reason`. An undefined
`affectedEntries` means the whole application. It must not read the request body,
perform asynchronous work, or submit another update. Errors and invalid return
values fail closed with 503.

| Decision | Behavior |
| --- | --- |
| `wait` | Wait outside SSR until resources are published, retaining the original request deadline. |
| `csr` | Return Modern's last published HTML/client release without entering SSR bundles or loaders. |
| `reject` | Return 503 with `Retry-After: 1`. |

Waiting requests can invoke the policy again with `reason: 'timeout'`,
`'queue-full'` or `'unavailable'`; `'wait'` at those terminal reasons means 503,
not an unbounded retry. The original update continues even when a request times
out or disconnects. Queued requests resume in FIFO order with at most
`maxResumeConcurrency` outstanding resumed leases (default 8). This limits queue
resumption, not all application traffic; fresh or unaffected requests retain
their normal admission path.

The resource plugin supplies a framework-owned CSR renderer. It accepts HTML
GET/HEAD navigation only; data-loader, declared API, RSC and non-HTML requests return 503
when `csr` is selected. It uses published templates, preserves their pinned MF
client release, and sends `Cache-Control: no-store`. A standalone
`createSSRApplication` without a `renderCSR` implementation also returns 503.

**CSR is an early response, before normal server middleware.** Downstream
authentication, redirects, request-specific CSP headers and HTML transformations
do not run. Enable it only for public shells or requests already authorized by a
stable upstream layer. Protected routes should use `wait`/`reject` unless the
server-owned policy and fallback explicitly provide the required checks and
headers. Static route response headers are preserved. The framework does not
interpret client headers as authorization to update or bypass access control.

## Submitting an update from SSR

`application.update(...)` still returns completion and rejects calls made from an
active SSR request, including calls that reuse a pending adapter operation. Use
`application.assertUpdateAllowed()` before adapter deduplication to preserve this
boundary.

`application.defer(operation)` returns `{ accepted: true, completed }`
synchronously. It waits for the submitting request's response body **and** all
tracked producer tasks to settle, then invokes the operation outside the request's
AsyncLocalStorage context. A disconnect alone does not release unsettled producer
work. Deferred operations are serialized, bounded by `maxPendingUpdates` (default
32), and cannot be submitted during an update or admission-policy evaluation.

```ts
// Framework adapter primitive; the page-facing API should expose acceptance,
// not ask the active request to await its own update completion.
const receipt = application.defer(() => adapter.updateRemotes(application, remotes));
// Do not await receipt.completed from the submitting request or tracked work.
// Observe completion through the adapter's server-owned status/error reporting.
```

MF's `updateRemotes(..., { defer: 'after-response' })` composes this primitive and
returns an operation/revision receipt; normal `updateRemotes` continues to return
the completed result. The current response uses its existing generation. The
later operation enters the same update queue, computes scope, drains any other
affected requests, replaces resources, and reopens admission. Submission does not
promise that the caller's next independent request already sees the new release;
check the adapter's applied status when that guarantee is required.

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
- Application ownership remains opt-in. The companion MF adapter supplies remote
  update APIs; `@modern-js/runtime/mf` is not exported by this server-core change.

The Node HTTP adapter already propagates response close to Request.signal. The
new renderer handling consumes that signal without equating disconnect with a
successful drain. No deployment worker rotation or process restart is introduced.

## Selective entry publication


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

## Validation (2026-10-08)

From `/private/tmp/modern-ssr-update-policy`:

```sh
pnpm --filter @modern-js/server-core build
pnpm --filter @modern-js/server-core test
NODE_ENV=production node --test packages/server/core/tests/application.http.test.cjs
pnpm exec biome check packages/server/core/src/adapters/node/{application,index,requestCoordinator}.ts packages/server/core/src/adapters/node/plugins/{resource,static}.ts packages/server/core/src/plugins/render/render.ts packages/server/core/tests/adapters/{application,requestCoordinator.policy,staticAssets}.test.ts packages/server/core/tests/plugins/updateCSR.test.ts packages/server/core/tests/application.http.test.cjs
pnpm exec changeset status --output ../modern-request-policy-changesets.json
git diff --check
```

The package build and declarations pass. All 63 unit tests across 15 files pass;
these include policy decisions, queue overflow/timeout, FIFO resumption, request
context guards, deferred response/producer completion, and static-resource
symlink/overlapping-directory exclusions. Biome checks all 11 changed TS/CJS files
without fixes. Changeset planning recognizes this server-core patch; existing
changesets and Modern's fixed release group determine the combined release type.
The CLI emits a nonfatal `/dev/tty` warning in this environment.

All three native HTTP cases pass. They exercise application publication, the same PID/port,
last-published CSR release templates, emitted-asset access during an update,
protected path rejection, unavailable-state fallback and explicit recovery. The
companion MF checkout owns cross-repository compiler/adapter and browser cases;
the server-core unit command does not execute those suites.

Earlier renderer and loader regressions establish that disconnect does not settle
independent producer work, HTML-cache writes remain leased, and selective updates
retain unrelated emitted modules. The companion Rspack graph fix supports numeric
IDs, minification and concatenation; modules merged inside a replaced execution
unit execute again with that unit. Those established contracts remain unchanged
by the new admission policy. Obsolete worktree paths and preview-specific failure
logs are omitted here; Git history retains the earlier validation record.

Full Modern framework/builder suites and production load/heap soaks were not rerun
for this server-core change; targeted package and native HTTP checks cover its
changed paths. RSC remains outside scope. No publish commands were run.
