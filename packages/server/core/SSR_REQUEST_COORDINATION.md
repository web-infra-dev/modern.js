# SSR request coordination (R2, opt-in primitive)

`createSSRRequestCoordinator` is exported from `@modern-js/server-core/node`.
It coordinates one application owner in one Node process. It does not replace
the HTTP server or restart the process, and introduces no worker orchestration.

**This primitive is not installed in the default Modern request path. R2 is not
complete until renderers report all outstanding work and cancellation settles
that work. Do not enable remote mutation around an uninstrumented renderer.**

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

## Renderer gaps found in the current code

These are unresolved and prevent treating this primitive as a completed live
SSR update feature:

- `runtime/plugin-runtime/src/core/server/stream/createReadableStream.ts` only
  keeps React's `pipe`, does not wire `request.signal` to `abort`, and selects
  either shell-ready or all-ready as its callback. Default shell streaming does
  not independently report all producer work complete.
- Its asynchronous `getTemplates(...).then(...)` paths do not reject the outer
  promise when template processing fails. They need explicit completion/error
  handling and stream teardown.
- `stream/deferredScript.ts` schedules deferred promise callbacks and returns
  void; these callbacks need tracked completion and protection against writing
  after cancellation.
- Stream extenders, loader/RSC work and Web-stream rendering must agree on the
  completion/abort contract before they are admitted into the coordinated path.

The Node HTTP adapter already propagates response close to the Request's signal;
the missing renderer handling cannot be replaced by treating that signal as a
successful drain. R3 will integrate the owner before resource selection and R4
will connect targeted/full rebuilding. R2 remains open meanwhile.

## Validation (2026-09-10)

Baseline: Modern `46967f66c0` (`fix/ssr-chunk-loading-global`).

Commands executed from the Modern repository:

```sh
pnpm --filter @modern-js/server-core test -- requestCoordinator.test.ts
pnpm --filter @modern-js/server-core test
pnpm --filter @modern-js/server-core build
pnpm exec biome check packages/server/core/src/adapters/node/requestCoordinator.ts packages/server/core/src/adapters/node/index.ts packages/server/core/tests/adapters/requestCoordinator.test.ts packages/server/core/tests/adapters/requestCoordinator.http.test.ts
pnpm exec changeset status --output /tmp/modern-coordinator-changeset.json
git diff --check
```

Final package run: 39 tests pass, zero failures/skips; package build and touched
source/test lint pass. The tests cover queue limits/deadlines/cancellation,
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
