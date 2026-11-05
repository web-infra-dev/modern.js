# Runtime capability refactor

Reference: #9120 at 93befbdc5b3c0203d5c84a338ed0d34ab9e15ffa. The branch is stacked on feat/runtime-application-unification. Core and the registry preview dependencies are unchanged.

## Ownership and phases

The application definition holds static components, route declarations and runtime factory registration. A mount or request owns one canonical context, one live plugin runtime, one preparation Promise and one Root. The page, fragment and Request adapters provide their own data before setup. The same ApplicationInstance executes awaited setup, onBeforeRender interruption/Response handling and Root wrapping. There is no second initializer.

Ordinary browser instances do not install preparation cancellation. The ordinary server Request adapter injects a cancellation plugin for disconnects. The Bridge adapter injects one fragment platform plugin that reuses the same cancellation implementation and supplies fragment props, route observations and browser data-endpoint adaptation. This supports both browser unmount cancellation and server cancellation. It is not an SSR-only MF lifecycle.

Capabilities declare their order with the existing plugin manager's post relation to requestContext. The kernel neither clones capability descriptors nor allocates an empty capability-name list for ordinary instances. The optional wrapPreparation hook is registered only when an adapter supplies it. Normal CSR allocates no cancellation hook record, cancellation race or abort listener.

Router owns route cloning and Router disposal. Ordinary applications allocate mutable route declarations when the routing plugin uses them. The fragment platform plugin prepares its own declarations during setup. Its component wrappers, commit callbacks and endpoint functions belong to that instance. There is no static route-wrapper cache or copied application-definition view. Props updates and internal navigation retain that graph, Root and Router. Basename changes still dispose and remount.

Toolkit core hooks use live records without definition-cloning metadata. Public static hook helpers retain cloning metadata and their existing wrapper behavior. Ready state is shared only when already fulfilled. Asynchronous readiness remains instance-owned. Cleanup and cleanup-error arrays allocate on first use.

The plugin API and internal React Provider use the canonical context. The public Provider remains the stable filtered view from #9120. updateRuntimeContext still deep-merges values and does not bind the patch root to context or trigger a render. This PR introduces no mirrored context.

## Removed responsibilities

- Removed cancellation Promise races, AbortSignal subscriptions and error callbacks from the common application owner.
- Removed eager route graph allocation and Router cleanup from that owner.
- Removed copied selected/RSC/loader/chunk-loader/entry-path metadata fields from every instance. Plugins read the static definition through context.
- Removed the owner facade's captured getter closures and separate Root storage. The owner uses shared class methods and stores Root only on its canonical application context.
- Removed hook-definition cloning closures from each live core and Router hook record.
- Removed eager cleanup arrays and per-runtime settled readiness Promises.
- Removed the experimental static route-wrapper cache and normalized definition copy after artifact and allocation comparisons. They are absent from the final diff.

## Built-in consumers and boundaries

Router, PrefetchLink, RSC route selection and i18n read the current context and definition. Request context and renderers keep the same context contract verified by the shared page/Bridge test plugins. Mutable Router and i18n state remains inside setup or the current instance. Remaining module state consists of static registration, filtered-view WeakMaps, user-keyed SDK caches and stateless encoding/resource helpers. It does not hold the current request.

The page shell still reads document SSR_DATA, Router data and document resource globals at its input boundary. Bridge reads its own progressive snapshot and resource inputs. A real Request remains the server input. Document versus fragment output, browser versus Node rendering, producer data URLs versus consumer mount paths, and progressive multi-stream transport retain separate adapters because their data and output protocols differ. Browser history and event APIs remain available. Only explicit memoryRoute creates independent memory navigation.

## Release and validation

Publish the toolkit plugin package containing createRuntimeSyncHook before or with the matching Modern runtime, then the matching i18n package. The changeset covers all three. Regenerate generated entry directories and rebuild the application. No Core source or new Core release is required. Tests use the checked-in real registry preview 0.0.0-feat-enhanced-runtime-unification-20261104092109, without local Core overrides or tarballs.

Validation: runtime 310, toolkit 26, i18n 25, MF 65 and app-tools 124. Ordinary framework tests pass 108 cases with two unchanged pre-existing skips across 13 files. Full Weather Lab 195/195 in dev and production, with no skips. Retry 0. An uncached 20-task build graph, final runtime/MF builds, declaration and source type checks, bilingual docs build, formatting and lint. Four MF and six ordinary ESM/CJS physical-entry checks exclude wrong-platform dependencies. Actual HTML, hydration DOM identity and per-stream behavior are checked, rather than inferred from a final CSR view.

Whole-repository framework/builder suites, other browser engines, mobile/network throttling, installed dependency size, Service App deployment/cache and production infrastructure are outside this verification. Deliberately shared user i18n objects and Core's existing ordinary-component data-fetch cache retain their existing semantics.

## Fixed protocol and evidence

Measured reference `93befbdc5b3c0203d5c84a338ed0d34ab9e15ffa` against `58fa00809bba1ca25b6e4568110f18dd12776f55`. The final production-code change is `25402d62f998c1e841fea78d02981a6ab3e617a6`. Later benchmark/report-only changes do not alter runtime package sources.

Independent frozen installs use lock SHA256 `abd3017603f87585ab9f2bb962dbb91637a49a6c6099e3579ab10d2f273bf095`, Node 24.18.1, pnpm 10.13.1, Chrome 149.0.7827.54 and Apple M5 Pro. Production builds disable the build cache and use default minification. Gzip uses level 9. Dist fingerprints are `4389feb37db44981f109cb7516a02df6efb9ded617cdaa83af763850fbfb25e2` and `d06a233ac00922277680523eb394f427098baff49031bfea837620bccbdedccd`. The same primary harness SHA256 is `abee881da92d3aac3473a015bea290c5a5c31c015b9027b7272881b1b271a31d` in all four runs. Both repetitions of each revision have identical source and dist fingerprints and clean source trees.

The matrix runs A1 → B1 → B2 → A2 after all builds and regressions finish. Each scenario has two serial/browser warmups and nine measured samples, plus 50 warmup and 50 measured bursts of 16 requests. Two independent processes per revision measure nine initialization rounds and three memory rounds each. Fixed-artifact paired controls use 50 warmup pairs and 100 measured pairs, alternating request order and then reversing process launch order. Additional serial controls retain 16-request warmup bursts and measure one request at a time.

[Protocol and commands](README.md), [sanitized metrics and individual initialization/memory rounds](results.json), and [all 1,000 paired concurrent round measurements](paired-rounds.csv) are checked in. Full per-request/warmup samples, original response HTML, module stats, process inventories and failure logs remain in the local evidence package. Public evidence omits private machine paths and process inventories.

### Emitted size and composition

Bytes below are JS/MJS/CSS, **raw / gzip**, A1 → B1. They exclude source maps, images and manifests. Lab totals include all fixture routes and exposes, not one page's network transfer. Node totals exclude external dependencies. Every individual run is retained in results.json.

| Output       | Browser reference → head          | Node reference → head               |
| ------------ | --------------------------------- | ----------------------------------- |
| Ordinary CSR | 496555 / 158316 → 496378 / 158068 | 0 / 0                               |
| String SSR   | 509145 / 163038 → 508931 / 162793 | 1930330 / 376066 → 1926906 / 375974 |
| Stream SSR   | 508814 / 162949 → 508601 / 162703 | 1829558 / 358597 → 1825774 / 358470 |
| Lab host     | 862747 / 275925 → 862797 / 275732 | 3885597 / 792390 → 3878473 / 792347 |
| Lab producer | 876451 / 280881 → 877826 / 281260 | 3296607 / 708474 → 3294260 / 709055 |
| Lab nested   | 833372 / 260907 → 833331 / 260722 | 3762237 / 777784 → 3755402 / 777676 |

Ordinary outputs are byte-identical within each revision's two builds. Across the two Lab builds, browser gzip changes are host −185 to −196 B, nested −167 to −185 B, and producer **+349 to +379 B**, about 0.12–0.14 percent. Producer Node gzip grows 581–592 B while its raw output shrinks 2347 B. This is not a claim of zero producer growth.

The remaining producer cost is the optional preparation-hook and fragment-platform wiring and moving route ownership into plugins. It introduces no new external dependency. React, React DOM, React Router, core-js, scheduler and cookie module counts and source sizes are unchanged. Ordinary client stats contain zero Bridge recovery, Node builtin or optional cancellation/fragment-module matches. The build also checks all six ordinary ESM/CJS physical dependency graphs. Runtime source-module bytes in the CSR inventory decrease 43498 → 42552, while toolkit source bytes increase 17245 → 18074. These are composition figures, not additive minified attribution.

Rslib's captured `v1/ssr` and `v2/ssr` files are partitioned as server assets in the evidence and corrected harness. That inventory correction does not change Modern totals or timing samples.

### Initialization and live-instance memory

The synthetic fixtures use eight identical plugins, empty routes and no DOM. `engine` means the generic plugin runtime, canonical context and measurement handle. It does not mean a mounted Bridge application. Memory is the live heap difference with 1,000 prepared owners retained after GC, median of six rounds in two processes. MB means 1,000,000 bytes. The server fragment fixture explicitly enables route-commit metadata and is not the complete real SSR renderer.

| Retained synthetic group                | Reference bytes → head bytes | Change        |
| --------------------------------------- | ---------------------------- | ------------- |
| Plugin runtime and context              | 5788464 → 4714880            | −18.5 percent |
| Ordinary browser owner                  | 6615736 → 5017676            | −24.2 percent |
| Fragment browser owner                  | 6914324 → 6274300            | −9.3 percent  |
| Fragment server owner with observations | 7243080 → 6619008            | −8.6 percent  |

All observed owners and actual contexts become unreachable after disposal and dropping references in every round. This is separate from keeping disposed public handles alive below.

| Create, eight-plugin setup, prepare and dispose cycle | Reference µs → head µs |
| ----------------------------------------------------- | ---------------------- |
| Ordinary browser                                      | 5.826 → 5.028          |
| Fragment browser                                      | 5.756 → 5.815          |
| Ordinary request with a fresh signal                  | 6.208 → 6.180          |

These are medians of 18 rounds per revision, each with 500 warmups and 5,000 measured iterations. An intermediate candidate was about one microsecond slower for fragment and request cycles. Removing the plugin manager's repeated Array.from/filter/forEach allocations eliminated that regression while preserving dependency and usePlugins ordering. It does not introduce another scheduler.

### HTTP and browser completion

Times are milliseconds. Serial and browser columns pool the two runs. Concurrent columns show the range of the two individual-run medians. Page commit is navigation start → actual page effect. The phase column is first onBeforeRender → actual page effect, including scheduling and framework work. It is not isolated React hydration CPU time. For multiple fragments it ends at the last observed page effect.

| Scenario | Serial TTFB reference → head | Concurrent TTFB reference → head | 16-request elapsed reference → head | Page commit reference → head | Phase reference → head |
| -------- | ---------------------------- | -------------------------------- | ----------------------------------- | ---------------------------- | ---------------------- |
| CSR      | 1.937 → 1.936                | 2.002–2.027 → 2.016–2.018        | 2.541–2.545 → 2.539–2.582           | 49.70 → 50.80                | 10.30 → 12.30          |
| String   | 2.197 → 2.202                | 2.854–2.937 → 2.861–2.918        | 4.072–4.074 → 4.041–4.046           | 47.90 → 47.30                | 5.40 → 5.40            |
| Stream   | 2.338 → 2.161                | 2.893–2.931 → 2.884–2.999        | 4.187–4.273 → 4.086–4.228           | 50.70 → 50.95                | 7.40 → 7.40            |
| Bridge 1 | 3.751 → 3.754                | 7.119–7.597 → 7.230–7.236        | 11.809–12.602 → 11.706–11.945       | 94.80 → 93.70                | 36.85 → 36.25          |
| Bridge 8 | 3.875 → 4.300                | 17.122–17.913 → 17.013–17.567    | 31.023–32.527 → 30.878–31.261       | 102.10 → 101.90              | 42.95 → 43.30          |

Bridge 8's low-warmup serial TTFB is about 0.425 ms higher. It remains in the report. After 800 warmup requests per server, alternating serial TTFB is 3.493 → 3.437 ms with baseline-first launch and 3.307 → 3.315 ms with head-first launch. First real application HTML is 3.686 → 3.633 and 3.506 → 3.486 ms respectively. The low-warmup difference does not reproduce as a stable-state delay in these controls. This is evidence consistent with warmup/scheduling sensitivity, not proof of a unique cause.

The paired concurrent controls also change direction with process launch order. Values below are paired head-minus-reference burst elapsed medians, followed by the resampled 95 percent interval. Resampling does not remove autocorrelation or shared-machine scheduling effects.

| Scenario | Baseline processes launched first | Head processes launched first |
| -------- | --------------------------------- | ----------------------------- |
| CSR      | −0.007 [−0.033, +0.017]           | +0.020 [−0.005, +0.036]       |
| String   | +0.106 [+0.030, +0.287]           | −0.398 [−0.482, −0.334]       |
| Stream   | −0.155 [−0.238, −0.076]           | +0.162 [+0.055, +0.276]       |
| Bridge 1 | −0.151 [−0.426, +0.016]           | +0.408 [+0.088, +0.625]       |
| Bridge 8 | −0.071 [−0.820, +0.491]           | +0.585 [+0.060, +1.270]       |

The data support neither a universal SSR speedup nor a blanket zero-regression claim. All protocols and directions are retained. The synthetic allocation and initialization improvements are more repeatable than the small local HTTP differences.

### Real browser memory and release

Mounted JS heap ranges in decimal MB across the two runs are CSR 2.323–2.324 → 2.324, string 2.240 → 2.238–2.240, stream 2.307 → 2.305–2.306, Bridge 1 4.442 → 4.440, and Bridge 8 5.744–5.750 → 5.746. The large synthetic percentage reduction is not a claim of the same reduction for an entire mounted page.

After ten Bridge mount/unmount cycles, the final listener floors remain 293 for one fragment and 1287 for eight in both revisions. Each of the final five unmounted cycles has that same floor. Final unmounted heap remains about 6.221 MB and 6.568 MB respectively. The host, React, history and event infrastructure remains alive and is not expected to reach zero.

The four independent retained-handle probes cover ordinary CSR, ordinary string hydration, Bridge CSR and progressive Bridge hydration. They wait for the actual App effect before checking hydrated node identity or unmounting. With 50 destroyed public handles retained, **both** revisions have zero observed contexts, payloads and normalized snapshot-data objects alive, zero browser errors, and a listener floor of three. This preserves #9120's release behavior rather than claiming its earlier leak fix again.

Concurrent SSR server RSS is coarse and includes all descendant Modern server Node processes, excluding the measurement driver. After the matrix, ranges in KiB are CSR 174272–174512 → 172848–174288, string 315200–315472 → 318224–320240, stream 341232–343088 → 340864–341504, Bridge 1 818544–893952 → 820752–908496, and Bridge 8 958240–1109232 → 1048176–1094624. RSS includes JIT, allocator capacity and native buffers. It is not a retained-context counter or proof of reduced server RSS.

## Validation notes and limits

One complete-matrix attempt encountered a dev nested-manifest readiness timeout before three tests could run. It had 192 passing tests and one failed setup. Readiness failures now retain bounded status, content type, body and error diagnostics. The isolated file passed all 12 dev/production tests, followed by a fresh isolated 195/195 full run. The original timeout was not reproduced and its root cause is not established. No timeout, retry or assertion was relaxed.

The plugin manager's new traversal also matches the prior traversal on 5,000 valid dependency graphs and 5,000 cyclic graphs in a diagnostic comparison. The checked-in unit test protects explicit dependency priority and repeat order queries.

All timings are local loopback on one shared developer machine. There is no mobile, production-network, dedicated-host or additional-browser claim. Warmup, startup and process ordering materially influence sub-millisecond differences. Exact React-only hydration CPU time and installed dependency size were not measured. The complete framework/builder repository suite was not run.

## Code reading order

1. [Shared owner](../../../packages/runtime/plugin-runtime/src/core/application/instance.ts#L31) and [generated factory](../../../packages/runtime/plugin-runtime/src/cli/template.ts#L257)
2. [Optional cancellation capability](../../../packages/runtime/plugin-runtime/src/core/application/cancellation.ts#L17) and [single fragment platform plugin](../../../packages/runtime/plugin-runtime/src/core/react/scopeDefinition.tsx#L89)
3. [Lazy route ownership](../../../packages/runtime/plugin-runtime/src/router/runtime/application.ts#L19) and [Router cleanup](../../../packages/runtime/plugin-runtime/src/router/runtime/plugin.tsx#L125)
4. [Dependency traversal](../../../packages/toolkit/plugin/src/manager.ts#L130), [live runtime hooks](../../../packages/toolkit/plugin/src/runtime/hooks.ts), and [lazy cleanup state](../../../packages/toolkit/plugin/src/runtime/context.ts)
5. [Shared plugin contract](../../../packages/runtime/plugin-runtime/tests/application/pluginContract.tsx) and [capability tests](../../../packages/runtime/plugin-runtime/tests/application/capabilities.test.ts)
