# Modern.js MCP Apps

```sh
pnpm install
pnpm dev
```

Define simple tools and their UI bindings directly in `mcp_apps.ts` (or `api/mcp_apps.ts` for tool-only projects). The MCP endpoint is `/mcp`. For projects with UI, open the Inspector URL printed at startup to call tools, preview cards and inspect request logs.

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

## Try the two tools

Open `/mcp/inspector` during development and use Live server mode.

- Call `add_numbers` with `{ "a": 2, "b": 3 }`. This ordinary MCP tool returns text and structured data without opening a card.
- Call `greet` with `{ "name": "Ada" }`. This MCP App opens the Greeting card. Edit the name and submit to call the tool again. The card consumes the returned business result directly and displays errors without losing the previous greeting.

Both tools are defined in `mcp_apps.ts`. Only `greet` has a view. It uses `withViewProps()` to explicitly reuse its business result as card props. Edit `src/components/Greeting.tsx` to change the card. The default demo has no task storage or shared mutable server state.

## Module Federation hosting

Configure the complete MF manifest URL in `mcp_apps.ts`. The default is `http://localhost:8080/static/mf-manifest.json`. Set `MCP_UI_MANIFEST_URL` and `MCP_UI_ORIGIN` for a different address and its CSP origin, or edit the remote definition directly.

The MCP plugin does not infer remote URLs or serve MF assets. Publish manifests and chunks with your application static server or CDN and configure CORS there so the host's sandbox can load them. The MF runtime handles manifest and module loading.
