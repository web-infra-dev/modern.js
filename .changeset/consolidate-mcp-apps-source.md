---
'@modern-js/mcp-apps': patch
---

Consolidate tool definitions, schema normalization and server-side loading into their owning modules. Name the browser container mf-runtime and keep test sources under tests while preserving package entry points.

Keep normalization internal to server resources, prevent invalidated initialization from replacing a newer handler after reset, and remove unused MF rendering options and reload state.
