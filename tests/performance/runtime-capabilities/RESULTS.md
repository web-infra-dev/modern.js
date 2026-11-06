# Runtime capability refactor: cumulative verification

This report supersedes the earlier 40183326 measurements. References are pre-unification `24b3752e8c8213b5b4166b77880065d8544e0025` and #9120 `93befbdc5b3c0203d5c84a338ed0d34ab9e15ffa`. Production sources are frozen at `085e7151ff9e25a9d120eba25853d74b57d30de9`. The measured checkout is `beb9226183cdde9fec6b1ab6bf346fd941f6e1c6`, with only test/benchmark changes after that production commit. Later report/control commits do not change those package sources or built artifacts.

## Ownership and execution

One static application definition provides components, route declarations, build resources and a runtime factory. Each mount/request owns a canonical context, plugin runtime, preparation Promise and Root. Ordinary pages and Bridge use `createApplicationInstance`. Adapters supply page data, progressive snapshots or Request data before the same dependency-ordered setup, awaited `onBeforeRender`, interrupt/Response handling, Root wrapping and deterministic cleanup. There is no second initializer or scheduler.

The kernel offers an optional preparation hook. Ordinary browser instances allocate no cancellation hook/race/listener, fragment routes or snapshot recovery state. Ordinary and fragment SSR inject the same cancellation plugin. A Bridge browser operation owns preparation through React commit and rejects immediately on destruction, even while user setup remains unresolved. Fragment routing, commit observations and data endpoints enter through a plugin. Router owns route allocation and one idempotent cleanup callback. Cleanup arrays allocate on first use.

Static registration stores code, never current request data, props or snapshots. Plugin API and internal Provider use one canonical context. The public Provider keeps a stable filtered Proxy view. `updateRuntimeContext` still deep-merges, does not bind the patch object, does not deep-clone arbitrary user objects and does not schedule rendering. Serialized inputs are copied at the transport boundary. No pair of contexts requires synchronization.

Router, PrefetchLink, RSC selection/resources, i18n and renderers consume the current context/definition. Request aliases exist before any capability or user setup. Mutable Router/i18n state is instance-local. Remaining module state is static registration, WeakMap views and explicit user-object caches. Deliberately shared user i18n and Core's existing component-data cache retain their existing semantics.

## Deleted paths and retained platform boundaries

- Removed the separate scoped context/runtime/Root initialization sequence from `createScopeRuntime`. It now supplies fragment routing to the shared owner.
- Deleted `core/compat/requestContext.ts` and its replacement/ordering plugin.
- Removed eager route cloning, cancellation races/listeners, copied definition fields, facade getter closures and duplicate Root storage from the common owner.
- Removed duplicate browser callback abort/disposal state, duplicate commit/render-tree construction and duplicate Router disposal logic.
- Removed live-hook static cloning metadata, eager cleanup arrays, per-plugin completion closures and object/array-heavy dependency sorting. Modern's existing dependency manager remains the only scheduler.
- The cumulative #9120 implementation also removes eager global runtime registration, duplicated ordinary/scoped preparation, federation AST/regex runtime rewriting and copied hydration context. Generated entries import an inert factory.

Document HTML/SSR_DATA, fragment HTML/progressive snapshots, browser history/React commits and Request/Node streams remain adapters. Producer-path translation applies only to data endpoints. Consumer basename controls mounting, while `route` selects exported content. Configured Hash Router remains supported, only explicit memoryRoute creates independent memory navigation. Props/internal navigation preserve Root and Router, basename changes remount. Fragment transport owns frame completion and React stream abort, while the cancellation plugin owns preparation/request cleanup. These are distinct resources and completion events. Browser history/events remain available.

## Cookie and compatibility

Original upstream `cookie@2.0.2` is used without a third-party source patch or cookie-es replacement. Because its Node floor is >=22, it is a build-only dependency bundled into ESM, Node ESM and CJS. Modern's production Node metadata is unchanged. The compatibility adapter preserves plain Cookie maps, duplicate precedence, quote removal, malformed encoding and special keys. Actual emitted CJS matches the old parser on 100,017 fixed/seeded inputs.

The local release tarball contains all three self-contained formats and upstream MIT attribution/license, with no external Cookie production dependency or leaked Cookie declaration imports. Its extracted CJS parser runs on Node 20.0.0. Actual bundled CSR, string/stream SSR and one/eight-fragment raw HTML/frame checks pass on Node 20.19.6. Public rendering exports, peer ranges and production Node ranges are unchanged, toolkit APIs are additive. No stable public API break was found in the tested surface. Regenerate generated directories and rebuild, as already required by #9120's internal protocol.

A pre-existing native-loading limitation remains: directly requiring `mf.node` on Node 20.19 fails on an extensionless import in `@modern-js/render` in all three revisions. Ordinary native entries load. This is distinct from the successful bundled SSR path.

The earlier standalone esbuild Cookie-size explanation did not reproduce in actual Rspack output. Rspack already removed old serialization. The complete application results below replace that inference. Module source sizes are not minified attribution.

## Validation and release

- Units: runtime 321, toolkit 29, i18n 25, MF 65, app-tools 124, total 564.
- Complete Weather Lab dev/production: 195/195, zero skips/retries.
- Ordinary framework: 145 passed across 27 files, five unchanged pre-existing skips, retry 0, covering CSR, string/stream SSR, JSON, SSG and RSC. The three skip-declaration files match pre-unification.
- Shared ordinary/Bridge test plugins verify context meaning/timing, dependencies, async waiting, errors, interrupt/Response and cleanup. Regressions cover remote forms/inference, component SSR, Bridge SSR/noSSR/CSR, raw HTML, progressive streams, DOM identity, independent hydration, loaders, multiple instances, language/resources, routes/basename, props updates, recovery, disconnects and unmounting.
- Uncached 20-task build graph, MF build, declarations/source types and bilingual docs passed. Four MF and six ordinary physical-entry checks passed. All six ordinary client stats graphs contain zero Bridge recovery, optional cancellation/fragment or Node builtin matches. Cookie artifact/license checks passed. Manager outcomes match 10,000 graphs, including 5,000 cycles.
- The first final matrix passed 194 cases and exposed an integration fixture that prioritized runtime dependencies globally, making React Router resolve Cookie 2 rather than its own dependency. Dependency-local resolution fixed the isolated built-entry test and the fresh 195/195 matrix. Another invocation omitted the installed Chrome path, so browser cases did not start. That execution failure is retained and not counted as a pass. No assertion, timeout or retry was relaxed.

Release matching utils declarations and toolkit plugin before or with runtime, then matching i18n, regenerate entries and rebuild. Changesets cover all four. No Core change/new release is required. Acceptance uses real registry preview `0.0.0-feat-enhanced-runtime-unification-20261104092109`, without local Core overrides. No merge/publication is performed.

## Reproducible protocol

Node 24.18.1, pnpm 10.13.1, Chrome 149.0.7827.54, Apple M5 Pro, independent frozen installs, production/default minification and disabled build caches. Candidate lock changes contain only Cookie build/type records, every other locked dependency is unchanged. Node zlib `1.3.1-e00f703`, gzip level 9 per file. All 1,752 captured files were re-read/recompressed independently, with totals recomputed. Rslib v1/ssr and v2/ssr are server assets.

| Revision         | Commit                                   | Dist SHA256                                                      | Lock SHA256                                                      |
| ---------------- | ---------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Pre              | 24b3752e8c8213b5b4166b77880065d8544e0025 | 0955cbfdd75883e0908d3c72049f5a21eefe49eb57ecd30b546b165cf385b74e | abd3017603f87585ab9f2bb962dbb91637a49a6c6099e3579ab10d2f273bf095 |
| #9120            | 93befbdc5b3c0203d5c84a338ed0d34ab9e15ffa | 4389feb37db44981f109cb7516a02df6efb9ded617cdaa83af763850fbfb25e2 | abd3017603f87585ab9f2bb962dbb91637a49a6c6099e3579ab10d2f273bf095 |
| Current measured | beb9226183cdde9fec6b1ab6bf346fd941f6e1c6 | e357c05c2b14c64182825c7550c40430562be087b010c4df2ac4960c832b3060 | 599327e69a6e7289cfd2284d104fafdaf98196e71ae1f4feb2dda6d74cb898ac |

Macro order: pre → #9120 → current → current → #9120 → pre, after all regressions. Each scenario has two warmups and nine HTTP/browser samples, plus 50 warmup/50 measured bursts of 16 requests. Two processes per revision provide nine initialization and three memory rounds each. Fixed-artifact paired controls alternate request order and reverse process launch order. No test suite or package build overlaps timed measurements.

[Commands](README.md), [sanitized per-run metrics and all initialization/memory/control rounds](results.json), [all 2,000 primary paired concurrent rounds](paired-rounds.csv). Full original HTML, frame/request/warmup samples, module stats, CPU profiles and failure logs remain in local evidence. Public data omits private paths/process inventories.

## Complete emitted size

Raw / gzip bytes, first build per revision. All JS/MJS/CSS, routes and exposes are included, excluding maps/images/manifests. These are whole outputs, not the parser alone or one page's transfer.

Browser:

| Output   | Pre-unification   | PR #9120          | Current           |
| -------- | ----------------- | ----------------- | ----------------- |
| csr      | 491,614 / 156,544 | 496,555 / 158,316 | 496,057 / 157,988 |
| string   | 504,362 / 161,305 | 509,145 / 163,038 | 508,687 / 162,783 |
| stream   | 504,034 / 161,215 | 508,814 / 162,949 | 508,357 / 162,686 |
| host     | 857,886 / 274,219 | 862,776 / 275,928 | 862,632 / 275,753 |
| provider | 872,350 / 279,595 | 876,460 / 280,892 | 875,921 / 280,792 |
| nested   | 828,530 / 259,213 | 833,312 / 260,909 | 833,087 / 260,727 |
| library  | 498,370 / 116,831 | 498,334 / 116,819 | 498,382 / 116,802 |

Ordinary outputs are identical across both builds. Producer gzip ranges: pre **279,585–279,595**, #9120 **280,889–280,892**, current **280,792** in both builds. Current is 97–100 B below #9120, but **1,197–1,207 B above pre-unification**, about 0.43 percent. Ordinary CSR is **+1,444 B** versus pre and −328 B versus #9120. String/stream browser output is +1,478/+1,471 B versus pre and −255/−263 B versus #9120. This is not zero cumulative growth.

Remaining ordinary code implements canonical context, async preparation, interruption and disposal. Optional MF recovery/routing/cancellation modules are absent. Excluding MF-specific code does not imply byte-identical output to the older global/reused-runtime implementation. The measured increase is not declared irreducible or attributed to Cookie.

Node, consistently excluding external dependencies:

| Output   | Pre-unification     | PR #9120            | Current             |
| -------- | ------------------- | ------------------- | ------------------- |
| csr      | 0 / 0               | 0 / 0               | 0 / 0               |
| string   | 1,918,243 / 373,523 | 1,930,330 / 376,066 | 1,925,433 / 375,803 |
| stream   | 1,818,518 / 356,397 | 1,829,558 / 358,597 | 1,824,362 / 358,351 |
| host     | 3,874,021 / 790,007 | 3,885,591 / 792,391 | 3,877,209 / 792,165 |
| provider | 3,290,620 / 707,125 | 3,296,585 / 708,468 | 3,290,819 / 708,546 |
| nested   | 3,751,162 / 775,349 | 3,762,225 / 777,798 | 3,754,130 / 777,576 |
| library  | 522,814 / 122,406   | 522,772 / 122,372   | 522,824 / 122,389   |

Producer Node gzip is 708,546–708,548 B, **+77–80 B versus #9120**, +1,420–1,423 B versus pre, while raw output is about 5.8 KB below #9120. Raw and gzip changes differ because compression/chunk layout differs. Ordinary string/stream Node gzip is −263/−246 B versus #9120 and +2,280/+1,954 B versus pre.

Retained browser composition:

| CSR retained modules, source bytes | Pre-unification | PR #9120 | Current |
| ---------------------------------- | --------------- | -------- | ------- |
| @modern-js/runtime                 | 35365           | 43498    | 45844   |
| @modern-js/plugin                  | 12776           | 17245    | 16789   |
| cookie                             | 8166            | 8166     | 0       |
| react                              | 19412           | 19412    | 19412   |
| react-dom                          | 635226          | 635226   | 635226  |
| react-router                       | 432695          | 432695   | 432695  |
| core-js                            | 505807          | 505807   | 505807  |

These are source bytes, not additive minified attribution. React, React DOM, Router and polyfill composition is unchanged. Bundled Cookie is counted under runtime rather than as an external module. No optional MF module enters ordinary output.

## Initialization and live memory

Eight identical plugins, empty routes, no DOM. Engine is the generic plugin runtime/context plus measurement handle, not a mounted Bridge app. Live memory keeps 1,000 prepared objects after GC, median of six rounds. MB means 1,000,000 bytes.

| 1,000 live objects, bytes | Pre-unification | PR #9120  | Current   |
| ------------------------- | --------------- | --------- | --------- |
| engine                    | 4,756,472       | 5,789,268 | 4,630,584 |
| owner                     | Not equivalent  | 6,615,580 | 4,937,832 |
| bridge                    | 5,137,712       | 6,913,824 | 5,386,352 |
| bridgeServer              | 5,522,588       | 7,241,900 | 6,698,712 |

All observed owners/contexts become unreachable after disposal/drop. Legacy holds external Provider data and a deep-merged internal context, unified holds one canonical context. Legacy ordinary registration is a singleton, so no equivalent isolated-owner row exists. Legacy fragment scope lacks preparation cancellation/disposal, making its server capability contract smaller. Current fragment memory is below #9120 but remains above those legacy rows. These synthetic percentages do not predict full-page heap changes.

| Create/setup/prepare/dispose, µs | Pre-unification | PR #9120 | Current |
| -------------------------------- | --------------- | -------- | ------- |
| engine                           | 5.197           | 5.246    | 3.778   |
| ordinaryInstance                 | Not equivalent  | 5.763    | 3.935   |
| bridgeInstance                   | 6.088           | 5.669    | 4.002   |
| ordinaryRequest                  | Not equivalent  | 6.215    | 4.884   |

Median of 18 rounds, each with 500 warmups and 5,000 cycles. Legacy cycles do not perform the new disposal contract. The measurements reflect actual work per revision, not identical lifecycle capabilities.

## HTTP, hydration and controls

Milliseconds, pre → #9120 → current. Serial/browser values pool two runs, concurrent values span individual-run medians. Page commit is navigation to actual page effect. Before-render → commit includes preparation/scheduling/hydration, not isolated React-only hydration CPU.

| Scenario | Serial TTFB           | Concurrent TTFB                               | 16-request elapsed                            | Page commit              | Before-render → commit |
| -------- | --------------------- | --------------------------------------------- | --------------------------------------------- | ------------------------ | ---------------------- |
| csr      | 1.970 → 1.956 → 1.948 | 1.973–1.974 → 1.993–2.019 → 1.999–2.007       | 2.494–2.555 → 2.544–2.551 → 2.558–2.565       | 51.85 → 49.00 → 47.80    | 12.40 → 10.40 → 8.55   |
| string   | 2.113 → 2.262 → 2.170 | 2.678–2.703 → 2.765–2.948 → 2.782–2.865       | 3.705–3.813 → 3.959–4.223 → 3.874–4.009       | 47.30 → 47.70 → 47.55    | 5.35 → 5.50 → 5.50     |
| stream   | 2.247 → 2.341 → 2.219 | 2.861–2.864 → 2.872–2.880 → 2.817–2.890       | 4.067–4.087 → 4.182–4.202 → 4.164–4.172       | 50.10 → 50.70 → 50.70    | 7.35 → 7.45 → 7.45     |
| bridge1  | 3.734 → 3.773 → 3.744 | 7.241–8.096 → 7.048–7.269 → 7.178–7.205       | 11.654–13.623 → 11.700–11.931 → 11.825–11.858 | 93.20 → 94.55 → 94.70    | 35.70 → 36.55 → 36.85  |
| bridge8  | 3.954 → 3.958 → 3.876 | 16.997–17.760 → 17.417–17.952 → 17.201–17.499 | 30.334–32.318 → 31.811–32.283 → 30.794–31.082 | 101.85 → 102.50 → 102.15 | 42.95 → 43.00 → 43.30  |

Primary paired head-minus-reference elapsed medians, per 16-request burst:

| Reference / launch order | CSR    | String | Stream | Bridge 1 | Bridge 8 |
| ------------------------ | ------ | ------ | ------ | -------- | -------- |
| pre-AB                   | +0.001 | +1.181 | +0.265 | +0.023   | -0.442   |
| pre-BA                   | -0.010 | +0.410 | +0.174 | +0.834   | -0.274   |
| base-AB                  | +0.004 | +1.213 | +0.015 | +0.608   | -0.310   |
| base-BA                  | -0.029 | -0.213 | -0.060 | -0.060   | -0.552   |

String SSR is slower than pre in both default launch orders, streaming also has positive differences. Relative to #9120, string/Bridge 1 direction changes with process order. These observations remain reported.

Additional controls, head-minus-reference elapsed median in ms:

| Reference / control / launch order | Warmup pairs | Logging | String delta | Stream delta | Bridge 1 delta | Bridge 8 delta |
| ---------------------------------- | ------------ | ------- | ------------ | ------------ | -------------- | -------------- |
| pre-serial-AB                      | 50           | verbose | +0.075       | +0.044       | +0.035         | -0.064         |
| pre-serial-BA                      | 50           | verbose | +0.065       | +0.015       | +0.017         | +0.059         |
| base-serial-AB                     | 50           | verbose | +0.040       | +0.031       | -0.019         | -0.010         |
| base-serial-BA                     | 50           | verbose | -0.002       | -0.020       | -0.072         | -0.012         |
| pre-deep-AB                        | 500          | verbose | +0.302       | +0.350       | -0.270         | +0.431         |
| pre-deep-BA                        | 500          | verbose | +0.651       | +0.177       | +0.017         | -0.068         |
| base-deep-AB                       | 500          | verbose | -0.107       | +0.088       | +0.107         | +0.320         |
| base-deep-BA                       | 500          | verbose | -0.075       | +0.283       | -0.719         | -1.266         |
| pre-quiet-AB                       | 50           | error   | +0.240       | +0.074       | -0.277         | -0.308         |
| pre-quiet-BA                       | 50           | error   | +0.098       | -0.007       | -0.463         | -0.485         |
| base-quiet-AB                      | 50           | error   | +0.013       | +0.044       | -0.149         | +0.054         |
| base-quiet-BA                      | 50           | error   | -0.262       | +0.029       | -0.134         | -0.664         |

Serial measures one request after 16-request warmups. Deep uses 500 warmup pairs, or 8,000 warmup requests per server/scenario, retaining default verbose logging. Quiet uses 50 warmup pairs with the existing server log level explicitly set to error. Reference and head always receive the same settings. Residual string SSR differences versus pre remain positive, including the quiet control, and are not dismissed as noise.

CPU sampling of 16,000 requests per revision gives 2,000-request block medians of 464.900 ms pre, 499.732 ms #9120 and 464.216/468.147 ms current. Inspector sampling is diagnostic, not a replacement score. Native writes, default per-request logs, GC and render work account for much of the samples. Current profiles include preparation and response ownership, without a new dominant initialization hotspot. Per-request ownership has a concrete purpose: isolated setup/context and cleanup when the response body completes or cancels. It is not replaced with a shared request runtime or early cleanup to improve timing. The data quantify the remaining tradeoff but do not establish an exact cause for every sub-millisecond HTTP difference. No universal speedup/zero-regression claim is made.

## Real browser memory and cleanup

| Mounted page heap, MB | Pre-unification | PR #9120    | Current     |
| --------------------- | --------------- | ----------- | ----------- |
| csr                   | 2.310–2.370     | 2.323       | 2.321       |
| string                | 2.232           | 2.240       | 2.237       |
| stream                | 2.298           | 2.305–2.307 | 2.302–2.303 |
| bridge1               | 4.405–4.406     | 4.440–4.441 | 4.424–4.427 |
| bridge8               | 5.693–5.694     | 5.742–5.745 | 5.727–5.729 |

Current one/eight-fragment heap is below #9120 but about 0.02/0.03 MB above pre. Ordinary string/stream pages also retain small increases. Reduced synthetic engine allocation does not imply every full-page heap decreases.

All three revisions complete ten Bridge mount/unmount cycles. Current/#9120 final listener floors are 293/1,287 for one/eight fragments, versus pre 436/1,430. The #9120 cleanup improvement is preserved, not claimed again. Host/React/history remain mounted, so total listeners are not expected to reach zero. Final unmounted heap is pre / #9120 / current 6.183 / 6.220–6.221 / 6.211 MB for one fragment and 6.538–6.539 / 6.567 / 6.556 MB for eight. Individual cycle heap/listener/DOM data is in results.json.

Four probes retain 50 destroyed public handles across ordinary CSR/hydration and Bridge CSR/progressive hydration. Both unified revisions have zero observed contexts/payloads/snapshot data, retain hydrated DOM identity, report zero browser errors and a listener floor of three. Legacy has no equivalent isolated ordinary handle contract, so it is not substituted into that probe. Real page/cycle results cover all three.

| Scenario RSS after concurrent SSR, KiB | Pre-unification     | PR #9120          | Current             |
| -------------------------------------- | ------------------- | ----------------- | ------------------- |
| csr                                    | 174,272–174,880     | 174,048–174,160   | 173,952–174,432     |
| string                                 | 294,464–296,272     | 313,936–315,568   | 319,504–320,320     |
| stream                                 | 327,152–328,208     | 340,304–342,688   | 341,920–342,624     |
| bridge1                                | 815,536–825,136     | 813,792–895,440   | 818,976–827,280     |
| bridge8                                | 1,025,056–1,077,088 | 985,168–1,423,120 | 1,012,272–1,031,072 |

Ordinary string/stream server RSS remains above pre-unification in these runs. This is retained as an observed cost, not inferred away from synthetic allocation results.

Per-run server RSS includes JIT, allocator/native-buffer capacity and all descendant server processes. Evidence retains the #9120 eight-fragment 1,423,120 KiB observation. RSS is not a context-retention counter or a stable memory-reduction claim.

## Limits and code reading

Local loopback, one shared desktop machine and Chrome, without throttling. Whole-repository framework/builder suites, other browsers/mobile/production networks, installed dependency size, production installation of all new Modern packages and isolated React-only hydration CPU were not verified. Native mf.node loading retains the pre-existing limitation above. Service App deployment/cache, updateRemotes, discovery and autoShared are outside scope. Core cache and deliberate user i18n sharing are unchanged.

1. [Shared owner](../../../packages/runtime/plugin-runtime/src/core/application/instance.ts) and [factory](../../../packages/runtime/plugin-runtime/src/core/plugin/index.ts)
2. [Cancellation plugin](../../../packages/runtime/plugin-runtime/src/core/application/cancellation.ts), [fragment routing](../../../packages/runtime/plugin-runtime/src/core/react/scopeDefinition.tsx), [browser operation](../../../packages/runtime/plugin-runtime/src/application/index.tsx) and [Request adapter](../../../packages/runtime/plugin-runtime/src/core/server/requestHandler.tsx)
3. [Router ownership](../../../packages/runtime/plugin-runtime/src/router/runtime/application.ts), [PrefetchLink](../../../packages/runtime/plugin-runtime/src/router/runtime/PrefetchLink.tsx) and [i18n](../../../packages/runtime/plugin-i18n/src/runtime/utils.ts)
4. [Manager](../../../packages/toolkit/plugin/src/manager.ts), [setup](../../../packages/toolkit/plugin/src/runtime/run/create.ts), [Cookie adapter](../../../packages/runtime/plugin-runtime/src/core/browser/cookies.ts) and [artifact check](../../../packages/runtime/plugin-runtime/scripts/check-cookie-artifacts.mjs)
5. [Shared plugin contract](../../../packages/runtime/plugin-runtime/tests/application/pluginContract.tsx), [capability tests](../../../packages/runtime/plugin-runtime/tests/application/capabilities.test.ts) and [browser tests](../../../packages/runtime/plugin-runtime/tests/application/browser.test.tsx)
