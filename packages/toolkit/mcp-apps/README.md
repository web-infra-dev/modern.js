# MCP Apps core (experimental)

场景化接入与调试见 [MCP Apps 使用指南](../../../docs/guides/mcp-apps-usage.md)，包含独立 Hono、可选 MF 和 ngrok。

Build and deploy MCP servers and remote React views independently using
`api/mcp_apps.ts`. The package provides configuration and handler loading,
result/view binding, application-built HTML resources, a Hono adapter, and optional MF/Vmok rendering.

## Default local view and Hono

A standard Modern.js app can declare a local card without MF:

```ts
export default defineMcpApps({
  remotes: [],
  tools: [{ name: 'greet', handler: greet,
    view: { module: './src/components/Greeting.tsx' } }],
});
```

Run `modern build` with `mcpAppsPlugin()`. Local views become standard auto-mounted
Modern.js entries. The application builder emits their HTML, JS, CSS and assets;
the plugin copies the HTML into `dist/mcp-apps/ui/`. Mount the compiled definition
in a Hono application if deploying the server independently:

```ts
import { Hono } from 'hono';
import { mcpApps } from '@modern-js/mcp-apps/hono';
const app = new Hono();
// definition is imported from the application's compiled module.
app.all('/mcp', mcpApps({ definition }));
```

For a standalone Node server, install `hono`, `@hono/node-server` and this package,
copy the application's `dist/api/` and `dist/mcp-apps/ui/` directories (plus external handler
dependencies), and serve the application static assets at their built URLs or
publish them to the configured asset CDN. Then add a listener to the code above:

```ts
import { serve } from '@hono/node-server';
serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 8090 });
```

Independent deployment is tested by `scripts/deployment-smoke.mjs` using a minimal
Hono fixture, with no separate example project required.

The adapter does not start a listener. Install authentication middleware first.
Handlers receive the Hono context as `context.context`. Integrated Modern.js
applications use `mcpApps(definition)` from `@modern-js/plugin-mcp-apps/bff` in
`api/lambda/index.ts`; the BFF and Hono adapters share the artifact loader and SDK
transport. Copy the entire compiled artifact directory when
moving to a standalone server. Local cards register `ui://local/<tool>` resources
whose HTML references the normal Modern.js JS/CSS/chunk assets. Deploy those
assets too; copying only the MCP directory is insufficient for a working UI.
Local views currently support React components (not `renderMode: 'mount'`).

Local `view.html` may point to independently hosted HTTPS HTML; the server fetches
it for resource reads. `view.csp` declares any network origins used by that HTML.
Local views use the application builder and Modern.js runtime, including configured
aliases, CSS processing, preEntry, globalVars and runtime plugins. Existing page
layouts/loaders are not automatically attached to a component entry.

The core does not compile application code. Pass a statically imported definition
to `createMcpHandler()` or the Hono adapter. Alternatively, `loadMcpAppsConfig()`
loads an application-compiled JS module. `bindUiResources()` attaches emitted HTML
paths while retaining the original tool functions; it does not generate source code.

## Optional MF app definition

```ts
// api/mcp_apps.ts — server-owned app definition
import { defineMcpApps } from '@modern-js/mcp-apps/config';
import { greet } from './mcp-tools';

export default defineMcpApps({
  remotes: [{
    name: 'mcp_ui',
    baseUrl: 'https://cdn.example.com/releases/1/mf-manifest.json',
    manifestType: 'mf',
    csp: {
      resourceDomains: ['https://cdn.example.com'],
      connectDomains: ['https://cdn.example.com'],
    },
  }],
  tools: [{
    name: 'greet',
    remote: 'mcp_ui',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
    annotations: { readOnlyHint: true },
    handler: greet,
    view: { module: './Greeting', runtime: 'browser' },
  }],
});
```

```ts
// tools.ts — deployed with the server, never bundled into the UI
import type { RemoteToolHandler } from '@modern-js/mcp-apps/config';

export const greet: RemoteToolHandler = input => {
  const { name } = input as { name: string };
  const message = `Hello, ${name}!`;
  return {
    content: [{ type: 'text', text: message }],
    structuredContent: { message },
    viewProps: { message },
  };
};
```

```ts
import { createMcpAppsHandler } from '@modern-js/mcp-apps/server';

const handleMcp = createMcpAppsHandler({
  configPath: './dist/api/mcp_apps.js', // application-compiled configuration
  serverInfo: { name: 'greeting', version: '1.0.0' },
});
// app.all('/mcp', c => handleMcp(c.req.raw)); // Hono or any Web Request adapter
```

`createMcpAppsHandler` loads the trusted local definition lazily and retries failed
initialization. Config loading supports TS/TSX, JS/MJS/CJS, JSON, extensionless paths,
and default/config/mcpApps exports. Relative handler modules resolve from
the definition directory. Modules are imported directly; any TypeScript support must be supplied by the
host runtime. Production should use application-compiled JavaScript. No request-supplied config URLs are accepted.

`createMcpHandler(definition, options)` is the lower-level synchronous registration
entry when the application already loaded its definition. Use direct handler
functions (`handler: greet`) with ordinary imports to let the application compiler
track dependencies. No generated wrapper or handler path map is required.

## Publish the remote UI

Expose `./Greeting` with the existing MF or Vmok build tooling. Standard MF emits
`mf-manifest.json`, remote entry and chunks; Vmok emits its own manifest. Publish
those artifacts normally, then set `remotes[].baseUrl`/`browserEntry` to their URL.
There is no second UI manifest to generate, copy, or maintain.

```tsx
import type { App } from '@modern-js/mcp-apps/react';

export default function Greeting({ message, mcpApp }: {
  message?: string;
  mcpApp?: App;
}) {
  return <button onClick={() => mcpApp?.callServerTool({
    name: 'greet', arguments: { name: 'Ada' },
  })}>{message}</button>;
}
```

The renderer owns the host connection and passes `mcpApp` to the remote.
It also passes the original tool arguments merged with `viewProps`. Do not start
another `useApp`/`useMcpApp` connection inside that remote. Store explicit
`callServerTool` results in component state if the view needs to update itself.
The optional React hooks entry remains available for independently authored apps
that own their host connection.

`view.renderMode` accepts `component` (default) or `mount`, and `exportName` defaults
to `default`. Legacy top-level `module/exportName/renderMode` are normalized into
the explicit view definition. Handler-only tools can omit `remote` and use
`remotes: []`; view-only tools can omit `handler`. Explicit `annotations` are
preserved, never forced read-only.

## Compatibility and deployment

- The server registers `ui://mf/<remote-slug>/<tool-slug>` resources
  plus remote-level aliases. URI collisions fail at startup.
- MF resources contain the packaged, self-contained browser renderer. The renderer
  reads `structuredContent.resource.moduleFederation` and loads the remote UI.
- Handler results use the `tool/resource/args/viewProps` envelope, business
  `structuredContent`, `content` and `_meta`. Render information is included in
  structuredContent.
- `outputSchema`, when supplied, validates business structuredContent before the
  view envelope is attached. It is advertised in tools/list for handler-only tools;
  view tools omit the advertised outputSchema to avoid contradicting that envelope.
- Browser `manifestType` defaults to `vmok`. New standard MF
  projects should explicitly set `manifestType: 'mf'`.
- Browser MF and Vmok loaders support snapshot/static publicPath normalization.
  Vmok region placeholder handling targets `region.cn`.
  Standard MF is tested end-to-end; internal Vmok deployment still needs validation.
- `handler.runtime: 'vmok-server'` uses an optional runtime loader and
  requires `serverEntry`. Install the compatible `@vmok/kit` where the core can
  resolve it, or inject `loadRemoteHandler`; internal packages are not dependencies.
- Pin remote URLs to immutable releases. Remote assets must support cross-origin
  loading, and their script/CSS/fetch origins must be declared in remote CSP.
- Production deploys contain the compiled definition and handler modules. No UI
  source or copied UI manifest is needed. The Node process does not import React;
  React is bundled into resource HTML for execution only inside the host iframe.
- Node 20+; pinned MCP SDK 1.30.0 / Apps SDK 1.7.5. Stateless POST-only HTTP with a
  new SDK server/transport per request. No persistent sessions, resumable SSE,
  server-initiated requests or cross-request cancellation routing in this version.
- Input/output schemas use strict JSON Schema 2020-12 validation, not lossy Zod
  conversion. Unsupported keywords fail at startup. Inputs are not type-inferred.
- Handler context provides `toolName/remote/handler/extra/signal/fetch/
  fetchJson/serverUrl` fields and adds `request/context`. `createContext(request)`
  supplies request-local context. Host visibility is not an authorization boundary.
- Authentication, request-size limits and Host/Origin policy belong in HTTP
  middleware. Errors from createContext propagate to that middleware. Tool failures
  are generic to clients; use `onError` for server diagnostics. Handlers must honor
  AbortSignal to stop external work; timeout cannot roll back side effects.

Modern.js CLI integration is provided by `@modern-js/plugin-mcp-apps`; see its
[README](../../cli/plugin-mcp-apps/README.md). The creator includes `mcp-apps`
and `mcp-server` templates. See `NOTICE.md` and `THIRD-PARTY-LICENSE` for
third-party license information.

Application compilation is owned by Modern.js/BFF (or your own compiler outside
Modern.js). The old `/build` entry and `compileMcpApps` API have been removed.

## Verify locally

```sh
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @examples/mcp-apps-modern build
pnpm --filter @modern-js/mcp-apps test
pnpm --filter @modern-js/mcp-apps test:deployment
```

The deployment test packs this package and installs it in a temporary directory,
then runs the compiled definition/handlers with no UI source, React installation,
or app-tools dependency. npm network access is needed for that isolated install.

For browser verification, start the Modern.js example and run
`node packages/toolkit/mcp-apps/scripts/browser-fixture.mjs` from the repository root.
It defaults to the integrated example at `http://127.0.0.1:8080/mcp`. For your own
standalone server, set `MCP_ENDPOINT` to its endpoint.
Open `http://127.0.0.1:8092` and click `Greet again`. The official AppBridge fixture
is test-only and excluded from the npm package; it does not replace target-host
compatibility testing.
