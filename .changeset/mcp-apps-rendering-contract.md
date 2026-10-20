---
'@modern-js/mcp-apps': major
'@modern-js/plugin-mcp-apps': patch
---

Separate business structuredContent from versioned Modern.js rendering metadata in result _meta['modernjs.dev/mcp-app']. Advertise outputSchema for tools with views and preserve business field names without collisions. Do not serialize view-only props into fallback text.

Share the host lifecycle and props resolution between local and Module Federation views, including partial input, cancellation and teardown. Clear stale result props on new inputs while retaining the loaded remote resource. Validate resource identities when binding UI manifests.

Migration: rebuild and deploy server and UI artifacts together. New runtimes read legacy structured/text rendering payloads, but old runtimes cannot read the new metadata format. User-managed servers should use createMcpViewResult rather than constructing the rendering envelope themselves. Hosts must forward result _meta to apps.
