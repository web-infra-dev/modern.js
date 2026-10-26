# MCP Apps Todo Example

示例提供本地卡片 `local_todos`、MF 卡片 `list_todos` 和普通 tool `add_todo`。两张卡片共用同一个 Todo 组件和内存数据，重启服务后恢复初始数据。

## 开发

在仓库根目录执行：

```bash
pnpm install
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @modern-js/plugin-mcp-apps build
pnpm --filter @examples/mcp-apps-todo dev
```

打开 http://localhost:8088 查看说明。MCP 客户端连接 http://localhost:8088/api/mcp。

在支持 MCP Apps 的客户端中调用 `local_todos` 或 `list_todos` 展示卡片。在一张卡片内添加 Todo，再运行另一张卡片即可看到相同数据。

## 代码入口

- `mcp-views.json`：本地组件路径与本项目 MF expose 声明
- `modern.config.ts`：Modern.js、BFF、MF、MCP UI 构建插件
- `module-federation.config.ts`：暴露 `./Todos`
- `src/components/Todos.tsx`：通过 `McpViewProps` 接收 structuredContent 和 mcpApp
- `api/lambda/mcp.ts`：官方 SDK 注册 tools，通过 UI 清单注册 resources，显式导出 BFF handlers
- `api/server/store.ts`：内存数据

## 生产

```bash
pnpm --filter @examples/mcp-apps-todo build
pnpm --filter @examples/mcp-apps-todo serve
```

构建生成 `dist/mcp-apps/ui-manifest.json`、本地卡片 HTML 和 MF shell，静态文件与 MF manifest 使用标准应用产物。

使用 `PORT=8090 pnpm --filter @examples/mcp-apps-todo dev` 可以切换端口。

## 官方 MCP Inspector

先启动 `pnpm dev`，在另一个终端执行：

```bash
pnpm --filter @examples/mcp-apps-todo inspect
```

此命令按需运行固定版本的官方 `@modelcontextprotocol/inspector@2.12.0`，使用 Streamable HTTP 连接 `http://localhost:8088/api/mcp`，不会将 Inspector 加入框架或应用的生产依赖。Inspector 2.12.0 要求 Node.js 22.19.0 或更高版本。

打开终端打印的 Inspector 地址，连接服务后，在 Apps 页面选择 `local_todos` 或 `list_todos` 预览卡片。在卡片内添加 Todo，再切换另一张卡片验证共享数据。Tools、Resources 和协议日志用于排查调用及资源加载。

若修改了服务端口，可覆盖目标地址：

```bash
pnpm --filter @examples/mcp-apps-todo inspect --server-url http://localhost:9090/api/mcp
```

官方参考：[OpenAI 调试指南](https://developers.openai.com/plugins/build/app-quickstart#test-with-mcp-inspector)。

同一项目目录只运行一个 `modern dev` 实例。多个实例会共享 `.modern-js` 中间产物，可能导致 UI HTML 与所连接开发服务器的脚本不匹配。重启前先退出已有 dev 进程，并让 Inspector 连接终端实际打印的 MCP 服务端口。
