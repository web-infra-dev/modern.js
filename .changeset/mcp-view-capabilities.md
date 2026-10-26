---
'@modern-js/mcp-apps': patch
'@modern-js/plugin-mcp-apps': patch
---

Advertise inline and fullscreen display modes by default. Allow local views and MF exposes to export mcpCapabilities, with MF capabilities loaded before the initialization handshake. createMcpView also accepts capabilities as its third argument.

默认声明 inline 和 fullscreen 展示模式。本地视图及 MF expose 可导出 mcpCapabilities，MF 能力在初始化握手前加载。createMcpView 支持通过第三个参数传入能力声明。
