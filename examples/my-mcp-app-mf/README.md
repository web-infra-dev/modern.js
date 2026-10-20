# Modern.js MCP Apps

```sh
pnpm install
pnpm dev
```

Define simple tools and their UI bindings directly in `mcp_apps.ts` (or `api/mcp_apps.ts` for tool-only projects). The MCP endpoint is `/mcp`. For projects with UI, open the Inspector URL printed at startup to call tools, preview cards and inspect request logs.

```sh
pnpm build
pnpm serve
pnpm deploy
```

`build` produces application and server artifacts in `dist/`. `serve` runs those artifacts. `deploy` creates a portable `.output/` directory, started with `node .output/index.js`.

Local React views produce HTML in `dist/mcp-apps/ui/` and a UI manifest in `dist/mcp-apps/ui-manifest.json`. Deploy the static JS/CSS assets as well, or configure `output.assetPrefix` for a CDN. MF projects use standard MF manifests and exposed components.

The tool-only `mcp-server` template uses an explicit BFF route and an `api/mcp_apps.ts` definition. It does not include React cards.

## Documentation

- [Define tools and views](https://modernjs.dev/en/guides/advanced-features/mcp-apps/configuration)
- [Local debugging](https://modernjs.dev/en/guides/advanced-features/mcp-apps/debugging)
- [Build and deploy](https://modernjs.dev/en/guides/advanced-features/mcp-apps/deployment)
- [User-managed servers](https://modernjs.dev/en/guides/advanced-features/mcp-apps/custom-server)


## 服务端任务演示

只有 `list_tasks` 绑定任务看板，调用它可打开任务列表。`create_task` 和 `update_task` 不绑定 UI，直接调用时只返回操作结果。创建、更新和刷新通过 `callServerTool` 执行，调用记录显示真实参数、返回值和耗时。ID 和创建时间由服务端生成。任务默认保存在工作目录 `.mcp-demo/tasks.json`，可用 `MCP_TASKS_FILE` 指定路径，重启后保留。此为单进程共享演示，多个用户共用数据；多实例部署应改用数据库，临时文件系统不保证持久性。Greeting/Sum 保留为基础兼容示例。

任务示例集中在 `src/features/tasks/`：`TaskBoard.tsx` 为前端组件，`types.ts` 为共享类型，`server/tools.ts` 和 `server/store.ts` 为服务端工具与存储。Greeting 和 Sum 的简单工具直接定义在 `mcp_apps.ts` 中。工具与视图的关联在根目录 `mcp_apps.ts` 中显式声明。



## Module Federation hosting

Configure the complete MF manifest URL in `mcp_apps.ts`. The default is `http://localhost:8080/static/mf-manifest.json`. Set `MCP_UI_MANIFEST_URL` and `MCP_UI_ORIGIN` for a different address and its CSP origin, or edit the remote definition directly.

The MCP plugin does not infer remote URLs or serve MF assets. Publish manifests and chunks with your application static server or CDN and configure CORS there so the host's sandbox can load them. The MF runtime handles manifest and module loading.

在 Inspector 中运行 `list_tasks` 后，点击任务看板右上角的「最大化」测试全屏显示。点击「退出最大化」或 Inspector 顶部的「Exit fullscreen」恢复。实际宿主需要通过 `availableDisplayModes` 提供对应模式，按钮才会启用。
