# Service RSC feasibility probe

This experiment runs real Server Components behind the existing Bridge Service HTTP transport. It does not add a public Modern RSC Service API.

The Host has no React root. It uses MF manifests and `loadRemote` to load each producer's mount adapter. The adapter owns React, React DOM, the Flight decoder and Client Component chunks. Federation sharing is disabled.

## Run

Build from this directory with `node build.mjs`. Dependencies must first be installed in the experiment worktrees. `MF_RSC_BASELINE` can point to an existing locally built Modern checkout to reuse its installed toolchain. This also selects the sibling core checkout's existing Service fetch implementation. It does not rebuild Rspack or MF.

Start `serve.mjs` through the task's registered dev-service lease. It reads `JO_PORT_HOST`. Open the resulting address and click **Load RSC services** after the document has loaded.

## Flow

1. The Host discovers the producer through its MF manifest and loads `./client`.
2. The mount adapter sends a Bridge Service request.
3. The producer executes `Page.tsx` in the RSC layer, including a Node filesystem dependency and an async component.
4. The Flight stream is split. The SSR layer decodes one branch into HTML. The other branch becomes an opaque hydration snapshot.
5. Existing Bridge framing transports HTML and that snapshot.
6. The producer client decodes the snapshot with its own runtime and hydrates its independent root.

`entry.rsc.tsx`, `entry.ssr.tsx` and `client.tsx` are the three runtime boundaries. `rsbuild.config.mjs` uses the same RSC plugin as Modern's builder to isolate the bundler question from Modern routing integration.

## Scope and evidence

The initial browser check confirmed two independent instances, late loading after document readiness, interactive hydration, and no console errors. The two build variants use distinct federation container names and chunk globals. This does not yet prove simultaneous versions of the same federation name.

Flight currently completes into a string snapshot before hydration. Incremental Flight decoding, unmount during an unfinished request, Server Actions, same-name version replacement, development HMR, and the standard Modern Service application adapter remain to be implemented or verified. HTML writes use a simple probe container and are not a production streaming DOM implementation.

No shared-layer interoperability or performance advantage is claimed. No new Rspack or MF core changes have been needed for this probe.

## Weather Lab comparison

Set `MF_LAB_RSC_ORIGIN` to the probe origin when building the Weather Lab Host. Service apps → Loading defaults to Climate report and adds a third `Service App RSC` iframe. Without that variable, the existing two-frame comparison is unchanged.

All three frames reuse the same report content, six ECharts charts and period/station/filter controls. The shared Load button supplies one timestamp to all frames. The RSC frame accepts messages only from its embedding parent origin, and the Host checks the exact frame window and configured frame origin.

The RSC comparison currently uses fixed report data. Loader and asset-prefetch controls are disabled in this comparison until the RSC adapter supports them. Flight is still delivered as a complete snapshot. This is a functional comparison, not evidence of a general RSC performance improvement. The interactive chart code remains client-side.

The RSC Service integration is an independent opt-in experiment. It can ship as
a separate adapter plugin once the interface is settled. It uses an independent
React root and starts without federation sharing. Existing Modern Service App
configuration and rendering stay as they are. Revisit a unified design after
the shared-dependency and compiler-layer contracts are understood.
