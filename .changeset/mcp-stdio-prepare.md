---
'@modern-js/mcp-apps': minor
'@modern-js/create': patch
---

Add `inline` option (`'dev' | boolean`) to `mcpAppsPlugin` and a lightweight `modern-mcp-stdio` stdio-to-HTTP bridge for local MCP Apps debugging with `modern dev`. Local views can be built into self-contained inline HTML with incremental watch rebuilds while requests continue flowing through the real HTTP dev server and middlewares.
