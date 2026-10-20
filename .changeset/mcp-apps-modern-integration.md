---
'@modern-js/mcp-apps': minor
'@modern-js/plugin-mcp-apps': minor
'@modern-js/create': minor
'@modern-js/app-tools': patch
'@modern-js/runtime': patch
---

Add MCP Apps support with typed tool definitions, BFF endpoint integration, local React views and Module Federation components.

Provide UI-only builds and a versioned UI manifest for independently managed MCP servers. Include the development Inspector at `/__mcp_inspector` with automatic connection, schema-based argument templates, card previews and request logs.

Add MCP Apps and MCP Server scaffolding with interactive examples, and preserve MCP runtime assets in Node, Netlify and Vercel deployment output.

Share starter tools across local UI, Module Federation and server-only projects, and use each MCP package's own version in generated dependencies. Generate each project directly from selected template directories without deleting, overwriting or patching generated files.

Require explicit Module Federation manifest URLs and CSP configuration, delegating remote asset loading to the standard MF runtime. Reuse browser MF instances by remote name and entry URL, and invalidate pending file-backed handler initialization on reset.

Allow the browser runtime to initialize inside sandboxed iframes where access to document.cookie is restricted.
