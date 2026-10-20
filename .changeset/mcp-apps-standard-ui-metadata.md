---
'@modern-js/mcp-apps': minor
'@modern-js/plugin-mcp-apps': minor
---

Align MCP Apps with standard UI metadata and negotiated capabilities, add meaningful text fallbacks, and upgrade the MCP client, core and server SDKs to 2.3.1. The MCP Apps SDK remains on the latest stable release, 2.0.3.

Expose guest capabilities and full local UI resource metadata. Apply host themes, handle partial input and cancellation, and remove the MF runtime's host-specific tool output fallback.

Use the official client in the development Inspector. Isolate previews through a loopback cross-origin sandbox proxy with response CSP headers, enforce app tool visibility, and send graceful teardown before closing cards. Support context updates, messages, logs, resources, downloads, links and app-provided tool debugging without advertising unsupported sampling.
