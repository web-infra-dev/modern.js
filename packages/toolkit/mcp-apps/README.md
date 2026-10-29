# @modern-js/mcp-apps

Build React MCP cards with Modern.js and write servers with the official MCP SDK.
The UI build and the server exchange only `ui-manifest.json`.

Install `react`, `react-dom`, `@modelcontextprotocol/server` and `@modelcontextprotocol/ext-apps` in the application. They are required peers so cards use the application's React and resource registration and HTTP handling use the application's SDK versions. `@modern-js/server-runtime` is an optional peer that provides the default `useContext` for `createBffHandlers`, loaded when a BFF handler is invoked. Standalone Fetch servers do not need it. `@module-federation/enhanced` is an optional peer that provides the default MF shell runtime.

- `@modern-js/mcp-apps/cli` exports the `mcpAppsPlugin` build plugin
- `@modern-js/mcp-apps/server-plugin` is the server plugin, loaded by name by the framework
- `@modern-js/mcp-apps/server` exports `registerUiResources`, `createFetchHandler` and `createBffHandlers`
- `@modern-js/mcp-apps/react` exports `McpViewProps`, `createMcpView`, `useMcpApp` and official host styling hooks

## Build plugin

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

Component paths resolve relative to the JSON file. Components must have a default export. MF exposes refer to this application's MF manifest output and must also have a default component export. Local cards are added as application entries and reuse the framework's multi-entry compilation, including its loaders, styles and build plugins. Only the MF shell uses a separate Rsbuild compilation with the application's React dependencies, with its startup scripts and styles inlined. The plugin emits `dist/mcp-apps/ui-manifest.json` and never registers HTTP routes.

- `mf.manifestFile` is the MF manifest filename in the web build output. It defaults to `mf-manifest.json` and must match exactly one emitted file.
- `mf.runtime` is the module, resolved from the application, that the MF shell imports `createInstance` from. It defaults to `@module-federation/enhanced/runtime`.
- `csp` adds CSP domains to every view, merged with the `csp` in `mcp-views.json`. Use it for domains computed in the framework or application config.

The build also adds the origin of an absolute or protocol-relative asset prefix (`//cdn.example/app/` becomes `https://cdn.example`) to every view's `resourceDomains` and `connectDomains`, because card scripts and chunks load from it. A protocol-relative prefix keeps `assetBase` request-relative, so the UI manifest and MF manifest still load from the server.

Local card entries mount React directly through `createMcpView` without the framework page runtime, because an opaque MCP Apps sandbox cannot read page cookies. With `source.enableAsyncEntry`, which the MF plugin enables, each entry adds a dynamic import boundary for MF shared initialization.

`createBffHandlers(createServer, { useContext })` accepts the function returning the current Hono context. It defaults to `useHonoContext` from `@modern-js/server-runtime`. Frameworks wrapping Modern.js pass their own implementation.

`registerUiResources()` loads the manifest asynchronously. The Modern.js server plugin provides the manifest path and runtime mode through the request created by `createBffHandlers`. Call `registerUiResources(server, { request })` to resolve them automatically. Explicit options override injected configuration. Standalone services must set `manifest` to a path or HTTP(S) URL and may set `mode` to `development` for live updates. The default mode is `production`. Relative HTML and shell files resolve against that location. Parsed manifests are cached per source URL and environment. Production keeps successful loads for the process lifetime, so updating a manifest at the same location requires a process restart. Development checks local file metadata on each registration and caches remote manifests for 60 seconds. Concurrent loads share one request and failures are retried. HTML is still read when a resource is requested, and request-specific origins are never cached.

`await registerUiResources(server, { request })` returns view names mapped to `ui://app/<encoded-name>`. Register tools with the official `registerAppTool` helper and put the chosen URI in `_meta.ui.resourceUri`. MF selection is injected into the resource HTML rather than tool results.

`assetBase` is a public directory URL or `request`. Request mode uses the request origin, honoring a sanitized `x-forwarded-proto`. Override `assetBase` at registration for an external static origin or path prefix. Resources add their required asset, connection and base URI origins to CSP while preserving configured metadata. Other chunk/CDN origins must be declared in `csp` or `mcp-views.json`.

`createFetchHandler(createServer)` returns a standard Request/Response handler. It uses the SDK's stateless HTTP serving and rejects foreign browser origins unless configured through `allowedOrigins`. Authentication and authorization belong to the surrounding middleware or server factory. `createServer` must return a fresh official `McpServer` per request. `createBffHandlers` adapts the same factory to Modern BFF's consumed request body and exports POST, GET and DELETE handlers. The stateless SDK rejects unsupported session operations.

Card component props are the latest successful `structuredContent` plus the reserved `mcpApp` field. Input arguments are not merged into props. New input, cancellation and teardown clear previous output. The default wrapper shows loading, cancellation and error states.

See the MCP Apps guide in the Modern.js documentation for configuration and deployment examples.

Cards advertise `inline` and `fullscreen` display modes by default. A local component module or MF expose can export `mcpCapabilities` to override display modes or declare additional SDK capabilities:

<!-- prettier-ignore -->
```tsx
import type { McpCapabilities } from '@modern-js/mcp-apps/react'

export const mcpCapabilities = {
  availableDisplayModes: ['inline'],
} satisfies McpCapabilities

export default function Card() {
  return <div>My card</div>
}
```

`createMcpView(View, appInfo, capabilities)` accepts the same options directly. Properties are merged with the defaults, and an explicit `availableDisplayModes` array replaces the default array. MF modules are loaded before the handshake so their capabilities are included in initialization. Declaring fullscreen support does not add a fullscreen control or change the display mode automatically.

Development resource CSP includes the request origin's `ws:` or `wss:` equivalent for the application HMR connection. Custom HMR hosts still need explicit `connectDomains` configuration. Production resources do not add this permission automatically.
