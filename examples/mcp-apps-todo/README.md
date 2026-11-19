# MCP Apps Todo Example

示例提供本地卡片 `local_todos`、MF 卡片 `list_todos` 和普通 tool `add_todo`。两张卡片共用同一个 Todo 组件和内存数据，重启服务后恢复初始数据。

## 开发

在仓库根目录执行：

```bash
pnpm install
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @examples/mcp-apps-todo dev
```

打开 http://localhost:8088 查看说明。MCP 客户端连接 http://localhost:8088/api/mcp。

在支持 MCP Apps 的客户端中调用 `local_todos` 或 `list_todos` 展示卡片。在一张卡片内添加 Todo，再运行另一张卡片即可看到相同数据。

## 代码入口

- `mcp-views.json`：本地组件路径与本项目 MF expose 声明
- `modern.config.ts`：Modern.js、BFF、MF、MCP UI 构建插件
- `module-federation.config.ts`：暴露 `./Todos`
- `src/components/Todos.tsx`：通过 `McpViewProps` 接收 structuredContent 和 mcpApp
- `api/server/mcp.ts`：HTTP 和 STDIO 共用的 server 工厂，注册 tools 和 UI resources
- `api/lambda/mcp.ts`：调用 server 工厂，导出 HTTP BFF handlers
- `api/server/store.ts`：内存数据

## 生产

```bash
pnpm --filter @examples/mcp-apps-todo build
pnpm --filter @examples/mcp-apps-todo serve
```

构建生成 `dist/mcp-apps/ui-manifest.json`、本地卡片 HTML 和 MF shell，静态文件与 MF manifest 使用标准应用产物。

使用 `PORT=8090 pnpm --filter @examples/mcp-apps-todo dev` 可以切换端口。

同一项目目录只运行一个 `modern dev` 实例。多个实例会共享 `.modern-js` 中间产物，可能导致 UI HTML 与所连接开发服务器的脚本不匹配。重启前先退出已有 dev 进程，并让 MCP 客户端连接终端实际打印的服务端口。

## STDIO 本地调试

在当前分支中先构建 MCP Apps 包，再准备示例：

```bash
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @examples/mcp-apps-todo mcp:prepare
```

命令打印可填写到 MCP 客户端的 `command` 和 `args`。在豆包中选择 STDIO，把 `command` 填到命令栏，把 `args` 中的 `server.cjs` 绝对路径作为一个参数填写。仅测试本地卡片时无需启动 `modern dev`。

产物位于本示例的 `dist-mcp/`，包括 `server.cjs`、`ui-manifest.json` 和内联 JS/CSS 的 UI HTML。修改源码后重新运行 `mcp:prepare`，再重启客户端连接器。运行产物仍需要保留本项目安装的 Node 依赖。

STDIO 使用 `mcp-views.stdio.json`，只注册本地卡片工具 `local_todos` 和普通工具 `add_todo`，无需启动 HTTP 服务。MF 卡片通过 HTTP 模式提供，使用 `dev`、`build` 和 `serve` 以及包含 MF 的 `mcp-views.json`。

可以对豆包说：“请调用 Todo MCP 的 local_todos，打开待办卡片。”确认初始列表显示后，在卡片输入标题并点击 Add todo。再次调用 `local_todos` 应能看到新增项。重启连接器后，内存数据恢复初始值。

豆包工作已验证本地 STDIO 卡片的展示、新增待办与重新读取。
