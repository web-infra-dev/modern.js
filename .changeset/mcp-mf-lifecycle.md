---
'@modern-js/mcp-apps': patch
---

Validate remote exports for React and imperative mount modes without silently falling back from missing named exports. Preserve lifecycle method receivers, avoid redundant initial updates, isolate mount lifecycle failures, show remote loading status, and disable unsupported display mode transitions.

Scope remote state to module identity and render mode, reset recovered lifecycle errors, support local retries, and serialize display mode requests. Separate React and imperative export types and add DOM lifecycle regression coverage.
