# Runtime capability refactor: original Cookie restored

This report supersedes the Cookie 2 candidate at `cebc7c86ab8884857ef8114c6401ab8b43f85d03`. The original Cookie dependency, browser import, build and type-resolution configuration are restored. Runtime lifecycle sources remain unchanged by the rollback. Production source is frozen at `e1bb5f85c5b5411da2be2fb6459443a6c017d37f`, with later report-only changes recorded separately. References are pre-unification `24b3752e8c8213b5b4166b77880065d8544e0025` and #9120 `93befbdc5b3c0203d5c84a338ed0d34ab9e15ffa`.

## Architecture and scope

#9120 established the shared initializer. This PR keeps it and moves optional capability ownership out of the common application owner. One static definition supplies components, route declarations, resources and a runtime factory. Each mount/request owns its canonical context, plugin runtime, preparation Promise and Root. Adapters provide page SSR data, progressive Bridge snapshots or Request data before the same setup, onBeforeRender, interrupt/Response handling, Root wrapping and cleanup. There is no second initializer or scheduler.

The common owner offers an optional preparation hook. Ordinary browser instances allocate no cancellation hook/race/listener, fragment graph or snapshot recovery state. Ordinary and fragment SSR inject the same cancellation plugin. Bridge browser mounting owns preparation through React commit, replacing duplicate callback abort/disposal state. Router owns lazy route allocation and idempotent cleanup. Live hooks omit static cloning metadata, setup shares its completion callback/cursor, and cleanup/error arrays allocate only when needed.

Request aliases exist before any capability/user setup, replacing the deleted requestContext plugin. Plugin API and internal Provider use one canonical object. The public Provider keeps its stable filtered view. updateRuntimeContext remains a deep merge, does not bind its patch object, does not clone arbitrary user objects and does not schedule React rendering. Serialized data is copied at its transport boundary. No pair of contexts needs synchronization.

Router, PrefetchLink, RSC/resource selection, i18n and renderers consume current context or definition. Mutable Router/i18n state belongs to the instance. Remaining module state is static registration, WeakMap views and explicit user-object caches. Core's existing component-data cache and deliberately shared user i18n retain their existing behavior.

## Removed implementation and real platform differences

- Removed the common owner's eager route graph, cancellation races/listeners, copied definition fields, facade getters and duplicate Root storage.
- Deleted core/compat/requestContext.ts and its ordering/replacement plugin.
- Removed duplicate browser callback cancellation/disposal, duplicate commit/render-tree assembly and duplicate Router cleanup logic.
- Removed per-live-hook cloning metadata, eager cleanup arrays, per-plugin completion closures and object/array-heavy dependency traversal. Public static hook helpers retain cloning behavior. Modern's existing plugin manager still orders dependencies.
- The prerequisite #9120 removed separate ordinary/scoped preparation, eager global runtime registration, federation AST/regex runtime rewriting and copied hydration context. Those are cumulative benefits, not first introduced by this follow-up.

Document HTML/SSR_DATA, fragment HTML/progressive snapshots, browser history/React commit and Request/Node streams retain adapter boundaries. Producer data URLs translate loader requests only. Consumer basename controls mounting, route only selects export content. Browser/Hash routing and explicit memoryRoute semantics remain. Props/internal navigation retain Root/Router, basename changes remount. Fragment transport owns frames/React stream termination, while cancellation owns preparation/request cleanup. Browser history/events are preserved.

## Cookie rollback and compatibility

Cookie is again the original production dependency `0.7.2`, with `@types/cookie@0.6.0`, and browser data directly imports its original parse function. No compatibility adapter or extra Cookie build target remains. Removed the proposed cookies.ts, parser-specific tests/checker, dedicated script tsconfig, Cookie differential helper and the upgrade's type-resolution/Commander-declaration changes. No utils release is needed. The dependency manifests and lockfile match #9120 exactly.

The proposed Cookie 2 upgrade did not demonstrate a whole-application optimization worth its compatibility and packaging complexity. The old Rspack output already removed unused serialization, so standalone parser sizes were not a valid estimate of application savings. This rollback removes the entire upgrade rather than preserving a custom parser contract.

Public rendering exports, peer ranges, production Node metadata and confirmed routing/SSR behavior remain unchanged. Existing generated entries must be regenerated and applications rebuilt, as required by #9120's internal generation protocol. Actual bundled CSR, string/stream SSR and one/eight-fragment raw HTML/frame checks pass on Node 20.19.6. Direct native mf.node loading retains the extensionless render import failure present in all three revisions. That pre-existing limitation is distinct from the successful bundled SSR path.

Release the matching toolkit plugin before or with runtime, then matching i18n, regenerate entries and rebuild. Changesets cover those three packages. No Core or utils source/release change is required. Core acceptance uses the existing real registry preview `0.0.0-feat-enhanced-runtime-unification-20261104092109`, without local Core overrides. No merge or publication is performed.

## Validation

- Units: runtime 314, toolkit 29, i18n 25, MF 65 and app-tools 124, total 557. Seven tests specific to the deleted Cookie compatibility wrapper were removed with that wrapper. Other assertions were not relaxed.
- Complete Weather Lab dev/production: 195/195, zero skips/retries.
- Ordinary framework: 145 passed across 27 files, five unchanged pre-existing skips, retry 0. Coverage includes CSR, string/stream SSR, JSON, SSG and RSC. Skip declarations match pre-unification.
- Shared page/Bridge plugins verify context meaning/timing, dependencies, async waiting, errors, interrupt/Response and cleanup. Product checks cover remote forms/inference, component SSR, Bridge SSR/noSSR/CSR, raw HTML, progressive independent streams, DOM identity, loaders, multiple instances, language/resources, routes/basename, props, recovery, disconnects and unmounting.
- Uncached 20-task build graph, MF build, source/declaration types, bilingual docs and four MF/six ordinary physical boundaries passed. The build cleans the removed Cookie adapter artifacts from all output formats. Ordinary client stats exclude Bridge recovery, optional cancellation/fragment and Node builtin modules.
- The generic integration-fixture fix for dependency-local resolution is retained. It avoids forcing transitive dependencies to resolve from runtime's node_modules and remains correct independently of Cookie version. The first complete rollback run passed 191 tests, with four blocked by a host readiness 502/timeout during application-isolation setup. The isolated file passed all eight dev/production cases before the fresh complete run. The startup failure was not reproduced and its root cause is not established. No retry, timeout or test expectation was loosened.

Functional regressions are TypeScript/TSX rstest tests. The .mjs files in this performance directory are opt-in Node benchmark drivers and metadata helpers, not automatically collected unit tests. Isolated Node processes control GC, warmup and measured work. This isolation does not require JavaScript specifically, and a TypeScript/rstest orchestration entry is possible. No such format migration is part of this Cookie rollback.

## Reproduction and evidence

Independent frozen installs use the identical lockfile in all three revisions. Node 24.18.1, pnpm 10.13.1, Chrome 149.0.7827.54, Apple M5 Pro, production/default minification, disabled build caches and Node zlib gzip level 9 per file. Captured raw/gzip files are independently re-read/recompressed and totals recomputed. Rslib v1/ssr and v2/ssr are server assets.

| Revision         | Commit                                   | Dist SHA256                                                      | Lock SHA256                                                      |
| ---------------- | ---------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Pre              | 24b3752e8c8213b5b4166b77880065d8544e0025 | 0955cbfdd75883e0908d3c72049f5a21eefe49eb57ecd30b546b165cf385b74e | abd3017603f87585ab9f2bb962dbb91637a49a6c6099e3579ab10d2f273bf095 |
| #9120            | 93befbdc5b3c0203d5c84a338ed0d34ab9e15ffa | 4389feb37db44981f109cb7516a02df6efb9ded617cdaa83af763850fbfb25e2 | abd3017603f87585ab9f2bb962dbb91637a49a6c6099e3579ab10d2f273bf095 |
| Current measured | e1bb5f85c5b5411da2be2fb6459443a6c017d37f | 489a5743be2a1a7c2eb5e3bfce04a8e07ea1ee4dc2ddc679d99679641df916a2 | abd3017603f87585ab9f2bb962dbb91637a49a6c6099e3579ab10d2f273bf095 |

Fresh macro order: pre → #9120 → current → current → #9120 → pre. Each scenario has two warmups and nine HTTP/browser samples, plus 50 warmup/50 measured bursts of 16 requests. Two processes per revision supply nine initialization and three memory rounds each. Fixed-artifact paired controls alternate request order, use 50 warmup/100 measured pairs and reverse process launch order. No package build or regression suite overlaps timed measurements. Cookie 2 timing controls are historical and are not relabeled as current rollback results.

[Commands](README.md), [sanitized per-run metrics and initialization/memory rounds](results.json), [all 2,000 paired concurrent rounds](paired-rounds.csv). Full original response HTML, frame/request/warmup samples, module/file inventories, processes and failure logs remain in local evidence. Public data omits private paths/process inventories and declares compact row columns.

## Whole-application size

Raw / gzip bytes, first build per revision. All JS/MJS/CSS routes and exposes, excluding maps/images/manifests. Producer totals are complete outputs, not one route's transfer or an isolated parser.

Browser:

| Output   | Pre-unification   | PR #9120          | Current           |
| -------- | ----------------- | ----------------- | ----------------- |
| csr      | 491,614 / 156,544 | 496,555 / 158,316 | 496,001 / 158,026 |
| string   | 504,362 / 161,305 | 509,145 / 163,038 | 508,586 / 162,752 |
| stream   | 504,034 / 161,215 | 508,814 / 162,949 | 508,256 / 162,662 |
| host     | 857,923 / 274,243 | 862,741 / 275,924 | 862,500 / 275,696 |
| provider | 872,415 / 279,621 | 876,461 / 280,890 | 875,815 / 280,781 |
| nested   | 828,537 / 259,239 | 833,372 / 260,914 | 832,984 / 260,675 |
| library  | 498,366 / 116,825 | 498,334 / 116,821 | 498,378 / 116,796 |

Browser gzip ranges and cumulative deltas across both builds:

| Browser gzip B | Pre             | PR #9120        | Current         | Current minus pre | Current minus #9120 |
| -------------- | --------------- | --------------- | --------------- | ----------------- | ------------------- |
| csr            | 156,544         | 158,316         | 158,026         | 1,482             | -290                |
| string         | 161,305         | 163,038         | 162,752         | 1,447             | -286                |
| stream         | 161,215         | 162,949         | 162,662         | 1,447             | -287                |
| provider       | 279,599–279,621 | 280,880–280,890 | 280,778–280,781 | 1,157–1,182       | -112–-99            |

Node output, consistently excluding external dependencies:

| Output   | Pre-unification     | PR #9120            | Current             |
| -------- | ------------------- | ------------------- | ------------------- |
| csr      | 0 / 0               | 0 / 0               | 0 / 0               |
| string   | 1,918,243 / 373,523 | 1,930,330 / 376,066 | 1,925,433 / 375,803 |
| stream   | 1,818,518 / 356,397 | 1,829,558 / 358,597 | 1,824,362 / 358,351 |
| host     | 3,874,074 / 790,014 | 3,885,619 / 792,396 | 3,877,232 / 792,179 |
| provider | 3,290,697 / 707,150 | 3,296,662 / 708,490 | 3,290,896 / 708,570 |
| nested   | 3,751,197 / 775,372 | 3,762,261 / 777,817 | 3,754,175 / 777,598 |
| library  | 522,810 / 122,400   | 522,772 / 122,373   | 522,820 / 122,386   |

For the Cookie decision only, compare the previous Cookie 2 candidate with the restored implementation. This is the entire proposal rollback, including its packaging/type configuration, not a standalone parser benchmark. The preceding six-run matrix supplies the new three-way results. Previous candidate values are from the immutable cebc7c86 report and are not new timing samples.

| Output   | Withdrawn Cookie 2 browser | Restored browser | Delta B | Withdrawn Node | Restored Node |
| -------- | -------------------------- | ---------------- | ------- | -------------- | ------------- |
| csr      | 157988                     | 158026           | 38      | 0              | 0             |
| string   | 162783                     | 162752           | -31     | 375803         | 375803        |
| stream   | 162686                     | 162662           | -24     | 358351         | 358351        |
| provider | 280792                     | 280781           | -11     | 708546         | 708570        |

Remaining ordinary output implements canonical context, async preparation, interruption and disposal. Optional MF modules are absent, which does not imply byte-identical output to the older global/reused-runtime implementation. Raw reductions do not guarantee gzip reductions. No universal zero-growth claim is made.

Retained browser dependency source bytes:

| CSR retained modules, source bytes | Pre-unification | PR #9120 | Current |
| ---------------------------------- | --------------- | -------- | ------- |
| @modern-js/runtime                 | 35365           | 43498    | 42422   |
| @modern-js/plugin                  | 12776           | 17245    | 16789   |
| cookie                             | 8166            | 8166     | 8166    |
| react                              | 19412           | 19412    | 19412   |
| react-dom                          | 635226          | 635226   | 635226  |
| react-router                       | 432695          | 432695   | 432695  |
| core-js                            | 505807          | 505807   | 505807  |

These source-module sizes are composition evidence, not additive minified attribution. Cookie is again an ordinary external package in module stats. Its unused serialization is handled by the existing application optimizer.

## Initialization and live memory

Eight identical plugins, empty routes and no DOM. Engine means generic runtime/context plus measurement handle, not a mounted Bridge app. Live memory retains 1,000 prepared objects after GC, median of six rounds from two processes. MB means 1,000,000 bytes.

| 1,000 live objects, bytes | Pre-unification | PR #9120  | Current   |
| ------------------------- | --------------- | --------- | --------- |
| engine                    | 4,756,472       | 5,787,516 | 4,630,620 |
| owner                     | Not equivalent  | 6,615,888 | 4,937,760 |
| bridge                    | 5,137,680       | 6,922,312 | 5,388,488 |
| bridgeServer              | 5,519,904       | 7,241,904 | 6,698,768 |

Observed owners and actual contexts become unreachable after disposal/drop in every round. Legacy uses an external Provider context plus deep-merged internal context. Unified revisions use one canonical context. Legacy ordinary registration is a singleton, so no equivalent isolated-owner row exists. Legacy fragment scope lacks preparation cancellation/disposal, making its server capability contract smaller. These synthetic results do not imply the same percentage change for complete pages.

Create/setup/prepare/dispose medians in µs, 18 rounds per revision, each with 500 warmups and 5,000 cycles:

| Create/setup/prepare/dispose, µs | Pre-unification | PR #9120 | Current |
| -------------------------------- | --------------- | -------- | ------- |
| engine                           | 5.458           | 5.752    | 3.940   |
| ordinaryInstance                 | Not equivalent  | 6.747    | 4.042   |
| bridgeInstance                   | 6.415           | 6.303    | 4.173   |
| ordinaryRequest                  | Not equivalent  | 6.702    | 5.026   |

Legacy does not perform the new cleanup contract. Measurements describe actual work per revision rather than identical lifecycle capabilities.

## HTTP and browser completion

Milliseconds, pre → #9120 → current. Serial/browser values pool two runs. Concurrent columns span individual-run medians. Page commit is navigation start to actual page effect. Before-render → commit includes preparation, scheduling and hydration, not isolated React-only hydration CPU.

| Scenario | Serial TTFB           | Concurrent TTFB                               | 16-request elapsed                            | Page commit              | Before-render → commit |
| -------- | --------------------- | --------------------------------------------- | --------------------------------------------- | ------------------------ | ---------------------- |
| csr      | 1.887 → 2.303 → 1.876 | 1.834–1.994 → 1.874–1.876 → 1.834–2.052       | 2.419–2.508 → 2.387–2.431 → 2.375–2.564       | 52.90 → 51.30 → 53.30    | 12.70 → 8.95 → 9.20    |
| string   | 2.220 → 2.291 → 2.272 | 2.675–2.680 → 2.960–3.069 → 2.897–2.916       | 3.731–3.847 → 4.164–4.344 → 4.134–4.178       | 50.40 → 51.65 → 49.70    | 5.70 → 5.80 → 5.80     |
| stream   | 2.308 → 2.344 → 2.259 | 2.864–2.889 → 3.161–3.225 → 3.152–3.169       | 4.074–4.168 → 4.478–4.505 → 4.438–4.523       | 63.80 → 53.30 → 53.60    | 7.95 → 8.15 → 8.10     |
| bridge1  | 3.910 → 3.954 → 4.088 | 8.005–8.379 → 7.464–7.699 → 7.556–8.476       | 13.796–13.846 → 12.503–12.860 → 12.681–13.853 | 159.60 → 100.75 → 104.05 | 52.70 → 38.15 → 39.65  |
| bridge8  | 3.995 → 4.145 → 4.373 | 19.161–21.033 → 18.782–19.367 → 18.266–19.146 | 34.531–36.457 → 33.785–35.462 → 32.993–34.297 | 108.85 → 112.05 → 108.85 | 45.50 → 46.80 → 45.90  |

Paired head-minus-reference elapsed medians in ms per 16-request burst:

| Reference / launch order | CSR    | String | Stream | Bridge 1 | Bridge 8 |
| ------------------------ | ------ | ------ | ------ | -------- | -------- |
| pre-AB                   | -0.002 | +0.422 | +0.405 | +0.161   | +0.786   |
| pre-BA                   | +0.018 | +0.460 | +0.094 | -0.053   | +0.167   |
| base-AB                  | -0.026 | +0.936 | -0.097 | -0.770   | +0.182   |
| base-BA                  | +0.018 | -0.020 | -0.065 | -0.200   | +0.705   |

Per-round values, spread and resampled intervals remain in evidence. Warmup, JIT, GC, default verbose server logging and process order affect local latency. Request isolation and response-body-completion cleanup perform work absent from legacy global registration. The implementation does not replace them with reused request state or early cleanup to improve scores. No universal speedup or zero-regression claim is made. Prior Cookie 2 CPU/logging controls are retained historically in the previous report, not used as proof of rollback timing.

## Real browser/server memory and release

Mounted page heap in decimal MB:

| Mounted page heap, MB | Pre-unification | PR #9120    | Current     |
| --------------------- | --------------- | ----------- | ----------- |
| csr                   | 2.307–2.308     | 2.323       | 2.321       |
| string                | 2.232           | 2.240       | 2.235–2.237 |
| stream                | 2.297–2.299     | 2.305–2.307 | 2.301–2.303 |
| bridge1               | 4.404–4.407     | 4.441–4.443 | 4.426       |
| bridge8               | 5.692–5.694     | 5.744–5.746 | 5.728       |

All three revisions complete ten Bridge mount/unmount cycles. Current and #9120 listener floors are 293/1,287 for one/eight fragments, pre is 436/1,430. These preserve #9120's cleanup fix. Host/React/history stay mounted, so total listeners need not reach zero. Each cycle's heap, DOM, active/cleaned effects and listeners is recorded.

Four probes retain 50 destroyed public handles across ordinary CSR/hydration and Bridge CSR/progressive hydration. Both unified revisions have zero observed contexts/payloads/snapshot data, preserve actual hydrated button identity and report zero browser errors, with a listener floor of three. Legacy lacks an equivalent isolated ordinary handle contract. Real page/cycle results still cover all three.

| RSS after concurrent SSR, KiB | Pre               | PR #9120            | Current             |
| ----------------------------- | ----------------- | ------------------- | ------------------- |
| csr                           | 172,640–173,920   | 174,928–175,648     | 174,960–175,008     |
| string                        | 293,824–294,640   | 315,472–316,048     | 319,008–320,272     |
| stream                        | 325,312–326,528   | 340,640–341,184     | 342,256–345,232     |
| bridge1                       | 847,808–854,720   | 878,304–896,944     | 838,512–867,936     |
| bridge8                       | 942,256–1,010,720 | 1,046,736–1,064,528 | 1,019,008–1,024,704 |

RSS includes all descendant server processes, JIT, allocator capacity and native buffers. It is not a retained-context counter. Remaining ordinary SSR RSS increases over pre are retained rather than inferred away from synthetic allocation improvements. All outliers remain in results.json.

## Limits and code reading

One shared developer machine, loopback and Chrome without throttling. Whole-repository framework/builder suites, other browsers/mobile/production networks, installed dependency size, production installation of all new packages and isolated React-only hydration CPU were not verified. Native mf.node retains the existing limitation above. Service App/cache/updateRemotes/discovery/autoShared remain outside scope. Core cache and deliberate user i18n sharing are unchanged.

1. [Common owner](../../../packages/runtime/plugin-runtime/src/core/application/instance.ts) and [runtime factory](../../../packages/runtime/plugin-runtime/src/core/plugin/index.ts)
2. [Cancellation plugin](../../../packages/runtime/plugin-runtime/src/core/application/cancellation.ts), [fragment routing](../../../packages/runtime/plugin-runtime/src/core/react/scopeDefinition.tsx), [browser operation](../../../packages/runtime/plugin-runtime/src/application/index.tsx) and [Request adapter](../../../packages/runtime/plugin-runtime/src/core/server/requestHandler.tsx)
3. [Router ownership](../../../packages/runtime/plugin-runtime/src/router/runtime/application.ts), [PrefetchLink](../../../packages/runtime/plugin-runtime/src/router/runtime/PrefetchLink.tsx) and [i18n](../../../packages/runtime/plugin-i18n/src/runtime/utils.ts)
4. [Plugin manager](../../../packages/toolkit/plugin/src/manager.ts), [setup sequence](../../../packages/toolkit/plugin/src/runtime/run/create.ts) and [original browser Cookie import](../../../packages/runtime/plugin-runtime/src/core/browser/data.ts)
5. [Shared plugin contract](../../../packages/runtime/plugin-runtime/tests/application/pluginContract.tsx), [capabilities](../../../packages/runtime/plugin-runtime/tests/application/capabilities.test.ts) and [browser regressions](../../../packages/runtime/plugin-runtime/tests/application/browser.test.tsx)
