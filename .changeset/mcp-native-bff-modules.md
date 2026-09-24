---
'@modern-js/mcp-apps': minor
'@modern-js/plugin-mcp-apps': minor
'@modern-js/create': minor
'@modern-js/app-tools': patch
---

Use ordinary imports and direct tool functions for MCP BFF endpoints. Definitions and handlers live in api/ and compile through the existing BFF pipeline. Remove the MCP compiler, generated configuration wrapper, handler path mapping and core esbuild dependency. Bind UI resources with typed runtime code and move UI bridge logic out of generated entry strings.

Migrate routes to mcpApps(definition), import handlers in api/mcp_apps.ts, and replace compileMcpApps with the application's standard build.

Preserve the MCP package runtime HTML assets when tracing Node, Netlify and Vercel deployments.
