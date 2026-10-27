---
'@modern-js/mcp-apps': patch
'@modern-js/plugin-mcp-apps': patch
'@modern-js/create': patch
---

Resolve MCP UI manifests through server plugin context instead of the working directory and NODE_ENV. Resolve injected UI options automatically from BFF requests while preserving standalone Fetch support.
