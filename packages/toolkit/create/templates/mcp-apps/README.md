# Modern.js MCP Apps

Run `pnpm install`, then `pnpm dev`. The MCP endpoint is `/api/mcp`.

The server is an ordinary BFF route in `api/lambda/mcp.ts` using the official MCP SDK.

Declare cards in `mcp-views.json`. During development open `/mcp/inspector` to call tools and preview cards.

Run `pnpm build` and `pnpm serve` for production. Deploy `dist/mcp-apps` together with the generated static assets.
The UI build never loads the server route or business store. Card props come from `structuredContent`.
