# Modern.js MCP Apps

```sh
pnpm install
pnpm dev
```

The MCP endpoint is `/mcp`. Define tools in `mcp_apps.ts` and implement handlers
in `mcp_apps.ts`. A normal browser GET to `/mcp` returns 405; connect an MCP
client with POST requests instead. This starter does not include a DevTools host.

```sh
pnpm build
pnpm serve
pnpm deploy
```

`build` uses the server compiler to emit the definition and handlers into `dist/`. `serve` reads
those artifacts. `deploy` produces `.output/`, which can be moved to another
directory and started with `node .output/index.js`.

The default UI template compiles `view.module` (a local React component) into
Modern.js HTML and static JS/CSS assets. It does not need Module Federation or a manifest.
Create with `--template mcp-apps --mf` to opt into MF remote components instead;
MF mode discovers local remotes from emitted manifests and their publicPath.
Configure dev.assetPrefix or output.assetPrefix for public assets.

Server and UI do not have to share a deployment. Copy `dist/mcp-apps/` to an
independent Hono server, also host the static assets (or publish them to the
configured asset CDN), and mount `mcpApps({ configPath })` from
`@modern-js/mcp-apps/hono`. For separately hosted local-view HTML, set `view.html`
to its HTTPS URL. Declare external network origins in `view.csp`.

Development uses the BFF runtime reload for definitions and handlers, and Rspack
for UI sources. Production reads application-compiled code only. Rebuild the app
after changing server code or the UI entry graph.

Add authentication and host/origin policy in Modern.js server middleware before
exposing private tools. Tools are stateless HTTP POST endpoints in this version.

The MCP Apps plugin registers `/mcp` through BFF automatically and uses the
existing server compiler for the definition and imported tools. The adapter
preserves the MCP SDK response and passes the request Hono context to tools.
UI resources are emitted under `dist/mcp-apps/ui/` in production.

Server configuration, tool schemas and business handlers live in `mcp_apps.ts`.
For MCP Apps, `mcpAppsPlugin({ endpoint: '/mcp' })` compiles the definition and
registers the BFF route automatically; no `api/lambda/index.ts` is needed.
Set `endpoint: false` to mount a custom BFF route using `mcpServer(definition)`.
The backend-only `mcp-server` template retains that explicit BFF route and its
`api/mcp_apps.ts` definition.
