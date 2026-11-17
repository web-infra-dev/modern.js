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

Component paths resolve relative to the JSON file. Components must have a default export. MF exposes refer to this application's MF manifest output and must also have a default component export. `{ "remote": "https://host/mf-manifest.json", "expose": "./Name" }` refers to a deployed remote instead. Set `remote` at the top level alongside `csp` to share it across all expose views, for example `{ "remote": "https://host/mf-manifest.json", "views": { "todos": { "expose": "./Todos" }, "stats": { "expose": "./Stats" } } }`. A view-level `remote` overrides this default. Component paths remain local. Without either remote setting, exposes refer to this application. With a top-level `remote`, expose views in the same config cannot refer to this application's exposes, so set `remote` per view to mix both. The URL must point to the remote's manifest, with a path ending in `.json`, and the runtime reads the remote's name from it. The shell loads the remote manifest when the card opens, so republishing the remote needs no MCP server rebuild. Its exposes are not checked at build time, and the application needs no MF plugin. The manifest origin is added to CSP. Declare other origins serving the remote's chunks in `csp`. Local cards are added as application entries and reuse the framework's multi-entry compilation, including its loaders, styles and build plugins. Only the MF shell uses a separate Rsbuild compilation with the application's React dependencies, with its startup scripts and styles inlined. The plugin emits `dist/mcp-apps/ui-manifest.json` and never registers HTTP routes.

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

## Local stdio debugging

For local component views, configure `mcpAppsPlugin({ stdio: { server: './api/server/mcp.ts' } })` and add `"mcp:prepare": "modern mcp-prepare"` to package scripts. The server module must default-export a factory accepting `RegisterUiOptions` and returning a fresh `McpServer`. Inside it, call `registerUiResources(server, options)` and register business tools. The HTTP route can reuse it with `createBffHandlers(request => createServer({ request }))`.

Run `pnpm mcp:prepare`. This creates `dist-mcp/server.cjs`, `dist-mcp/ui-manifest.json` and self-contained UI HTML, then prints the Node command and absolute server argument for a local MCP connector. The host starts the process. No HTTP server, relay, or `modern dev` is required. Only JSON-RPC belongs on server stdout, so application diagnostics must use stderr. Keep application dependencies installed beside the output.

The isolated production pipeline bundles local components with `createMcpView`, preserving exported `mcpCapabilities`, inlining JavaScript, CSS and imported assets. It respects `source.alias`, `source.define` and the application tsconfig. JSX always uses the automatic React runtime, including applications configured with `jsx: preserve`, so components do not need a global React binding. It does not run the application's Rsbuild plugins or its server middleware. Custom loaders and framework page runtime features are outside this mode. Module Federation views with an explicit `remote` manifest URL are supported. Their loader shell is bundled inline, while the remote manifest and chunks are fetched when the card opens. The remote origin is added to resourceDomains and connectDomains. Declare additional CDN origins in CSP. Same-project exposes without a remote URL must be built and hosted first. `mf.runtime` also applies to STDIO shells. Runtime API requests still require explicit endpoints and suitable CSP. Each HTML document must fit within 5 MiB.

`stdio.output` defaults to `dist-mcp`, outside normal `dist` so dev/build cannot remove a running connector's entry. Ignore this directory in Git. Rebuild after editing, then restart the connector to load new server code and HTML. Inline manifests load local HTML at server startup, preserve configured UI metadata and do not inject HTTP base URLs or localhost CSP permissions. The normal HTTP manifest pipeline is unchanged.

## Application views and extension metadata

Use `viewOptions` to configure individual entries while keeping existing string and MF view declarations compatible:

```json
{
  "views": { "card": "./src/Card.tsx", "application": "./src/Application.tsx" },
  "viewOptions": {
    "card": {
      "ui": { "prefersBorder": false },
      "resourceMeta": { "doubao/ui": { "inlineExpansion": "sidebar" } }
    },
    "application": { "bootstrap": "connected" }
  }
}
```

`ui` overrides standard metadata per view, merging CSP domain lists. `resourceMeta` accepts namespaced resource metadata, preserved in resource listings and `resources/read` responses for HTTP, local stdio and MF shells. Standard `ui` cannot be overridden through this field. Tool entry declarations remain owned by the application's MCP tool registration and the host-specific SDK or adapter. Declaring metadata does not grant permissions or guarantee Host support.

The default `tool-result` bootstrap waits for an entry result. `connected` mounts immediately after the official handshake and preserves props during new input notifications. Both modes unmount on teardown. Direct users can pass `{ bootstrap: 'connected' }` as the fourth argument of `createMcpView`. MF shells use the same startup mode.

`useMcpOperation(app, getScopeKey)` returns a request scope. Call `scope.run(async ({ signal, assertCurrent }) => ...)`, passing the signal to the official SDK. Host context changes that alter the caller-provided primitive key abort pending requests. Cleanup also aborts them, and late results are rejected even if a remote ignores cancellation. Scope keys should represent trusted account/session/file identity, rather than ordinary presentation revisions. Use the same key to reset application caches. Cancellation does not roll back remote writes, and uncertain writes are never automatically replayed.

## Reusing component routes

A view may select an existing file-based route directory instead of a component:

```json
{
  "views": {
    "workspace": {
      "routes": "./src/routes",
      "include": ["/releases", "/projects"],
      "home": "/releases",
      "shell": "./src/McpShell.tsx"
    }
  }
}
```

Both HTTP and stdio generate a MemoryRouter importing the same selected page and ancestor layout modules as the Web application. The optional shell receives the normal MCP view props and children inside that Router. The shell may export `mcpCapabilities`. Adding a supported page under a selected prefix requires no second MCP route table. `include` selects canonical route prefixes (for example `/projects/:id`), not filesystem paths or an authorization policy.

This first component-route adapter supports `page` and `layout` modules in JS/JSX/TS/TSX, static directories, `[id]` parameters and `$.tsx` fallbacks. `home` must identify a selected static page. The root fallback is retained. It rejects symlinks, unsupported segment conventions, route loader/action exports and separate loader/data/action/config/error modules. It does not initialize the Web runtime, server loaders, SSR, configured routes, middleware or authentication. Browser-only providers and Web-runtime hooks must be adapted explicitly. `useMcpViewContext()` returns the connected App and entry props inside a generated MCP view, or null in ordinary Web rendering. A shared layout can use this to reuse the shell's provider rather than creating another browser data store.

## Shared business actions

Import `defineAction` and `createActionClient` from `@modern-js/mcp-apps/actions`. Shared contracts contain schemas and tool declarations, never server handlers:

```ts
export const actions = {
  save: defineAction({
    name: 'save_release',
    description: 'Save a release',
    input: SaveInputSchema,
    output: SaveOutputSchema,
    visibility: ['app'],
  }),
}
```

On the server, `registerActions(server, actions, handlers, bindings)` from `/server` registers tools with the contract's input/output schemas, description, read-only annotation and explicit visibility. Optional per-action bindings attach `resourceUri`. `handlers` is checked against the contract's parsed input and output types. It receives the SDK cancellation signal. Throw `ActionError` for expected business failures, which become `isError` tool results. Unexpected failures retain the SDK error path.

On the page, `createActionClient(actions, (params, options) => app.callServerTool(params, options))` generates named typed methods. It validates input and structured output, forwards cancellation, and rejects `isError` results. The same contract drives both paths, so tool names and schema parsing do not need to be repeated in a page adapter. Use JSON-serializable object schemas and install the Zod peer. Wrap the transport with `scope.run` for stale-result protection. The action contract is an interface definition, not an authorization grant: authenticate and check object permissions in server handlers or middleware, including calls made by the model.

### Display mode sizing

`createMcpView` owns a stable root element with `data-mcp-display-mode`. In fullscreen mode it uses the Host's fixed `containerDimensions.height`, falling back to `100dvh`, and scrolls overflowing content internally. In inline mode it enables the SDK content size observer. Mode and theme updates do not remount the view. Observers are removed on mode changes and teardown. Low-level `useMcpApp` callers can explicitly set `autoResize` to override automatic mode selection.

### Typed view configuration

Import `defineMcpViews` from `@modern-js/mcp-apps/cli` and pass the result directly to `mcpAppsPlugin({ views })` in the framework configuration. A view can be a component path, a route definition, an MF expose, or `{ source, ui, resourceMeta, bootstrap }`. The helper colocates presentation options with each source and validates the normalized configuration. Reuse a route object for views with different presentation metadata. Object configuration paths resolve from the application root. Existing JSON paths remain supported and resolve sources from the JSON file's directory. Imported configuration modules use the framework's configuration loading lifecycle.

### Checked view references

`defineMcpViews` retains literal view names in its return type. `registerUiResources(server, { ...options, requiredViews: ['card', 'dashboard'] as const })` returns a URI map restricted to those names and checks that all required views exist before registering resources. This catches a configuration/manifest mismatch at startup. Applications can derive their required name list from the configuration type with a type-only import, keeping CLI code out of the server bundle. Calls without requiredViews retain the existing unrestricted map behavior.
