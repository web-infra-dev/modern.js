# Modern.js MCP Apps

## 任务管理体验

本示例保留 greet / add_numbers，并增加 `list_tasks`、`create_task` 和
`update_task`。任务卡片支持新增、状态切换和刷新；写入成功后再次查询服务端。
任务逻辑在 `src/features/tasks/server/tools.ts`，卡片在 `src/features/tasks/TaskBoard.tsx`。

```sh
pnpm --filter my-mcp-app-v2 dev
```

访问 http://localhost:8080 查看只读外观预览。连接 `/mcp` 后可以发送：

- “列出任务并展示任务看板。”
- “创建一个任务：验证 ChatGPT 中的交互。”
- “把刚创建的任务改为进行中，然后重新查询确认。”

任务保存在服务端 `.mcp-demo/tasks.json`，所有访问者共享，同一存储路径下重启后仍保留；多实例部署应使用数据库。
这是无认证的演示看板，仅放虚构数据。持久部署需要替换存储并加入用户隔离与认证。
请求结果不确定时先刷新，不自动重试创建任务。每个进程最多保留 100 个任务。


```sh
pnpm install
pnpm dev
```

The MCP endpoint is `/mcp`. Define tools in `mcp_apps.ts` and implement handlers
in `mcp_apps.ts`. A normal browser GET to `/mcp` returns 405; connect an MCP
client with POST requests instead. This starter does not include a DevTools host.

```sh
pnpm build
pnpm serve
pnpm deploy
```

`build` uses the server compiler to emit the definition and handlers into `dist/`. `serve` reads
those artifacts. `deploy` produces `.output/`, which can be moved to another
directory and started with `node .output/index.js`.

The default UI template compiles `view.module` (a local React component) into
Modern.js HTML and static JS/CSS assets. It does not need Module Federation or a manifest.
Create with `--template mcp-apps --mf` to opt into MF remote components instead;
only this mode uses `MCP_UI_ORIGIN` and exposes `./Greeting` through MF.

Server and UI do not have to share a deployment. Copy `dist/mcp-apps/` to an
independent Hono server, also host the static assets (or publish them to the
configured asset CDN), and mount `mcpApps({ configPath })` from
`@modern-js/mcp-apps/hono`. For separately hosted local-view HTML, set `view.html`
to its HTTPS URL. Declare external network origins in `view.csp`.

Development uses the BFF runtime reload for definitions and handlers, and Rspack
for UI sources. Production reads application-compiled code only. Rebuild the app
after changing server code or the UI entry graph.

Add authentication and host/origin policy in Modern.js server middleware before
exposing private tools. Tools are stateless HTTP POST endpoints in this version.

The MCP Apps plugin registers `/mcp` through BFF automatically and uses the
existing server compiler for the definition and imported tools. The adapter
preserves the MCP SDK response and passes the request Hono context to tools.
UI resources are emitted under `dist/mcp-apps/ui/` in production.

Server configuration, tool schemas and business handlers live in `mcp_apps.ts`.
For MCP Apps, `mcpAppsPlugin({ endpoint: '/mcp' })` compiles the definition and
registers the BFF route automatically; no `api/lambda/index.ts` is needed.
Set `endpoint: false` to mount a custom BFF route using `mcpServer(definition)`.
The backend-only `mcp-server` template retains that explicit BFF route and its
`api/mcp_apps.ts` definition.

## 服务端任务演示

在 MCP 客户端调用 `list_tasks` 打开任务列表。创建、更新和刷新通过 `callServerTool` 执行，调用记录显示真实参数、返回值和耗时。ID 和创建时间由服务端生成。任务默认保存在工作目录 `.mcp-demo/tasks.json`，可用 `MCP_TASKS_FILE` 指定路径，重启后保留。此为单进程共享演示，多个用户共用数据；多实例部署应改用数据库，临时文件系统不保证持久性。Greeting/Sum 保留为基础兼容示例。

任务示例集中在 `src/features/tasks/`：`TaskBoard.tsx` 为前端组件，`types.ts` 为共享类型，`server/tools.ts` 和 `server/store.ts` 为服务端工具与存储。工具与视图的关联在根目录 `mcp_apps.ts` 中显式声明。
