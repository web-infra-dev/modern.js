---
'@modern-js/plugin-mcp-apps': patch
'@modern-js/create': patch
---

Register MCP Apps endpoints automatically through BFF, compile root server definitions using the existing server compiler, and remove handwritten routes from MCP Apps templates. Use endpoint: false for manual mounting.

通过 BFF 自动注册 MCP Apps 路由，复用服务端编译器编译根目录定义，并移除 MCP Apps 模板的手写路由。手动挂载可设置 endpoint: false。
