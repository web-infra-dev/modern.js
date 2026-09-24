# Modern.js MCP Apps plugin (experimental)

场景化接入与调试见 [MCP Apps 使用指南](../../../docs/guides/mcp-apps-usage.md)，包含独立 Hono、可选 MF 和 ngrok。

```ts
import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { mcpAppsPlugin } from '@modern-js/plugin-mcp-apps';

export default defineConfig({
  bff: { prefix: '/mcp' },
  plugins: [appTools(), bffPlugin(), mcpAppsPlugin()],
});
```

The BFF route statically imports the definition and its handlers. BFF owns their
TypeScript compilation, module format, dependency tracing and hot reload. This
plugin registers UI entries and binds UI resources during BFF initialization.

```ts
// api/lambda/index.ts
import { mcpApps } from '@modern-js/plugin-mcp-apps/bff';
import definition from '../mcp_apps';

export const { POST, GET, DELETE, PUT, PATCH, OPTIONS } = mcpApps(definition);
```

For an existing BFF application, keep its prefix and put the route in
`api/lambda/mcp.ts` (for example `/api/mcp`). Do not register BFF twice.
Pass `serverInfo` or `onError` as the second argument of `mcpApps(definition, options)`. The integration binds the artifact
using the BFF runtime context; custom output directories and CJS/ESM
API modules do not require application-level path resolution. Export the returned
functions directly so BFF can recognize them; apply authentication in BFF middleware.
For manually hosted artifacts, the lower-level `@modern-js/mcp-apps/bff` adapter
accepts a loaded definition directly.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `config` | `api/mcp_apps.ts` | Trusted definition path, relative to project root |

`api/mcp_apps.ts` imports handlers such as `greet` from `./mcp-tools` and assigns
`handler: greet`. The route imports that definition and calls `mcpApps(definition)`.
`modern dev` uses the ordinary BFF module watcher; `modern build` emits
`dist/api/mcp_apps.js`, `dist/api/mcp-tools.js` and `dist/api/lambda/index.js`.
No MCP-specific compiler, handler path mapping or generated configuration wrapper
is used. Aliases and TS settings belong to the normal Modern.js / BFF configuration.

UI HTML is emitted by the application builder and copied to `dist/mcp-apps/ui/`.
JS/CSS remain ordinary application assets. `modern deploy` packages both the BFF
output and the UI resources. Keep configuration modules free of startup-only
side effects because build-time UI discovery reads the definition as well.

## UI and server separation

UI continues to use existing MF/Vmok exposes and manifests. The integrated endpoint uses BFF and does not require a UI entry or React rendering. The `mcp-server`
template uses an `api/` directory with no `src/` to select Modern.js API-only mode.
For UI integration, use the `mcp-apps` template or an existing federation setup.

The underlying core is also usable without app-tools: see
`examples/mcp-apps-modern` and the [Hono adapter documentation](../../toolkit/mcp-apps/README.md#default-local-view-and-hono). For a local integrated app,
run `pnpm --filter @examples/mcp-apps-modern dev` in this repository after building
the core and this plugin.

## HTTP behavior

The MCP endpoint is a BFF API route. Register authentication/origin policy before
BFF dispatch. The adapter rebuilds the HTTP request from the already parsed BFF
input and returns the SDK Response directly, including notification status 202.
Handler `context.context` is the request's Hono Context, allowing access to
middleware-provided identity; contexts are isolated between concurrent requests.
The transport remains stateless and POST-only; GET/DELETE return 405.

No server plugin `onClose` hook is assumed. Per-request transports are released
by the core, request disconnects abort handlers, and compiler watchers belong to
the CLI lifecycle. Custom `server/modern.server.ts` middleware and ordinary pages
remain independent of MCP registration.

## Tests

```sh
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @modern-js/plugin-mcp-apps build
pnpm --filter @modern-js/plugin-mcp-apps test
pnpm --filter tests test:framework integration/mcp-apps/tests/index.test.ts --retry=0
```

## Local views and Hono

The default template registers local `view.module` components as normal Modern.js
auto-mounted entries. It inherits the application builder, runtime config, aliases,
CSS processing, preEntry and environment definitions. Emitted HTML is copied to
`dist/mcp-apps/ui/`; JS/CSS and chunks keep their standard application output paths. MF is selected explicitly with `--template mcp-apps --mf`.
The BFF runtime uses `@modern-js/mcp-apps/bff` internally; standalone Hono uses
`@modern-js/mcp-apps/hono`. Both share the artifact loader and SDK transport. UI source changes participate in MCP development recompilation.

The legacy `server-plugin` export remains available for explicit Web Server
integration, but `mcpAppsPlugin()` no longer installs it or registers HTTP routes.

Include `ts-node` (`^10.9.2`) in devDependencies for BFF TypeScript loading and
API module hot reload on Node 20+. For ESM projects, use `"type": "module"` and
TypeScript `module: "esnext"`, `moduleResolution: "bundler"` together.

Local UI source changes use Rspack. Server definitions and handlers use BFF hot
reload. Restart the development process when adding/removing UI entries or
changing their module paths so the application entry graph is regenerated. Existing filesystem route layouts
and loaders are not implicitly attached to a component entry.

MCP resource responses set an asset base and include its origin in resource CSP.
The default is the public request origin (including forwarded HTTPS); use the
application dev/output assetPrefix for a separate asset host. Deploy static assets
with the server or to that host. The Node deploy output includes both.
