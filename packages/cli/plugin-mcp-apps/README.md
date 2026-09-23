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

The plugin compiles MCP definitions and handlers and binds artifacts during BFF
initialization. HTTP routing belongs to BFF; add the following API entry and install `@modern-js/plugin-bff` and
`@modern-js/mcp-apps` in dependencies.

```ts
// api/lambda/index.ts
import { mcpApps } from '@modern-js/plugin-mcp-apps/bff';

export const { POST, GET, DELETE, PUT, PATCH, OPTIONS } = mcpApps();
```

For an existing BFF application, keep its prefix and put the route in
`api/lambda/mcp.ts` (for example `/api/mcp`). Do not register BFF twice.
Pass `serverInfo` or `onError` to `mcpApps()`. The integration binds the artifact
using the BFF runtime context; route depth, custom output directories and CJS/ESM
API modules do not require application-level path resolution. Export the returned
functions directly so BFF can recognize them; apply authentication in BFF middleware.
For manually hosted artifacts, the lower-level `@modern-js/mcp-apps/bff` adapter
remains available with explicit root/entry options.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `config` | `mcp_apps.ts` | Trusted definition path, relative to project root |
| `tsconfig` | esbuild's nearest tsconfig | Config/handler compilation settings |
| `alias` | None | Explicit static server import aliases; tsconfig paths also work |

`modern dev` bundles the definition and local handlers into the framework internal MCP directory (normally `node_modules/.modern-js/mcp-apps/`). Config, handler and imported source changes trigger debounced
recompilation. A new module generation is published atomically after successful
compilation; invalid changes log an error and retain the last working generation.
Development uses a development React renderer; production uses a production
renderer, so dev-compiled remote JSX runs against a matching React dispatcher.
The watcher is disposed on CLI exit/restart. Artifact revisions cancel obsolete
requests when a new generation is loaded. BFF owns API runtime reloads.

`modern build` emits `dist/mcp-apps/`, including compiled handler dependencies,
the definition entry, and packaged resource HTML. `modern serve` uses those files,
not source modules. `modern deploy` includes the same artifacts in `.output/`.
Both CJS and ESM application configurations are supported by the package exports;
the generated MCP server modules are ESM on Node 20+.

Configuration is evaluated at runtime so remote URLs can depend on environment
variables. Local handler module references must be unchanged between build and
runtime; changing that set requires rebuilding. The compiler bundles imported
local code/JSON; separately read files, native addons and other runtime assets
still need application deployment handling.

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

The default template uses local `view.module` components, compiled into standalone
HTML in `dist/mcp-apps/`. MF is selected explicitly with `--template mcp-apps --mf`.
The BFF runtime uses `@modern-js/mcp-apps/bff` internally; standalone Hono uses
`@modern-js/mcp-apps/hono`. Both share the artifact loader and SDK transport. UI source changes participate in MCP development recompilation.

The legacy `server-plugin` export remains available for explicit Web Server
integration, but `mcpAppsPlugin()` no longer installs it or registers HTTP routes.

Include `ts-node` (`^10.9.2`) in devDependencies for BFF TypeScript loading and
API module hot reload on Node 20+. For ESM projects, use `"type": "module"` and
TypeScript `module: "esnext"`, `moduleResolution: "bundler"` together.
