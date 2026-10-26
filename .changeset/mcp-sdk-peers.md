---
'@modern-js/mcp-apps': patch
---

Use the application's MCP server and Apps SDK packages through peer dependencies. Replace the direct server-core dependency with an optional server-runtime peer, loaded only when invoking a BFF handler so standalone Fetch services remain independent of Modern.js runtime context.

通过 peer 依赖复用应用安装的 MCP Server 和 Apps SDK。移除 server-core 直接依赖，将 server-runtime 声明为可选 peer，仅执行 BFF handler 时加载，独立 Fetch 服务不依赖 Modern.js 运行时上下文。
