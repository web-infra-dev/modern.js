# Modern.js MCP Apps with Module Federation

From the repository root:

```sh
pnpm --filter my-mcp-app-mf dev
```

The MCP endpoint is `http://localhost:8080/mcp`. The plugin reads root
`mcp_apps.ts` and registers the endpoint automatically. Connect an MCP client
using POST; browser GET requests return 405.

`module-federation.config.ts` exposes `./Greeting` and `./Sum`.
`mcp_apps.ts` maps tools to these remote components through
`http://localhost:8080/static/mf-manifest.json`.

Use another port with `PORT=8083 pnpm --filter my-mcp-app-mf dev`.
When accessing the app through a public domain, set `MCP_UI_ORIGIN` to that
origin so the manifest, assets and CSP use the client-accessible address.

```sh
pnpm --filter my-mcp-app-mf build
pnpm --filter my-mcp-app-mf serve
```

Set the same `MCP_UI_ORIGIN` when building and serving production assets.
