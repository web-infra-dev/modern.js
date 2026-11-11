# SSR request coordination and application publication

The opt-in `ssrApplication` option of `createProdServer` owns ordinary HTML SSR
and data-loader requests in one Node process. It admits requests before selecting
resources, drains existing responses and registered producer work, and publishes
new resources without replacing the HTTP server. Without this option the existing
request path is retained.

The built-in `@modern-js/plugin-module-federation` adapter composes this mechanism
with MF runtime invalidation. Server-core owns admission and resource publication.
The adapter owns the remote dependency graph, bundler caches, and MF instances.
The primitives below are intended for server adapters and control planes.

## Configuration

`SSRResourceApplicationOptions` is exported from `@modern-js/server-core/node`.
Configure `ssrApplication` with these required fields:

| Field                  | Meaning                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `maxPendingRequests`   | Non-negative integer limiting queued requests                  |
| `requestTimeoutMs`     | Positive maximum wait before admission                         |
| `drainTimeoutMs`       | Positive maximum wait for old response and producer completion |
| `onReady(application)` | Receives the process-local owner after initial resources load  |

Optional `maxResumeConcurrency` defaults to 8 and bounds simultaneous resumed
requests. It does not limit fresh requests or unaffected entries.
`maxPendingUpdates` defaults to 32 and bounds deferred update submissions.
`requestPolicy` defaults to `'wait'`.

<!-- prettier-ignore -->
```ts
import { createProdServer } from '@modern-js/prod-server'

let application
const server = await createProdServer({
  ...serverOptions,
  ssrApplication: {
    maxPendingRequests: 100,
    requestTimeoutMs: 5000,
    drainTimeoutMs: 30000,
    onReady(owner) {
      application = owner
    },
  },
})

// Call from the stable server control plane, outside an active SSR request.
await application.update(async affectedEntries => {
  await invalidateOwnedBundlerResources(affectedEntries)
})
```

Omit `ssrApplication` to disable coordination. The invalidator in this example is
adapter-owned code, not a server-core API. It must reset the application resources
that require replacement while preserving resources owned by other applications.

## Publication and failure

Each update serializes behind preceding operations. The owner closes admission
for affected entries, drains existing work, awaits invalidation and optional
`dispose(previousResources, entries)`, then reloads and validates the candidate.
Render handlers, standalone loaders, templates, JSON manifests and the renderer
are published together. `validate(resources)` may validate the unpublished
candidate directly. It must await its own work and must not re-enter gated HTTP.

The reloadable entry roots must be CommonJS. Native ESM application roots are
rejected. Modern only removes declared roots using canonical `require.resolve`
keys. Transitive bundler invalidation belongs to the adapter. It does not broadly
clear Node dependencies or undo business globals and listeners.

Each published generation has a new HTML cache namespace, including custom cache
keys and containers. Old cached values expire under their existing TTL and cannot
serve the new generation. Unaffected entries retain their namespaces.

Drain timeout occurs before mutation and restores the preceding serving state.
Mutation or candidate validation failure leaves the affected scope unavailable.
An explicit retry recovers it and expands to whole-application scope. There is no
rollback promise or mutation timeout that could reopen admission while work is
still mutating. `dispose` must tolerate retries and release adapters created by
failed candidate loads as well as the previous generation.

`application.status` reports phase, serving generation, active requests and queued
requests. Generation is a process-local publication counter, not a remote release
identifier. Updates submitted inside an active SSR request or another update are
rejected to prevent waiting for themselves.

## Request and producer ownership

`createSSRRequestCoordinator(options)` is the lower-level primitive. Its
`handle(request, render)` callback receives `work.track(promise)`. Resource and
handler selection must happen inside this callback, after admission.

A request remains active until its response body ends, errors or finishes
cancellation, and every registered producer task settles. Disconnect alone does
not prove that a loader, module import or remote producer stopped. Register the
complete original promise before wrapping it in cancellation races. Register
child tasks before their parent finishes. Registering after ownership has ended
is rejected. Arbitrary unregistered business tasks cannot be discovered.

Modern forwards `RequestHandlerOptions.work` through its existing request storage
and instance preparation. Node rendering tracks templates, React rendering,
stream extenders and deferred script processing. Route preloads and original
loader values are registered before deferred cancellation wrappers. Application
fragment rendering receives the same request owner explicitly and tracks its
progressive snapshot values. Bridge passes this object only in the local server
request. It is not serialized across the Service App HTTP protocol. A Service App
endpoint uses its own server request owner.

HTML cache writes and stale-while-revalidate work remain registered after the HTTP
response finishes. Cancellation propagates to the producing reader. An update
cannot overtake an unfinished write from the preceding generation.
When rendering replaces a response with a redirect, it cancels the discarded
body and retains ownership until that cancellation finishes.

Custom renderers and extenders must register independent asynchronous work that
outlives their exposed stream. Arbitrary `React.lazy` imports and background work
outside tracked framework paths remain the producer owner's responsibility.
RSC and Flight producers are outside this implementation's scope.

## Requests arriving during an update

`requestPolicy` accepts `'wait'`, `'csr'`, `'reject'`, or a synchronous server-owned
function receiving `{ request, update }`. The update snapshot contains `phase`,
`generation`, `affectedEntries`, `activeRequests`, `pendingRequests`, `waitedMs`
and `reason`. An undefined `affectedEntries` means the entire application.

| Decision | Behavior                                                                      |
| -------- | ----------------------------------------------------------------------------- |
| `wait`   | Wait before SSR resource selection, preserving the original deadline          |
| `csr`    | Return the last published HTML/client release without entering SSR or loaders |
| `reject` | Return 503 with `Retry-After: 1`                                              |

The policy may be evaluated again for `timeout`, `queue-full` or `unavailable`.
Returning `wait` at those terminal reasons returns 503. Invalid decisions and
policy exceptions also fail closed. The function must not read the body, perform
asynchronous work or submit an update. A timed-out request does not cancel the
update.

The framework CSR fallback supports HTML GET/HEAD navigation only. Data-loader,
API, RSC and non-HTML requests receive 503 if CSR is selected. The fallback uses
published templates and emits `Cache-Control: no-store`. It executes before normal
application middleware, so use it only for public shells or requests authorized
by a stable upstream layer. Authentication, redirects and request-specific HTML
transformations do not run on this path.

Known emitted browser asset directories bypass admission so a fallback shell can
load its assets during updates. This path excludes server bundles, public files,
uploads, directory roots and paths escaping the canonical emitted directories.
Other paths still enter normal admission. An optional trusted `bypass(request)`
may return a response directly, but must not enter application-owned resources or
fall through into application middleware.

## Entry scope and deferred submission

`resolveScope(request)` returns all entries used by a request, or `undefined` when
unknown. Unknown requests intersect every update. Selective updates require both
this classifier and `reloadEntry(entryName)`. The latter reacquires entry exports
in the existing bundler runtime after selective invalidation.

`application.update(invalidate, entries)` accepts entry names or a synchronous
plan evaluated inside the serialized update queue. Empty scopes are rejected.
Changes to shared host JSON manifests expand the scope before admission closes,
so every entry drains before those manifests publish. A shared manifest changed
by the invalidator after selective draining rejects publication and requires a
whole-application retry.
Unrelated entries continue serving, while selected render/loader maps publish
atomically. Rewrites across an admitted entry boundary return 503 before selecting
resources for the other entry. Multiple routes in the same compiled entry update
together. Dynamic consumption and incomplete adapter metadata require the
whole-application path.

`application.defer(operation)` synchronously returns `{ accepted: true, completed }`.
It waits for the submitting request's response and registered producers, then runs
the operation outside that request's storage context. Never await `completed`
from the submitting request or its tracked work. Submission is bounded and is
rejected during an update or policy evaluation. The adapter should expose its
own completion/status reporting. Acceptance alone does not guarantee the next
independent request sees a new release.

Adapters should call `application.assertUpdateAllowed()` before deduplicating
ordinary updates, so deduplication cannot bypass the active-request guard.
