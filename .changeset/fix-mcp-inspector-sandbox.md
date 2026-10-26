---
'@modern-js/plugin-mcp-apps': patch
'@modern-js/mcp-apps-inspector': patch
---

Resolve the Inspector sandbox address from the active development server when opening each card, and close the old sandbox on configuration restart.

Inspector 在每次打开卡片时从当前开发服务器获取 sandbox 地址，并在配置重启时关闭旧 sandbox，避免引用失效地址。
