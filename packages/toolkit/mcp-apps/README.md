# @modern-js/mcp-apps

Build React MCP cards with Modern.js and write servers with the official MCP SDK.
The UI build and the server exchange only `ui-manifest.json`.

Install `@modelcontextprotocol/server` and `@modelcontextprotocol/ext-apps` in the application. They are required peers so resource registration and HTTP handling use the application's SDK versions. `@modern-js/server-runtime` is an optional peer required only for `createBffHandlers`, and is loaded when a BFF handler is invoked. Standalone Fetch servers do not need it.

- `@modern-js/mcp-apps/server` exports `registerUiResources`, `createFetchHandler` and `createBffHandlers`
- `@modern-js/mcp-apps/react` exports `McpViewProps`, `createMcpView`, `useMcpApp` and official host styling hooks
- `@modern-js/mcp-apps/manifest` exports the versioned manifest types and validation functions
- `@modern-js/mcp-apps/mf` provides the shell runtime compiled with the application's own React dependencies

`registerUiResources()` loads the manifest asynchronously. Its default is `dist/mcp-apps/ui-manifest.json` in production and `node_modules/.modern-js/mcp-apps/ui-manifest.json` in development. Set the `manifest` option to a path or HTTP(S) URL for independent deployments or custom output directories. Relative HTML and shell files resolve against that location. Parsed manifests are cached per source URL and environment. Production keeps successful loads for the process lifetime, so updating a manifest at the same location requires a process restart. Development checks local file metadata on each registration and caches remote manifests for 60 seconds. Concurrent loads share one request and failures are retried. HTML is still read when a resource is requested, and request-specific origins are never cached.

`await registerUiResources(server, { request })` returns view names mapped to `ui://app/<encoded-name>`. Register tools with the official `registerAppTool` helper and put the chosen URI in `_meta.ui.resourceUri`. MF selection is injected into the resource HTML rather than tool results.

`assetBase` is a public directory URL or `request`. Request mode uses the request origin, honoring a sanitized `x-forwarded-proto`. Override `assetBase` at registration for an external static origin or path prefix. Resources add their required asset, connection and base URI origins to CSP while preserving configured metadata. Additional chunk/CDN origins must be declared explicitly.

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
