---
'@modern-js/mcp-apps': patch
---

Use the automatic React JSX runtime in isolated stdio builds even when the application tsconfig preserves JSX. Prevent generated UI from failing with an undefined React global during mounting.
