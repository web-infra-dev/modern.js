# MCP Apps core (experimental)

场景化接入与调试见 [MCP Apps 使用指南](../../../docs/guides/mcp-apps-usage.md)，包含独立 Hono、可选 MF 和 ngrok。

Build and deploy MCP servers and remote React views independently using
`mcp_apps.ts`. The package provides configuration and handler loading,
result/view binding, local React HTML compilation, a Hono adapter, and optional MF/Vmok rendering.

## Default local view and Hono

A standard Modern.js app can declare a local card without MF:

```ts
export default defineMcpApps({
  remotes: [],
  tools: [{ name: 'greet', handler: { module: './tools', exportName: 'greet' },
    view: { module: './src/components/Greeting.tsx' } }],
});
```

Compile it with `compileMcpApps({ configPath, outDir })` from the `/build` entry,
then mount the generated definition in any Hono application:

```ts
import { Hono } from 'hono';
import { mcpApps } from '@modern-js/mcp-apps/hono';
const app = new Hono();
app.all('/mcp', mcpApps({ configPath: './dist/mcp-apps/mcp_apps.mjs' }));
```

For a standalone Node server, install `hono`, `@hono/node-server` and this package,
copy the application's entire `dist/mcp-apps/` directory (plus external handler
dependencies), then add a listener to the code above:

```ts
import { serve } from '@hono/node-server';
serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 8090 });
```

Independent deployment is tested by `scripts/deployment-smoke.mjs` using a minimal
Hono fixture, with no separate example project required.

The adapter does not start a listener. Install authentication middleware first.
Handlers receive the Hono context as `context.context`. Integrated Modern.js
applications use `mcpApps()` from `@modern-js/plugin-mcp-apps/bff` in
`api/lambda/index.ts`; the BFF and Hono adapters share the artifact loader and SDK
transport. Copy the entire compiled artifact directory when
moving to a standalone server. Local cards register `ui://local/<tool>` resources
and bundle React, JS and CSS into their HTML, without MF or external scripts.
Local views currently support React components (not `renderMode: 'mount'`).

Local `view.html` may point to independently hosted HTTPS HTML; the server fetches
it for resource reads. `view.csp` declares any network origins used by that HTML.
Local JSX/TSX and CSS are bundled by esbuild; Modern.js-specific CSS preprocessors
or runtime features are not automatically inherited. Use MF for views requiring
the application's full MF build pipeline.

## Optional MF app definition

```ts
// mcp_apps.ts — server-owned app definition
import { defineMcpApps } from '@modern-js/mcp-apps/config';

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
    handler: { module: './tools', exportName: 'greet', runtime: 'local' },
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
  configPath: './mcp_apps.ts', // use compiled ./mcp_apps.mjs in production
  serverInfo: { name: 'greeting', version: '1.0.0' },
});
// app.all('/mcp', c => handleMcp(c.req.raw)); // Hono or any Web Request adapter
```

`createMcpAppsHandler` loads the trusted local definition lazily and retries failed
initialization. Config loading supports TS/TSX, JS/MJS/CJS, JSON, extensionless paths,
and default/config/mcpApps exports. Relative handler modules resolve from
the definition directory. TypeScript is compiled to ESM with esbuild; compiled
JS is imported directly. No request-supplied config URLs are accepted.

`createMcpHandler(definition, options)` is the lower-level synchronous registration
entry when the application already loaded its definition. `materializeMcpAppsConfig`
exports a serialized definition; it does not compile/copy referenced handlers.

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
- Resources contain the packaged, self-contained browser renderer. The renderer
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

`@modern-js/mcp-apps/build` exports `compileMcpApps({ configPath, outDir,
tsconfig?, alias?, development? })`. It bundles local code dependencies, keeps
runtime environment evaluation in the definition, and publishes a relocatable
`mcp_apps.mjs` only after all handler artifacts are ready. It also copies the
matching development/production renderer. Local handler references must remain
stable between build and runtime. Files read dynamically are application assets
and need separate deployment handling.

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
