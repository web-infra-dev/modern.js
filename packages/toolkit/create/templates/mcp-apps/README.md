# Modern.js MCP Apps

Run `pnpm install`, then `pnpm dev`. The MCP endpoint is `/api/mcp`.

The server is an ordinary BFF route in `api/lambda/mcp.ts` using the official MCP SDK.

Declare cards in `mcp-views.json`. Connect an MCP Apps compatible host to `/api/mcp` to call tools and display cards.

Run `pnpm build` and `pnpm serve` for production. Deploy `dist/mcp-apps` together with the generated static assets.
The UI build never loads the server route or business store. Card props come from `structuredContent`.

For a local stdio connector, run `pnpm mcp:prepare` and copy the printed command and args into the host. This builds self-contained cards and `dist-mcp/server.cjs`. The host starts the process, so no HTTP server is needed. Restart the connector after rebuilding. `api/server/mcp.ts` is shared by HTTP and stdio, and receives the resource options for each transport. Keep business diagnostics on stderr because stdout is reserved for JSON-RPC. Data is process-local unless you provide persistence. This mode supports local component views, not Module Federation remotes.
