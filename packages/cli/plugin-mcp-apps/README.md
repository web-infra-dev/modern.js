# @modern-js/plugin-mcp-apps

Declare React cards in `mcp-views.json` and enable `mcpAppsPlugin({ views: './mcp-views.json' })`.

```json
{
  "views": {
    "todos": "./src/components/Todos.tsx",
    "stats": { "expose": "./Stats" }
  },
  "csp": { "resourceDomains": [], "connectDomains": [] },
  "prefersBorder": true
}
```

Component paths resolve relative to the JSON file. Components must have a default export. MF exposes refer to this application's actual MF manifest output and must also have a default component export. Enable the Modern.js MF plugin and manifest generation to use them. Cards and the MF shell are built with the application's React dependencies in a separate Rsbuild compilation. Their startup scripts and styles are inlined into HTML so the host handshake does not depend on the application's MF bootstrap. Project aliases and defines are retained, and imported assets are emitted with the application assets.

The plugin builds HTML and emits `dist/mcp-apps/ui-manifest.json`, including MF-only configurations. It never loads tool handlers or registers HTTP routes. Export `createBffHandlers(createServer)` from `api/lambda/mcp.ts` for `/api/mcp`, or use an independent server with `createFetchHandler`.

The development Inspector is available at `/mcp/inspector`. Disable it with `inspector: false` or configure its initial server address with `inspector: { endpoint: '/custom/mcp' }`. Its previews use an isolated origin. Production builds do not include the Inspector.

The build manifest uses relative HTML and shell paths, MF manifest paths relative to `assetBase`, and version `1`. An absolute `output.assetPrefix` becomes `assetBase`. Other prefixes use request-origin resolution. The server must deploy the manifest and HTML together, and serve the application's static assets separately.

Local card filenames use `mcp-ui-<normalized-view-name>-<name-hash>.html`. The label is limited to 48 ASCII characters, with `view` as the fallback. The hash is derived from the original view name to distinguish labels that normalize to the same value. Component paths do not affect the filename.
