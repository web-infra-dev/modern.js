# Modern.js MCP Apps

场景化接入与调试见 [MCP Apps 使用指南](../../docs/guides/mcp-apps-usage.md)，包含独立 Hono、可选 MF 和 ngrok。

A standard Modern.js application with `mcp_apps.ts`, the MCP plugin, and a React
card. The default card is compiled into self-contained HTML; no MF plugin,
manifest or remote component service is required.

```sh
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @modern-js/plugin-mcp-apps build
pnpm --filter @examples/mcp-apps-modern dev
```

Connect an MCP Apps host to `http://localhost:8080/mcp`. A browser GET returns 405.
Edit `mcp/tools.ts` for business logic and `src/components/Greeting.tsx` for
the card. The component receives tool arguments, `viewProps`, and `mcpApp`.

```sh
pnpm --filter @examples/mcp-apps-modern build
pnpm --filter @examples/mcp-apps-modern serve
```

The compiled definition, handlers and card HTML are in `dist/mcp-apps/`. They can
also be hosted by the [Hono adapter](../../packages/toolkit/mcp-apps/README.md#default-local-view-and-hono),
without running the Modern.js web server. `modern deploy` produces `.output/` for
integrated deployment.

For externally hosted HTML, publish the generated view HTML to HTTPS and configure
`view.html` with its URL (for example from an environment variable). The MCP server
fetches that HTML for `resources/read`. Declare any additional network origins in
`view.csp`. With the default self-contained HTML, the iframe needs no UI asset fetch.

## Optional Module Federation

Create an MF-enabled Modern.js application using `--template mcp-apps --mf`.
That template adds the MF plugin, exposes `./Greeting`, and configures the remote
in `mcp_apps.ts`. Set `MCP_UI_ORIGIN` for the UI build and server runtime when
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
