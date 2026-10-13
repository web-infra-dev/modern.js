# MCP Apps tasks

## 服务端任务演示

在 MCP 客户端调用 `list_tasks` 打开任务列表。创建、更新和刷新通过 `callServerTool` 执行，调用记录显示真实参数、返回值和耗时。ID 和创建时间由服务端生成。任务默认保存在工作目录 `.mcp-demo/tasks.json`，可用 `MCP_TASKS_FILE` 指定路径，重启后保留。此为单进程共享演示，多个用户共用数据；多实例部署应改用数据库，临时文件系统不保证持久性。Greeting/Sum 保留为基础兼容示例。

任务示例集中在 `src/features/tasks/`：`TaskBoard.tsx` 为前端组件，`types.ts` 为共享类型，`server/tools.ts` 和 `server/store.ts` 为服务端工具与存储。工具与视图的关联在根目录 `mcp_apps.ts` 中显式声明。
