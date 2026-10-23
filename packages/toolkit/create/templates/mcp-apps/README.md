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

The tool-only `mcp-server` template uses an explicit BFF route and an `api/mcp_apps.ts` definition. It provides the same four Todo tools, with storage in `api/server/store.ts`, but does not include React cards.

## Documentation

- [Define tools and views](https://modernjs.dev/en/guides/advanced-features/mcp-apps/configuration)
- [Local debugging](https://modernjs.dev/en/guides/advanced-features/mcp-apps/debugging)
- [Build and deploy](https://modernjs.dev/en/guides/advanced-features/mcp-apps/deployment)
- [User-managed servers](https://modernjs.dev/en/guides/advanced-features/mcp-apps/custom-server)


## Try the Todo tools

Open `/mcp/inspector` during development and use Live server mode.

1. Call `add_todo` with `{ "title": "Learn MCP Apps" }`.
2. Call `list_todos` with `{}` to open the Todo card.
3. Use the status menu to switch between active and completed. Edit names, filter the list, delete items or clear completed items.
4. Call `list_todos` again to confirm that conversation and card interactions share server state.

The four tools are `list_todos`, `add_todo`, `update_todo` and `delete_todo`. Only `list_todos` has a view, using `withViewProps()` to pass business data as component props. Edit `src/components/Todos.tsx` for the card and `server/store.ts` for the in-memory store. Data resets on restart or server module reload. Bulk UI operations reuse existing tools and are not transactional.

`update_todo` requires `id` and at least one of `title` or `completed`. For example, `{ "id": "welcome", "completed": true }` marks the initial item as completed. The card refreshes through `list_todos` after mutations.
