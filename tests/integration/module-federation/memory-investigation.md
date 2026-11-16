# SSR update memory investigation

Measured on 2026-11-16 using Node 24.18.1 and local builds of Modern, MF Core and Rspack, including the matching native binding. All 28 linked package roots and their build artifacts were audited against local outputs. MF Core revision: `ad02c97c4ba1040fc3bf33525647c7791912fe3f`. Rspack revision: `90113a33aa2006fcf74678102ddfb6d01ca1ab86`. Modern started from `8ac46254a3` with the diagnostic fixture changes in this commit.

## Lifecycle correction

The previously observed Undici timer retention is fixed in the application request owner. Undici 7.29.1 keeps a module-global `fastNowTimeout` and refreshes the same Node timer. That timer carries its creation-time AsyncLocalStorage frame, including Hono's Context. Leaving generation resources on that Context made completed requests retain retired render bundles.

The coordinator now runs an optional synchronous `onSettled` cleanup after both transport and registered producer work settle, before drain waiters and deferred updates resume. The application clears only its injected `templates`, `serverManifest`, `ssrRender` and `ssrWork` references. Business locals remain available. Undici internals and MF/Rspack cleanup are not changed.

Two post-fix experiments each completed 100 real updates for ordinary SSR and Service Host. The first took no heap snapshots during memory measurements. The second captured baseline, round 10/50/100 and idle snapshots, and also passed the Bridge draining and old HTML/browser release-retention tests. All commands and cleanup audits passed. All 28 local package roots and artifacts, including Rspack's native binding, were re-audited. Thirty-seven coordinator/application regressions passed, including retained-context tests for stream/producer completion, cancellation, stream errors and bodyless responses.

In both experiments, final idle snapshots contained only the current two ordinary MF instances or one Service Host instance. The old Host/producer pair previously reached through `fastNowTimeout → AsyncContextFrame → renderBundles` disappeared. During updates, transient HTTP request graphs can still outlive individual responses, but they did not remain as retired MF instances in the idle snapshots.

Post-fix snapshot-free Host heap measurements, MiB:

| Scenario     | Baseline | Round 100 + GC | Then idle 6 seconds + GC |
| ------------ | -------: | -------------: | -----------------------: |
| Ordinary SSR |    50.23 |          52.76 |                    49.99 |
| Service Host |    46.50 |          48.76 |                    47.72 |

The idle samples above precede the optional timing clear. Clearing resource timings afterward still released about 0.18–0.19 MiB. That separate bounded Node buffer is not cleared by the production fix. Remaining heap deltas include warm-up and other live allocations, and these measurements are not a claim of zero leaks under continuously new build identities.

The original measurements and retained-reference descriptions below document the pre-fix state for comparison. Their old-generation retaining path is superseded by the lifecycle correction above.

## Experiment

Ordinary SSR and Service Host each alternate two built producer versions 100 times, after warming both versions. Every round requires actual SSR HTML, matching browser release entry, hydrated interaction and unchanged service PIDs. Service validation also requires real producer HTTP requests and forbids a Host Node-container fallback. Memory is sampled after three GC passes. A separate control renders v1 100 times after the same warm-up and submits only no-op updates.

Four experiments passed their assertions and cleanup audits:

- `memory-100-r2`: 100 updates per scenario, snapshots at baseline and rounds 10, 50 and 100.
- `memory-100-r3`: 100 updates per scenario without snapshots, then 6 seconds idle, GC and an explicit resource timing clear.
- `memory-control-r2`: 100 same-version renders per scenario, followed by the same idle and clear. A snapshot is taken only after all memory measurements.
- `memory-100-r4`: final 100-update repeat with complete cache counters and a snapshot only after all memory measurements.

An initial diagnostic build failed because its server config compiles as CommonJS. The first control failed because the same version text could satisfy a browser wait before the new iframe loaded. Both were corrected. Neither failed experiment is used as passing evidence. The control now waits for the shell's actual render count before testing interaction.

## Results

Host `heapUsed`, MiB, from the final update experiment:

| Scenario     | Baseline | Round 10 | Round 50 | Round 100 | Idle 6 seconds + GC | Then clear timings + GC |
| ------------ | -------: | -------: | -------: | --------: | ------------------: | ----------------------: |
| Ordinary SSR |    50.73 |    53.39 |    53.00 |     54.69 |               51.51 |                   51.32 |
| Service Host |    46.75 |    47.73 |    48.66 |     49.02 |               47.72 |                   47.55 |

The earlier snapshot-free repeat ended at 49.81 MiB for ordinary SSR and 47.52 MiB for Service Host after the same idle and timing clear. The render-only control ended at 50.91 MiB from 50.74 MiB for ordinary SSR and 48.54 MiB from 46.75 MiB for Service Host. These independent runs show variability and warm-up growth in ordinary requests too. They do not support extrapolating the earlier ten-update delta as a fixed cost per update.

Final update RSS, before taking any snapshots, MiB:

| Scenario     | Baseline | Round 100 | Idle + GC |
| ------------ | -------: | --------: | --------: |
| Ordinary SSR |   212.45 |    234.44 |    224.16 |
| Service Host |   209.66 |    212.56 |    212.64 |

Taking repeated heap snapshots materially perturbed RSS: that experiment reached about 472 MiB for ordinary SSR and 410 MiB for Service Host. Those values are diagnostic overhead observations and are excluded from the snapshot-free RSS conclusions.

Service producers were sampled too. In the final repeat, v1 and v2 heap use rose from 52.24/52.25 MiB to 53.51/53.53 MiB at round 100. Most growth occurred before round 50. The render-only control also grew on the active v1 producer while its inactive v2 stayed near baseline. These results do not independently validate behavior with continuously new producer builds or cache TTL/capacity exhaustion.

## Located retention

### Request resource timing buffer

The retaining path is `resourceTimingBuffer → PerformanceResourceTiming`. The buffer reached 250 records and stopped increasing. Clearing it after measurements released about 0.17–0.19 MiB of Host heap in the snapshot-free update repeats. It accounts for a bounded part of the growth, not every retained byte. The diagnostic clear is opt-in and never runs in the normal update path.

### Old request contexts on HTTP resources

Snapshots during updates contain paths through `TCP → AsyncContextFrame → RequestInstance.onError → bundler runtime → MF instance`. Objects along these paths can outlive the completed SSR response. After an idle period, the Service Host snapshot contains only its current MF instance, and the render-only ordinary snapshot contains only its current Host and producer instances.

The final ordinary update snapshot still contains one retired Host/producer pair with this concrete path:

```text
undici/lib/util/timers.js module
  → fastNowTimeout
  → Timeout[kAsyncContextFrame]
  → request Context / renderBundles
  → old requestHandler / bundler runtime
  → old Host MF instance
  → ownership.disposingInstances
  → old producer MF instance
```

This is a real remaining reference to an old generation. Its count did not grow with every update in these experiments. The request context and Undici timer retain the graph after cache disposal. Clearing MF's global instance registry alone cannot sever this path. The amount attributable solely to this path has not been established by a dominator analysis. No production cleanup policy was changed to hide it.

### Runtime and module caches

Final update counters at baseline and round 100:

| Root                         | Ordinary SSR | Service Host |
| ---------------------------- | ------------ | ------------ |
| Registered MF instances      | 2 → 2        | 1 → 1        |
| Host module cache            | 1 → 1        | 1 → 1        |
| Instance manifest caches     | 0 → 0        | 0 → 0        |
| Retained provider sets       | 0 → 0        | 0 → 0        |
| Global moduleInfo keys       | 1 → 1        | 1 → 1        |
| Global manifest-loading keys | 0 → 0        | 0 → 0        |
| Global remote-entry keys     | 1 → 1        | 0 → 0        |
| Global share scope roots     | 2 → 2        | 1 → 1        |
| Node require-cache modules   | 766 → 766    | 766 → 766    |
| Node module child references | 1760 → 1760  | 1760 → 1760  |

Heap snapshots corroborate bounded live object counts. Ordinary `Module` objects were 1182 at rounds 10, 50 and 100, with eight total reachable/ephemeron MF objects at each point. Service `Module` objects went 996 → 1050 → 996 and MF objects 2 → 3 → 2 over those checkpoints. V8 code metadata also grew early and later declined in the snapshot experiment. The complete allocation history was not profiled, so warm-up/JIT is a supported contributor rather than a byte-for-byte explanation of all growth.

## Repeat

Use the existing Weather Lab port allocation and local linked package setup. Set a fresh artifact directory for each run:

```sh
MF_LAB_MODE=production MF_LAB_UPDATE_COUNT=100 MF_LAB_UPDATE_SCENARIOS=ordinary,service MF_LAB_MEMORY_DIAGNOSTICS=1 MF_LAB_ARTIFACT_DIR=/tmp/mf-memory-updates pnpm --filter mf-lab-tests test tests/remote-updates.test.ts
```

Add `MF_LAB_MEMORY_CONTROL=1` for same-version renders. `MF_LAB_MEMORY_DIAGNOSTICS=1` enables the final six-second idle observation and explicit resource timing clear. Normal update tests do not clear these records. Default CI still runs ten updates with its existing test identities.

Set `MF_LAB_HEAP_DIR` to capture Host snapshots. Without `MF_LAB_HEAP_FINAL_ONLY=1`, snapshots run at baseline and rounds 10, 50 and the configured final round. With `MF_LAB_HEAP_FINAL_ONLY=1` and memory diagnostics enabled, only the final idle snapshot runs, after the reported samples. Compare RSS only from experiments that do not take snapshots during the measurement period.

## Limits and conclusion

The tested two-version cycle does not show linear accumulation of old MF/module cache generations over 100 updates. A bounded resource timing buffer and delayed request-context retention are directly observed, including one retired ordinary generation still retained by an Undici timer. Remaining small deltas vary across repeats and controls. This does not prove that all memory is released or that continuously new build identities cannot leak. The captured request-context path was subsequently corrected as described above.
