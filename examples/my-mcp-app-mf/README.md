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
For a public development address, configure `dev.assetPrefix`. In production,
configure `output.assetPrefix` for the deployed assets. MCP reuses the emitted
MF manifest publicPath and adds its origin to the UI CSP.

```sh
pnpm --filter my-mcp-app-mf build
pnpm --filter my-mcp-app-mf serve
```

Local MF remotes are discovered by matching the tool remote name to the emitted
manifest name. Explicit `remotes[].baseUrl` remains available for external apps.
