# Runtime capability measurements

Run these opt-in benchmarks against two independently installed and built worktrees. They do not change source files or package dist. Fixture copies and build caches belong to the supplied output directory.

The references are pre-unification `24b3752e8c8213b5b4166b77880065d8544e0025` and PR #9120 at `93befbdc5b3c0203d5c84a338ed0d34ab9e15ffa`. Use the same scripts, Node, pnpm, Chrome and build flags for all revisions. Preserve each revision's frozen lockfile. The successor changes only the runtime's build-time Cookie dependency and removes its old Cookie type package, with every other locked package unchanged. Build each revision before measuring and keep that worktree clean. Do not run builds or regression suites during timed measurements.

```sh
export PUPPETEER_EXECUTABLE_PATH="/path/to/chrome"
export PERF_CONCURRENT_WARMUP=50
export PERF_CONCURRENT_ROUNDS=50
node --expose-gc tests/performance/runtime-capabilities/run.mjs "$MEASURED_REPO" "$OUTPUT" all
node tests/performance/runtime-capabilities/composition.mjs "$OUTPUT"
node --expose-gc tests/performance/runtime-capabilities/memory-components.mjs "$MEASURED_REPO" "$OUTPUT/memory.json"
node --expose-gc tests/performance/runtime-capabilities/micro.mjs "$MEASURED_REPO" "$OUTPUT/micro.json"
node tests/performance/runtime-capabilities/retained-handles.mjs "$MEASURED_REPO" "$OUTPUT/retained"
```

The ordinary-owner and retained-handle probes target the shared application contract present in both #9120 and its successor. The macro, engine and fragment probes also support the pre-unification implementation. `PERF_SKIP_BROWSER=1` is only for artifact diagnostics. It cannot establish hydration or browser resource behavior.

- `run.mjs` builds ordinary CSR, string SSR and streaming SSR without MF, plus Weather Lab with one and eight Bridge applications. It records every browser JavaScript asset in raw and gzip bytes, original HTML, actual Bridge HTML frame content, per-stream ready/done events, HTTP first byte, first application HTML, 16-way concurrent SSR, browser setup/effect timestamps and repeated mount/unmount resource counters. Gzip totals sum each asset compressed independently. Full producer totals include every expose, rather than only the initial page's downloaded assets.
- `composition.mjs` inventories retained modules from client/server stats. Source byte sizes explain composition but are not additive minified attribution.
- `memory-components.mjs` keeps 1,000 initialized owners alive, collects garbage and reports live heap differences over three rounds. The eight test plugins are identical. `engine` means the generic plugin runtime plus its canonical context, not a mounted Bridge application. Ordinary, Bridge browser and Bridge server owners are separate cases. These synthetic fixtures have empty routes and render no DOM. WeakRefs track owners and actual contexts after disposal and reference release.
- `paired.mjs BASE_OUTPUT HEAD_OUTPUT OUTPUT BASE_REPO HEAD_REPO` reuses two completed artifact runs, starts both revisions simultaneously and alternates A→B and B→A bursts. It records 50 warmup pairs and 100 measured pairs at 16 requests per burst, without rebuilding. Set `PAIRED_LAUNCH_ORDER=BA` to start the head processes first and check launch-order sensitivity. Set `PAIRED_MEASURED_CONCURRENCY=1` to measure serial requests after the same 16-request warmup bursts. The script rejects overlapping fixture URLs and ports and independently checks actual SSR content.
- `micro.mjs` measures construction, eight plugin setups, preparation and cleanup over nine rounds of 500 warmups and 5,000 iterations. It includes a plugin-engine row for all three revisions. Legacy fragment setup uses its original scope factory and before-render hook, and has no disposal capability. The isolated ordinary-owner and request rows are omitted for that revision. The server case has a fresh request signal and installs the request cancellation capability when available.
- `retained-handles.mjs` keeps 50 disposed public handles alive for ordinary rendering and hydration, Bridge mounting and progressive hydration. It checks context/payload/snapshot reachability, real hydration DOM identity, browser errors and DOM/listener counters. This is a release check, separate from live-instance memory.

Record source and dist fingerprints, individual rounds and exclusions with the result. Repeat in alternating revision order. Report timings with their spread and avoid a speed claim when process/JIT/browser noise changes the direction. A successful final CSR view is not SSR evidence.

The default server logging level is verbose in production. For separate sensitivity controls, set `PAIRED_WARMUP_PAIRS=500` to retain default logging with 8,000 warmup requests per server, or set `MODERN_SERVER_LOG_LEVEL=error` with the default 50 pairs to isolate logging. Apply the same setting to both revisions. Preserve the original default-parameter results and report every control separately.

No MF or Core package publication is performed by these scripts. They use the checked-in registry dependencies, without local Core overrides.

The measured comparison and its limits are in [RESULTS.md](RESULTS.md). The synthetic `bridgeServer` fixture enables commit metadata explicitly and is not the complete SSR renderer. Probe bundling uses the esbuild version locked in the workspace tooling store.

`verify-manager.mjs REPO [REF]` compares 10,000 seeded plugin dependency graphs with the fixed reference manager, including 5,000 circular graphs. `verify-cookies.mjs PRE_UNIFICATION_REPO HEAD_REPO` compares the old Cookie parser with the emitted browser compatibility parser over 100,017 fixed and seeded inputs. Run both before timing measurements.

For the pre-unification revision, `memory-components.mjs` measures the legacy plugin runtime together with its external Provider context and the deep-merged plugin context. Fragment ownership is measured through its real legacy scope constructor. The ordinary isolated-owner row is omitted because that implementation reused a global registration. The JSON records this contract difference and tracks both context views after release. Unified revisions use the same canonical-context fixture, and server fragment fixtures install the request-cancellation capability when available.

Cookie 2 is a build dependency. The runtime build bundles its unmodified parser into ESM and CJS, includes its license and checks that no external Cookie import or serialization implementation remains. Production dependency installation therefore retains Modern's Node range. To check Node 20 server behavior, run `PERF_SKIP_BROWSER=1 PERF_CONCURRENT_ROUNDS=1 "$NODE20" --expose-gc tests/performance/runtime-capabilities/run.mjs "$HEAD_REPO" "$OUTPUT" all`. This is compatibility verification, separate from timings measured on the fixed benchmark Node version.
