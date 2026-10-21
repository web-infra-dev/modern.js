---
'@modern-js/mcp-apps': minor
'@modern-js/mcp-apps-inspector': minor
'@modern-js/plugin-mcp-apps': minor
'@modern-js/create': minor
'@modern-js/runtime': patch
---

Add MCP Apps support with typed tool definitions, input and output validation, business results mapped to React card props through withViewProps, and shared card lifecycle handling. Preserve all supported request header formats in fetchJson and forward tool errors to Hono error callbacks.

Integrate automatic BFF endpoint registration, local React card builds and Module Federation views. Bind public asset bases for explicit HTML resources and configure CORS for public MF assets in generated applications. Support UI-only builds with versioned UI manifests for independently managed MCP servers.

Provide a separately published development Inspector with live connections, local simulation, isolated card previews, host interactions and request logs.

Generate Todo starters for local components, Module Federation and tool-only servers. Include tools for listing, adding, editing, completing and deleting todos, with shared server state and an interactive card.

Allow the browser runtime to initialize in sandboxed iframes where cookie access is restricted.
