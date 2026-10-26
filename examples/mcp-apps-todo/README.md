# MCP Apps Todo Example

示例提供本地卡片 `local_todos`、MF 卡片 `list_todos` 和普通 tool `add_todo`。两张卡片共用同一个 Todo 组件和内存数据，重启服务后恢复初始数据。

## 开发

在仓库根目录执行：

```bash
pnpm install
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @modern-js/mcp-apps-inspector build
pnpm --filter @modern-js/plugin-mcp-apps build
pnpm --filter @examples/mcp-apps-todo dev
```

打开 http://localhost:8088 查看说明，打开 http://localhost:8088/mcp/inspector 调试。MCP 客户端连接 http://localhost:8088/api/mcp。

点击 `Connect & discover`，选择 `local_todos` 或 `list_todos`，点击 `Run tool`。在一张卡片内添加 Todo，再运行另一张卡片即可看到相同数据。

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

构建生成 `dist/mcp-apps/ui-manifest.json`、本地卡片 HTML 和 MF shell，静态文件与 MF manifest 使用标准应用产物。生产模式不包含 Inspector。

使用 `PORT=8090 pnpm --filter @examples/mcp-apps-todo dev` 可以切换端口。
