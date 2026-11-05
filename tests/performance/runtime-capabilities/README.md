# Runtime capability measurements

Run these opt-in benchmarks against two independently installed and built worktrees. They do not change source files or package dist. Fixture copies and build caches belong to the supplied output directory.

The reference for this change is PR #9120 at `93befbdc5b3c0203d5c84a338ed0d34ab9e15ffa`. Use the same scripts, lockfile, Node, pnpm, Chrome and build flags for both revisions. Build each revision before measuring and keep that worktree clean. Do not run builds or regression suites during timed measurements.

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

These scripts target the shared application contract present in both #9120 and its successor. `PERF_SKIP_BROWSER=1` is only for artifact diagnostics. It cannot establish hydration or browser resource behavior.

- `run.mjs` builds ordinary CSR, string SSR and streaming SSR without MF, plus Weather Lab with one and eight Bridge applications. It records every browser JavaScript asset in raw and gzip bytes, original HTML, actual Bridge HTML frame content, per-stream ready/done events, HTTP first byte, first application HTML, 16-way concurrent SSR, browser setup/effect timestamps and repeated mount/unmount resource counters. Gzip totals sum each asset compressed independently. Full producer totals include every expose, rather than only the initial page's downloaded assets.
- `composition.mjs` inventories retained modules from client/server stats. Source byte sizes explain composition but are not additive minified attribution.
- `memory-components.mjs` keeps 1,000 initialized owners alive, collects garbage and reports live heap differences over three rounds. The eight test plugins are identical. `engine` means the generic plugin runtime plus its canonical context, not a mounted Bridge application. Ordinary, Bridge browser and Bridge server owners are separate cases. These synthetic fixtures have empty routes and render no DOM. WeakRefs track owners and actual contexts after disposal and reference release.
- `paired.mjs BASE_OUTPUT HEAD_OUTPUT OUTPUT BASE_REPO HEAD_REPO` reuses two completed artifact runs, starts both revisions simultaneously and alternates A→B and B→A bursts. It records 50 warmup pairs and 100 measured pairs at 16 requests per burst, without rebuilding. It independently checks actual SSR content.
- `micro.mjs` measures construction, eight plugin setups, preparation and cleanup over nine rounds of 500 warmups and 5,000 iterations. The server case has a fresh request signal and installs the request cancellation capability when available.
- `retained-handles.mjs` keeps 50 disposed public handles alive for ordinary rendering, Bridge mounting and progressive hydration. It checks context/payload/snapshot reachability, real hydration DOM identity, browser errors and DOM/listener counters. This is a release check, separate from live-instance memory.

Record source and dist fingerprints, individual rounds and exclusions with the result. Repeat in alternating revision order. Report timings with their spread and avoid a speed claim when process/JIT/browser noise changes the direction. A successful final CSR view is not SSR evidence.

No MF or Core package publication is performed by these scripts. They use the checked-in registry dependencies, without local Core overrides.
