# Modern.js MCP Apps

```sh
pnpm install
pnpm dev
```

Define shared tools and handlers in `mcp_tools.ts`, and register them in `mcp_apps.ts` (or `api/mcp_apps.ts` for tool-only projects). The MCP endpoint is `/mcp`. For projects with UI, open the Inspector URL printed at startup to call tools, preview cards and inspect request logs.

```sh
pnpm build
pnpm serve
pnpm deploy
```

`build` produces application and server artifacts in `dist/`. `serve` runs those artifacts. `deploy` creates a portable `.output/` directory, started with `node .output/index.js`.

Local React views produce HTML in `dist/mcp-apps/ui/` and a UI manifest in `dist/mcp-apps/ui-manifest.json`. Deploy the static JS/CSS assets as well, or configure `output.assetPrefix` for a CDN. MF projects use standard MF manifests and exposed components.

The tool-only `mcp-server` template uses an explicit BFF route and an `api/mcp_apps.ts` definition. It does not include React cards.

## Documentation

- [Define tools and views](https://modernjs.dev/en/guides/advanced-features/mcp-apps/configuration)
- [Local debugging](https://modernjs.dev/en/guides/advanced-features/mcp-apps/debugging)
- [Build and deploy](https://modernjs.dev/en/guides/advanced-features/mcp-apps/deployment)
- [User-managed servers](https://modernjs.dev/en/guides/advanced-features/mcp-apps/custom-server)
