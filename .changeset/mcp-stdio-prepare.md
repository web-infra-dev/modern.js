---
'@modern-js/mcp-apps': minor
'@modern-js/create': patch
---

Add an `inline` option to `mcpAppsPlugin` for building self-contained local cards. Set `inline: 'dev'` to rebuild cards on edits and use the printed `modern-mcp-stdio` connector to debug them through the running HTTP dev server. The connector discovers the current port and forwards MCP routing headers so requests reach the application's middleware. Enable this workflow in the Todo example and document it in the project template.
