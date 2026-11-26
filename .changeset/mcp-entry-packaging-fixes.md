---
'@modern-js/mcp-apps': patch
---

Replace host-specific plugin resource copying with explicit plugin.resources paths and ignore entry connection callbacks after teardown.

Allow applications to disable automatic entry handshakes and explicitly connect or retry through connectEntryMcpApp.

Use the emitted bundler public path for deployment resource CSP and validate resource selections before registration.
