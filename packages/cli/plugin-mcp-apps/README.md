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

Component paths resolve relative to the JSON file. Components must have a default export. MF exposes refer to this application's actual MF manifest output and must also have a default component export. Enable the Modern.js MF plugin and manifest generation to use them. Local cards are added as application entries and reuse the framework's multi-entry compilation, including its loaders, styles and build plugins. Only the MF shell uses a separate Rsbuild compilation with the application's React dependencies, with its startup scripts and styles inlined.

The plugin builds HTML and emits `dist/mcp-apps/ui-manifest.json`, including MF-only configurations. It never loads tool handlers or registers HTTP routes. Export `createBffHandlers(createServer)` from `api/lambda/mcp.ts` for `/api/mcp`, or use an independent server with `createFetchHandler`.

The build manifest uses relative HTML and shell paths, MF manifest paths relative to `assetBase`, and version `1`. An absolute `output.assetPrefix` becomes `assetBase`. Other prefixes use request-origin resolution. The server must deploy the manifest and HTML together, and serve the application's static assets separately.

Local card filenames use `mcp-ui-<normalized-view-name>-<name-hash>.html`. The label is limited to 48 ASCII characters, with `view` as the fallback. The hash is derived from the original view name to distinguish labels that normalize to the same value. Component paths do not affect the filename.

Local card HTML is copied from its application entry's emitted HTML into `mcp-apps/ui/`. Source changes use the framework's normal dependency tracking and rebuild pipeline.

Local card entries mount React directly through `createMcpView`, with an asynchronous bootstrap for MF shared initialization. They disable the framework page auto-mount runtime because an opaque MCP Apps sandbox cannot read page cookies. Compilation, code splitting, styles, loaders and file watching still use the application multi-entry pipeline.
