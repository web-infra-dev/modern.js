# Modern.js MCP Apps

Run `pnpm install`, then `pnpm dev`. The MCP endpoint is `/api/mcp`.

The server is an ordinary BFF route in `api/lambda/mcp.ts` using the official MCP SDK.

Declare cards in `mcp-views.json`. Connect an MCP Apps compatible host to `/api/mcp` to call tools and display cards.

Run `pnpm build` and `pnpm serve` for production. Deploy `dist/mcp-apps` together with the generated static assets.
The UI build never loads the server route or business store. Card props come from `structuredContent`.

Start `pnpm dev`, then run `pnpm inspect` in another terminal to launch the official MCP Inspector against `http://localhost:8080/api/mcp`. The command runs Inspector 2.12.0 on demand and requires Node.js 22.19.0 or newer. Override the endpoint with `pnpm inspect --server-url http://localhost:9090/api/mcp`.
