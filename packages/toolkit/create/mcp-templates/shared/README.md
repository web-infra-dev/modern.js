# Modern.js MCP Apps

```sh
pnpm install
pnpm dev
```

The MCP endpoint is `/mcp`. Define tools in `api/mcp_apps.ts` and implement handlers
in `api/mcp-tools.ts`. A normal browser GET to `/mcp` returns 405; connect an MCP
client with POST requests instead. This starter does not include a DevTools host.

```sh
pnpm build
pnpm serve
pnpm deploy
```

`build` uses BFF to compile the definition and handlers into `dist/api/`. `serve` reads
those artifacts. `deploy` produces `.output/`, which can be moved to another
directory and started with `node .output/index.js`.

The default UI template compiles `view.module` (a local React component) into
Modern.js HTML and static JS/CSS assets. It does not need Module Federation or a manifest.
Create with `--template mcp-apps --mf` to opt into MF remote components instead;
only this mode uses `MCP_UI_ORIGIN` and exposes `./Greeting` through MF.

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

The `/mcp` endpoint is owned by `api/lambda/index.ts` and `bff.prefix`.
`mcpAppsPlugin()` registers UI entries and binds resources during BFF
initialization; BFF compiles the statically imported definition and tools; it does not inject
a Web Server endpoint. The BFF adapter preserves the MCP SDK response and passes
the request Hono context to tools. Development artifacts are stored in
the framework internal directory (normally `node_modules/.modern-js/mcp-apps/`); production artifacts are in `dist/mcp-apps/`.

Business logic lives in `api/mcp-tools.ts`, statically imported by
`api/mcp_apps.ts`. The ordinary BFF compiler and watcher own both files. `api/lambda/index.ts` only declares the route:

```ts
import { mcpApps } from '@modern-js/plugin-mcp-apps/bff';
import definition from '../mcp_apps';

export const { POST, GET, DELETE, PUT, PATCH, OPTIONS } = mcpApps(definition);
```

The MCP plugin adds standard auto-mounted Modern.js UI entries and copies their
emitted HTML to `dist/mcp-apps/ui/`. UI compilation, code splitting, CSS, aliases,
preEntry and runtime plugins follow the application build. Existing page layouts
and loaders are not implicitly attached to a component entry. Independent server
deployment must also host the application static assets or use an asset CDN.

## Verify the MCP responses

The starter defines `greet` and `add_numbers`. The UI template binds Greeting and
Sum cards; the server-only template exposes the same tools without UI resources.
With the application running, execute:

```sh
pnpm verify:mcp http://localhost:8080/mcp
```

The script checks initialization, tools/list, both tools/call results and every
UI resources/read response. It prints JSON results and an HTML summary. Expected
results include `Hello, Modern.js!` and `sum: 5` for `{ a: 2, b: 3 }`.
