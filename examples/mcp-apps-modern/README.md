# Modern.js MCP Apps

场景化接入与调试见 [MCP Apps 使用指南](../../docs/guides/mcp-apps-usage.md)，包含独立 Hono、可选 MF 和 ngrok。

A standard Modern.js application with `api/mcp_apps.ts`, the MCP plugin, and a React
card. The default card uses a standard Modern.js entry and application assets; no MF plugin,
manifest or remote component service is required.

```sh
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @modern-js/plugin-mcp-apps build
pnpm --filter @examples/mcp-apps-modern dev
```

Connect an MCP Apps host to `http://localhost:8080/mcp`. A browser GET returns 405.
Edit `api/mcp-tools.ts` for business logic and `src/components/Greeting.tsx` for
the card. The component receives tool arguments, `viewProps`, and `mcpApp`.

```sh
pnpm --filter @examples/mcp-apps-modern build
pnpm --filter @examples/mcp-apps-modern serve
```

The compiled definition and handlers are in `dist/api/`; UI HTML is in `dist/mcp-apps/ui/`. They can
also be hosted by the [Hono adapter](../../packages/toolkit/mcp-apps/README.md#default-local-view-and-hono),
without running the Modern.js web server. `modern deploy` produces `.output/` for
integrated deployment.

For externally hosted HTML, publish the generated view HTML to HTTPS and configure
`view.html` with its URL (for example from an environment variable). The MCP server
fetches that HTML for `resources/read`. Declare any additional network origins in
`view.csp`. Deploy the referenced JS/CSS/chunk assets too; the iframe fetches them
from the public MCP origin or the configured application assetPrefix.

## Optional Module Federation

Create an MF-enabled Modern.js application using `--template mcp-apps --mf`.
That template adds the MF plugin, exposes `./Greeting`, and configures the remote
in `api/mcp_apps.ts`. Set `MCP_UI_ORIGIN` for the UI build and server runtime when
publishing its static files separately. MF is optional, not a separate UI framework.

## Host verification

```sh
node packages/toolkit/mcp-apps/scripts/browser-fixture.mjs
```

Open `http://127.0.0.1:8092`, verify `Hello, Ada!`, and click `Greet again` to see
`Hello, Modern.js!`. This fixture is test-only; also validate in the target agent.

For HTTPS testing, keep `ngrok http 8080` running and use
`pnpm --filter @examples/mcp-apps-modern preview:ngrok` when port 8080 is free.
The helper builds and serves the app. Default local cards do not fetch manifests
from the tunnel; MF mode still needs an asset host without browser interstitials.

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
