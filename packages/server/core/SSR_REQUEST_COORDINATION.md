# SSR request coordination (R2, opt-in primitive)

`createSSRRequestCoordinator` is exported from `@modern-js/server-core/node`.
It coordinates one application owner in one Node process. It does not replace
the HTTP server or restart the process, and introduces no worker orchestration.

**This coordinator is not installed in the default Modern request path. The
standard Node/Web HTML renderers, nested-route loaders and HTML cache now accept
and propagate work ownership. The agreed scope is ordinary HTML SSR; RSC is
out of scope and is not an R2 acceptance gate. Custom producers use the explicit
work-registration contract below. R3 owns admission before resource selection.
Do not enable remote mutation around an uninstrumented renderer.**

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
write. Cache-key invalidation across generations remains an owner integration
requirement; draining a write alone does not invalidate previously cached HTML.

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
- R3 must install the gate before selecting resources/loader/renderer, supply work
  to every owned HTML SSR/loader path, invalidate generation-specific HTML caches,
  and reject unsupported paths before mutation. These changes do not yet switch
  application generations or expose the final MF update API.

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
