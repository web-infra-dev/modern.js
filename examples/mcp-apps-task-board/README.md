# MCP Apps task board

This advanced example demonstrates a server-backed card calling multiple tools. Start with `examples/mcp-apps-demo` for a minimal tool and card comparison.

Run `pnpm install` and `pnpm dev`, then open `/mcp/inspector`. Call `list_tasks` to open the board. The card calls `create_task`, `update_task` and `list_tasks` to update or refresh its state. Mutation tools return business results without opening another card.

Tasks are stored in `.mcp-demo/tasks.json` under the working directory. Set `MCP_TASKS_FILE` to override the location. This is shared, single-process demonstration storage. Users share the same task data. Multi-instance applications should use a database, and ephemeral filesystems do not guarantee persistence.

`src/features/tasks/TaskBoard.tsx` contains the card. The adjacent `server/` directory contains the tools and storage. `mcp_apps.ts` binds only the list tool to a view.
