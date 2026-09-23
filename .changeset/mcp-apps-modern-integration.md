---
'@modern-js/plugin-mcp-apps': minor
'@modern-js/mcp-apps': minor
'@modern-js/create': minor
---

Integrate MCP Apps definitions with Modern.js development, production builds and portable Node deployment artifacts. Add mcp-apps and mcp-server creator templates while retaining independent server/UI deployment and the default application template.

Default MCP Apps scaffolding to local views; add `--mf` for remote components and share the Hono adapter across deployments.

Route integrated MCP endpoints through BFF API functions instead of automatically injecting Web Server middleware. Add a BFF adapter that preserves SDK responses and request context, and update templates and examples.

Simplify BFF route declarations with mcpApps(), bind artifacts from runtime context for portable output paths, and move template tool implementations outside the BFF compiler input directories.
