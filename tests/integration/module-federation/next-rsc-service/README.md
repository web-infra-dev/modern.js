# Next.js RSC Service interoperability demo

The Next.js App Router owns the server component tree. The fixture reads
Weather Lab's climate API on the server and renders the shared climate report,
including six ECharts charts, filters and station pagination. The Weather Lab's
**Service apps → Loading → Climate report** view shows the Next.js producer in a
separate optional panel.

## Run locally

1. Install the Weather Lab workspace dependencies so the shared report can
   resolve ECharts. In this directory, run `npm ci`, then run `npm run build`
   with `NEXT_SERVICE_ASSET_ORIGIN` set to the Next producer's registered origin.
2. Build the existing [RSC probe](../rsc-probe/README.md) and set
   `MF_RSC_PROBE_DIST` to its output directory. Set `MF_RSC_BASELINE` to the
   locally built Modern checkout that supplies the Bridge Service dependency.
3. Start `npm start` on the task's registered `JO_PORT_NEXT` with
   `MF_LAB_API_ORIGIN` pointing to the running Weather Lab API. For LAN access,
   set `MF_LAB_PUBLIC_HOST` to the same address used for the asset origin.
4. Set `MF_LAB_NEXT_RSC_ORIGIN` to the Next producer origin when building the
   Weather Lab host. Click **Load** in the Climate report and change **Period**
   or use **Next** in the Next.js panel to verify the report is interactive.
   The optional panel's test harness can also run independently at `/embed`.

## Boundaries

- `export-service.mjs` extracts the report HTML and Flight bytes from one native
  Next.js render. `serve.mjs` sends both through the existing Bridge Service
  handler and includes the compiled stylesheet so the host can apply it
  before inserting the report.
- The browser harness uses MF to discover `weather_next_rsc/client`. The
  exposed adapter uses Next's own Flight decoder and chunk IDs, then hydrates
  the report in its own React root. The embed page hosts the harness and does
  not boot Next's document router.
- This is opt-in and keeps federation `shared` empty. It pins one Next webpack
  build and relies on its internal document and Flight formats. The fixture
  buffers the full Flight snapshot. Server Actions, navigation, shared
  dependencies and progressive Flight delivery are outside this proof.
