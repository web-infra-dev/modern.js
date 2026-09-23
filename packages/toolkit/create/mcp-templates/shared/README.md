# Modern.js MCP Apps

```sh
pnpm install
pnpm dev
```

The MCP endpoint is `/mcp`. Define tools in `mcp_apps.ts` and implement handlers
in `mcp/tools.ts`. A normal browser GET to `/mcp` returns 405; connect an MCP
client with POST requests instead. This starter does not include a DevTools host.

```sh
pnpm build
pnpm serve
pnpm deploy
```

`build` compiles the definition and handlers into `dist/mcp-apps/`. `serve` reads
those artifacts. `deploy` produces `.output/`, which can be moved to another
directory and started with `node .output/index.js`.

The default UI template compiles `view.module` (a local React component) into
self-contained MCP HTML. It does not need Module Federation or a manifest.
Create with `--template mcp-apps --mf` to opt into MF remote components instead;
only this mode uses `MCP_UI_ORIGIN` and exposes `./Greeting` through MF.

Server and UI do not have to share a deployment. Copy `dist/mcp-apps/` to an
independent Hono server and mount `mcpApps({ configPath })` from
`@modern-js/mcp-apps/hono`. For separately hosted local-view HTML, set `view.html`
to its HTTPS URL. Declare external network origins in `view.csp`.

Development recompiles config/handler dependencies and keeps the last successful
build when a change is invalid. Production reads compiled code only. Environment
variables used for remote URLs are evaluated at runtime; local handler module
references must remain the same between build and runtime.

Add authentication and host/origin policy in Modern.js server middleware before
exposing private tools. Tools are stateless HTTP POST endpoints in this version.

The `/mcp` endpoint is owned by `api/lambda/index.ts` and `bff.prefix`.
`mcpAppsPlugin()` compiles definitions, tools and views and binds them during BFF
initialization; it does not inject
a Web Server endpoint. The BFF adapter preserves the MCP SDK response and passes
the request Hono context to tools. Development artifacts are stored in
the framework internal directory (normally `node_modules/.modern-js/mcp-apps/`); production artifacts are in `dist/mcp-apps/`.

MCP-only business logic lives in `mcp/tools.ts`, outside the BFF compiler
input directories. `api/lambda/index.ts` only declares the route:

```ts
import { mcpApps } from '@modern-js/plugin-mcp-apps/bff';

export const { POST, GET, DELETE, PUT, PATCH, OPTIONS } = mcpApps();
```
