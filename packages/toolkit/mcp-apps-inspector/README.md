# @modern-js/mcp-apps-inspector

Development Inspector for MCP Apps, including live server connections, local card previews and an isolated HTML sandbox.

`@modern-js/plugin-mcp-apps` integrates the Inspector at `/mcp/inspector` automatically during development. Set `inspector: false` to disable it.

The browser entry exports `McpInspector`. The `/server` entry exports `startInspectorSandbox` for the Node.js sandbox lifecycle.
