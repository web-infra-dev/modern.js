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

## Native resource metadata

Each component or expose view accepts an optional `resource` declaration:

```json
{
  "views": {
    "sales-overview": {
      "component": "./src/components/SalesOverview.tsx",
      "resource": {
        "uri": "ui://app/sales-overview",
        "mimeType": "text/html;profile=mcp-app",
        "_meta": {
          "ui": {
            "availableDisplayModes": ["inline", "fullscreen"],
            "preferredDisplayMode": "inline",
            "prefersBorder": true,
            "permissions": {},
            "csp": { "connectDomains": ["https://api.example.com"] }
          },
          "vendor/custom": { "enabled": true }
        }
      }
    }
  }
}
```

`resource._meta` is open to host extensions, including unknown fields inside `ui`. The framework preserves these fields in the build manifest, resource registration (`resources/list`), and resource contents (`resources/read`). `resource.mimeType` overrides the SDK default. `resource.uri` overrides the generated `ui://app/<encoded-name>` URI. An existing `tool._meta.ui.resourceUri` remains supported, but conflicting declarations fail. Explicit resource URIs and tool URL sources are mutually exclusive.

Per-view `resource._meta.ui` overrides shared UI defaults. The four known CSP domain arrays are merged and deduplicated with shared configuration and page requirements. Unknown CSP fields are preserved. Explicit `permissions`, including `{}`, replaces shared permissions. Other metadata values replace defaults without interpretation. Resource declaration fields such as `title` and `description` are passed to SDK registration. HTML content is generated by the framework, so `text` and `blob` cannot be configured.

Keep tool metadata in `tool._meta`. Resource metadata is not automatically copied into tools or URL-source metadata. Host extensions such as `preferredDisplayMode` are only declarations: the host decides whether to interpret them. They do not change `mcpCapabilities`, request fullscreen, or alter the SDK handshake. URL delivery continues to return `text/html` and uses the existing host-specific tool declaration.

## Local stdio debugging

Enable `inline: 'dev'` (or `inline: true` for both dev and production) in `mcpAppsPlugin`:

```ts
mcpAppsPlugin({
  views: './mcp-views.json',
  inline: 'dev',
});
```

Run `pnpm dev` to start the development server. Local component views are compiled by an isolated watch build into self-contained inline HTML (up to 5 MiB per view, inlining scripts, styles, and imported assets, without injecting `<base>` or localhost CSP), leaving normal application pages and HMR untouched. If `mcp-views.json` also declares Module Federation views, local views are inlined while MF views use the HTTP shell.

On startup, `modern dev` writes `node_modules/.modern-js/mcp-apps/dev-server.json` and prints a connector snippet that runs the built-in `modern-mcp-stdio` bridge script (`bin/modern-mcp-stdio.js`). The bridge forwards stdio JSON-RPC messages (supporting JSON, SSE streams, `202` notifications, `Mcp-Session-Id`, and repeatable `--header` flags) to the running HTTP dev server (`/api/mcp`), where the application’s middleware and BFF routes handle them. The bridge writes JSON-RPC messages to stdout. Pass `--cwd <app-dir>` instead of a URL to discover the dev server port dynamically.

## URL views

The server plugin also serves compiled cards at `GET /mcp-views/<encoded-view-name>`.
These pages use the same HTML renderer as `resources/read`, including the asset base
and MF shell configuration. `HEAD` returns the same headers without a body.
The route only serves names declared in the UI manifest.

Standalone Fetch services can use `createUiViewHandler({ manifest, assetBase })`.
Call the returned handler with a `Request`. It returns a `Response` for the
`/mcp-views/` route, or `undefined` for other paths so the service can continue routing.
`resolveUiViews({ request, manifest })` returns each view's resolved `ui` metadata
and `render(signal?)` function for host-specific adapters. It also exposes a `url`
property for use in tool metadata. Component and expose views use
`/mcp-views/<encoded-view-name>`. Entry views use their configured `url` path or
absolute HTTP(S) URL. Relative paths resolve against `publicBaseUrl`, when supplied,
or the request origin, honoring a sanitized `x-forwarded-proto`. `publicBaseUrl`
must be an HTTP(S) origin without a path, query or fragment. Static `assetBase`
may point to a CDN and is never used as the application origin. The URL resolves
when read, so resource-only services do not need an application origin. Reading an
entry URL without a configured `url`, or a relative URL without an application
origin, throws an error.

URL loading still requires an MCP Apps host that supports URL sources and establishes
the official App bridge. Opening the page directly does not supply tool results.
The surrounding application controls authentication, embedding response headers and
trusted reverse proxy headers, just as it does for the MCP endpoint.

URL pages carry a `modern-mcp-bootstrap` HTML marker. The local and MF wrappers
render after the host handshake without waiting for a tool result, since a host
may open a URL application without delivering one. Resource cards keep waiting
for a successful tool result. For a separately built page, use
`createMcpView(View, appInfo, capabilities, { bootstrap: 'connected' })` explicitly.
Connected views preserve their latest output during new tool input and unmount
on teardown, including when a late result arrives. Rendering does not replay the
entry tool or automatically fetch application data.

## Tool definitions

Define tools and their metadata directly in the MCP server. View JSON only declares
UI sources and resources. Use the URI returned by `registerUiResources` in the
server tool's `_meta.ui.resourceUri`. Set a custom URI with `resource.uri`.
Resource registration can select manifest views with
`registerUiResources(server, { ...options, viewNames })`.

## Package a Doubao workbench Plugin

Set `mcpServers` to generate a separate `plugin/` package inside the application output directory during production builds. Supply a complete public HTTP(S) endpoint, including the actual MCP route. Deployment environment variables can provide the URL. The framework does not infer MCP endpoints from static asset URLs.

```ts
mcpAppsPlugin({
  views: './mcp-views.json',
  mcpServers: {
    // Workbench tool references use server: 'tasks'
    tasks: {
      type: 'streamable-http',
      url: 'https://app.example.com/api/mcp',
    },
  },
  plugin: {
    // Optional, relative to the application root, defaults to 'plugin'
    directory: './plugin',
    resources: ['com.doubao'],
  },
});
```

Create the user-owned `plugin/plugin.json`:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "tasks-workbench",
  "version": "1.0.0",
  "description": "Task management workbench",
  "author": { "name": "Example developer" },
  "extensions": {
    "com.doubao": {
      "displayName": { "en": "Tasks" },
      "displayDescription": { "en": "View and manage tasks" },
      "icon": "./com.doubao/assets/plugin-icon.png"
    }
  }
}
```

Place the icon at the declared path. To customize navigation, also provide `com.doubao/workbench/manifest.json`. Workbench configuration references registered tools with `{ "server": "tasks", "name": "open_todos" }`. Define tool parameters, metadata, and handlers only in the MCP server. Follow the [Doubao Plugin workbench protocol](https://bytedance.larkoffice.com/docx/NrkgdZ25QoaMbBx0d5Fcy6kOnzm) for workbench declarations and resources.

```text
plugin/                         # User-owned source package
├─ plugin.json
└─ com.doubao/
   ├─ assets/plugin-icon.png
   └─ workbench/                # Optional configuration and resources
      ├─ manifest.json
      ├─ preinstall-resources.json
      ├─ assets/
      └─ web/

dist/plugin/                    # Generated Plugin package root
├─ plugin.json                  # Copied unchanged
├─ mcp.json                     # Generated by the framework
└─ com.doubao/                  # Copied unchanged
```

The generated `dist/plugin/mcp.json` contains:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "tasks": {
      "type": "streamable-http",
      "url": "https://app.example.com/api/mcp"
    }
  }
}
```

The source `plugin.json` is always copied. Set `plugin.resources` to explicitly include additional files or directories relative to the source package, such as `['com.doubao']` for this example or `['assets', 'vendor.example']` for other hosts. The default is `[]`. Declared paths must exist and cannot be absolute, contain empty, `.` or `..` segments, or target the reserved `plugin.json` and `mcp.json` paths. Symbolic links in resource paths or their contents are rejected. A source `mcp.json` is not consumed. Source and output package directories must not overlap, and symbolic links are rejected. Each successful package build replaces `dist/plugin/` to remove stale resources. A custom application output directory also relocates its `plugin/` subdirectory. Without `mcpServers`, no package is generated. Providing `plugin` without `mcpServers` is an error. Development mode does not generate deployment packages.

Deploy the application server and MCP UI assets separately from this declaration and resource package. Packaging does not validate the full Doubao workbench protocol or discover remote tools. It does not generate navigation, compile `web/` pages, or add startup result claims. Author these configurations and pages according to the host protocol and publish them together with the MCP server.

### Existing application entries in URL mode

Use `{ "entry": "main" }` to reference a normal application entry. The name must match an existing entry. `entry`, `component` and `expose` are mutually exclusive.

```json
{
  "views": {
    "home": { "entry": "main", "url": "/" },
    "todos": { "component": "./Todos.tsx" }
  }
}
```

The selected entry keeps its normal HTML, React root and application routes. Its browser bundle connects to an MCP host when embedded. Top-level browser visits render normally. Declare the application's route once in the view's `url` field, then reference `views.home.url` in the tool metadata. Entry names do not determine URL paths. Entry views are excluded from MCP resource registration and return 404 under `/mcp-views/`. Component views keep that route.

```ts
const views = await resolveUiViews({ request });
server.registerTool(
  'open_home',
  {
    title: 'Home',
    inputSchema: {},
    _meta: {
      'doubao/ui': {
        url: views.home.url,
        entrypoints: [{ type: 'global' }],
        csp: views.home.ui.csp,
        permissions: views.home.ui.permissions,
      },
    },
  },
  async () => ({ content: [] }),
);
```

Verify that `tools/list` contains the complete application URL and that opening the
tool in the host displays the expected application route.

The bootstrap emits `mcp-app-connected` (detail: App), `mcp-app-tool-result` (detail: tool result), and `mcp-app-error` browser events. Register listeners before connection completes when consuming these events. CSP and browser permissions remain declarations for the host, and belong in the URL tool's `doubao/ui` metadata.

Existing entry pages can import `useEntryMcpApp` from `@modern-js/mcp-apps/react`. It returns `status`, `app`, `result`, `resultCount`, and any connection `error`. It reuses the injected App connection and retains the latest entry tool result before React mounts or after application route changes. Use `app.callServerTool` only when `status` is `connected`. Normal top-level browser visits report `standalone` and do not create a Host connection.

Entry connection browser events are notifications for non-React consumers, not state snapshots. The bootstrap emits `mcp-app-teardown` when the host closes the view. Late results and connection callbacks are ignored after teardown. React consumers should use `useEntryMcpApp` to read the retained snapshot and subscribe to changes. Its initial status is `standalone` until the bootstrap starts connecting. Embedding in an iframe triggers a handshake attempt and does not by itself establish that the parent is an MCP host.

For applications also embedded in ordinary iframes, set `mcpAppsPlugin({ entryAutoConnect: false })` to disable the injected handshake. Call `connectEntryMcpApp()` from `@modern-js/mcp-apps/react` only when your application integration explicitly selects MCP mode. Repeated calls reuse the active connection. Top-level and server-side calls do nothing. A failed connection releases the App instance so an explicit call can retry. Host identity is established by the SDK handshake, not by iframe detection.
