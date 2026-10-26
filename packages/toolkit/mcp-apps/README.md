# @modern-js/mcp-apps

Build React MCP cards with Modern.js and write servers with the official MCP SDK.
The UI build and the server exchange only `ui-manifest.json`.

- `@modern-js/mcp-apps/server` exports `registerUiResources`, `createFetchHandler` and `createBffHandlers`
- `@modern-js/mcp-apps/react` exports `McpViewProps`, `createMcpView`, `useMcpApp` and official host styling hooks
- `@modern-js/mcp-apps/manifest` exports the versioned manifest types and validation functions
- `@modern-js/mcp-apps/mf` provides the shell runtime compiled with the application's own React dependencies

`registerUiResources()` loads the manifest asynchronously. Its default is `dist/mcp-apps/ui-manifest.json` in production and `node_modules/.modern-js/mcp-apps/ui-manifest.json` in development. Set the `manifest` option to a path or HTTP(S) URL for independent deployments or custom output directories. Relative HTML and shell files resolve against that location.

`await registerUiResources(server, { request })` returns view names mapped to `ui://app/<encoded-name>`. Register tools with the official `registerAppTool` helper and put the chosen URI in `_meta.ui.resourceUri`. MF selection is injected into the resource HTML rather than tool results.

`assetBase` is a public directory URL or `request`. Request mode uses the request origin, honoring a sanitized `x-forwarded-proto`. Override `assetBase` at registration for an external static origin or path prefix. Resources add their required asset, connection and base URI origins to CSP while preserving configured metadata. Additional chunk/CDN origins must be declared explicitly.

`createFetchHandler(createServer)` returns a standard Request/Response handler. It uses the SDK's stateless HTTP serving and rejects foreign browser origins unless configured through `allowedOrigins`. Authentication and authorization belong to the surrounding middleware or server factory. `createServer` must return a fresh official `McpServer` per request. `createBffHandlers` adapts the same factory to Modern BFF's consumed request body and exports POST, GET and DELETE handlers. The stateless SDK rejects unsupported session operations.

Card component props are the latest successful `structuredContent` plus the reserved `mcpApp` field. Input arguments are not merged into props. New input, cancellation and teardown clear previous output. The default wrapper shows loading, cancellation and error states.

See the MCP Apps guide in the Modern.js documentation for configuration and deployment examples.
