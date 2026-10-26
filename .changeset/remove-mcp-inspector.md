---
'@modern-js/plugin-mcp-apps': patch
'@modern-js/create': patch
---

Remove the built-in MCP Apps Inspector. Build local cards through the framework's multi-entry pipeline and copy their emitted HTML into UI resources, eliminating the duplicate card compiler. Keep a separate build only for the MF shell.

移除内置 MCP Apps Inspector。本地卡片复用框架多入口构建，将入口 HTML 映射为 UI 资源，移除重复的卡片编译器。仅 MF shell 保留独立构建。
