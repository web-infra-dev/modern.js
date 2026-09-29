---
'@modern-js/mcp-apps': minor
'@modern-js/create': patch
'@modern-js/plugin-mcp-apps': patch
---

Remove the MCP Apps `manifestType` option and always load browser remote components through the standard Module Federation runtime. Remove the selector from generated MF projects and tool result metadata.

Remove Vmok browser and server loaders and the Vmok-only remote fields (`serverEntry`, `snapshotUrl`, `locale`, and `version`). Handler module loading now supports local modules only.

Upgrade to MCP SDK 2.2.0 and Apps SDK 2.0.3. Serve MCP 2026-07-28 using the official per-request HTTP entry, retaining stateless legacy JSON transport. Validate browser origins, expose allowedOrigins through BFF/Hono adapters, and accept JSON-valued structured results. Update template verification to use server discovery and per-request metadata.
