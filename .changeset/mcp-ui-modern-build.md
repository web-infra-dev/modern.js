---
'@modern-js/plugin-mcp-apps': minor
'@modern-js/mcp-apps': minor
'@modern-js/runtime': patch
---

Build local MCP UI through standard Modern.js application entries, runtime generation and Rspack, inheriting application aliases, styles, environment definitions, pre-entries and runtime plugins. Return emitted HTML with a public asset base and resource CSP instead of compiling self-contained UI with esbuild. The core consumes application-built UI HTML.

Allow the browser runtime to initialize in sandboxed iframes where document.cookie throws SecurityError.
