# MCP Apps 待办清单

一个 React 卡片、四个工具，演示对话和界面如何操作同一份服务端数据。默认使用本地组件，不需要数据库或外部 API。

## 运行

在仓库根目录安装依赖并构建工作区后运行：

```sh
pnpm --filter mcp-apps-todo dev
```

打开启动日志中的 `/mcp/inspector`，连接 `/mcp`。

1. 调用 `add_todo`，参数为 `{"title":"阅读 MCP Apps 文档"}`。
2. 调用 `list_todos`，参数为 `{}`，打开待办卡片。
3. 在卡片中添加待办，通过每项右侧的状态菜单选择「待完成」或「已完成」，或编辑名称、删除待办。卡片通过 `mcpApp.callServerTool()` 执行操作，再主动查询最新清单。
4. 再次从 Inspector 调用 `list_todos`，确认界面操作后的数据已经同步。

公开部署和对话宿主接入步骤见[快速开始](../../packages/document/docs/zh/guides/advanced-features/mcp-apps/quick-start.mdx)。

数据保存在单个服务进程的内存中，所有调用共享，重启或重新加载服务端模块后恢复初始清单。

## 完整验收流程

在支持 MCP Apps 的对话宿主中，连接同一个 `/mcp` 服务后依次操作：

1. 说“添加一项待办：阅读 MCP Apps 文档”，确认模型调用 `add_todo` 并返回添加结果。
2. 说“查看待办清单”，确认模型调用 `list_todos`，展示包含该待办的 React 卡片。
3. 在卡片中把该项的状态菜单从「待完成」改为「已完成」，确认它移入「已完成」分组。再改回「待完成」，确认分组和计数同步恢复。
4. 说“重新查询待办清单，阅读 MCP Apps 文档完成了吗？”，确认模型再次调用 `list_todos`，读取到未完成状态。
5. 在卡片中删除该待办，确认它从清单中消失。再说“重新查询清单，阅读 MCP Apps 文档还在吗？”，确认工具结果中已没有该待办。

验收重点是每次对话查询都实际调用工具，而不是仅根据聊天记录回答。卡片操作和对话查询应读取到一致的服务端状态。

## 卡片操作

- **修改状态**：每项右侧有「待完成／已完成」下拉菜单，修改后写入服务端并自动移动到对应分组。
- **编辑名称**：点击「编辑」，修改后点击「保存」或按 Enter。点击「取消」或按 Escape 放弃修改，空名称不会保存。
- **筛选**：使用「全部／待完成／已完成」查看对应事项和数量。
- **批量操作**：「全部完成」将待完成事项逐项更新。「清理已完成」先展示确认入口，再逐项删除。
- **同步与错误**：操作期间禁用写入控件并显示同步状态，失败时保留服务端实际结果并提示刷新。

交互参考 [TodoMVC 规范](https://github.com/tastejs/todomvc/blob/master/app-spec.md)，状态切换和编辑使用显式控件，适合初次接触的同学。数据由 MCP 服务管理，不使用浏览器 localStorage。批量操作复用 `update_todo` 和 `delete_todo`，并非事务，部分操作失败后会重新读取实际清单。

`update_todo` 接收 `id`，以及至少一个待更新字段 `title` 或 `completed`。例如 `{"id":"welcome","completed":true}` 用于完成任务，`{"id":"welcome","title":"阅读文档"}` 用于重命名。

## 能力与代码对应

| 能力                               | Demo 中的体现                                                             | 代码位置                                                              |
| ---------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 工具定义、参数类型推导与运行时校验 | `defineMcpServer()` 配合 `inputSchema`，约束标题、ID 和完成状态           | [mcp_apps.ts](./mcp_apps.ts)                                          |
| 工具关联 React 卡片                | 只有 `list_todos` 通过 `view.module` 绑定视图                             | [mcp_apps.ts](./mcp_apps.ts)                                          |
| 业务数据作为组件属性               | `withViewProps()` 复用 `structuredContent.todos`，组件接收 `todos`        | [mcp_apps.ts](./mcp_apps.ts)、[Todos.tsx](./src/components/Todos.tsx) |
| 卡片调用服务端工具                 | 通过注入的 `mcpApp.callServerTool()` 添加、更新和删除待办，再主动查询清单 | [Todos.tsx](./src/components/Todos.tsx)                               |
| 对话与界面共享状态                 | 所有工具使用同一份内存数据                                                | [store.ts](./server/store.ts)                                         |
| Modern.js 构建与服务集成           | 插件自动注册 `/mcp`，构建卡片资源，并提供开发 Inspector                   | [modern.config.ts](./modern.config.ts)                                |

## 阅读顺序

- `mcp_apps.ts`：通过 `defineMcpServer()` 定义四个工具，推导参数类型。只有 `list_todos` 绑定视图，通过 `withViewProps()` 将业务数据作为组件属性。
- `src/components/Todos.tsx`：接收 `todos` 和注入的 `mcpApp`，调用工具并处理加载、错误和刷新。
- `server/store.ts`：四个简单的存储操作，供对话和卡片共用。
- `modern.config.ts`：启用 BFF 和 MCP Apps 插件，自动挂载 `/mcp` 并构建卡片。

修改工具不需要额外编写 REST 接口。`add_todo`、`update_todo` 和 `delete_todo` 返回普通工具结果，避免每次修改都新建卡片。

## 构建与进阶

```sh
pnpm --filter mcp-apps-todo build
pnpm --filter mcp-apps-todo serve
```

生产环境提供 `/mcp` 和卡片资源，Inspector 仅用于开发。卡片的 HTML 和 manifest 位于 `dist/mcp-apps/`，部署时还需包含 JS、CSS 等静态资源。

先完成默认流程，再按需阅读：

- [Inspector](../../packages/document/docs/zh/guides/advanced-features/mcp-apps/inspector.mdx)：查看调用日志，或切换到本地模拟，使用 `{"todos":[]}` 作为 viewProps 预览空状态。模拟模式不连接业务工具。
- [MF 视图](../../packages/document/docs/zh/guides/advanced-features/mcp-apps/configuration.mdx)：将同一个 `Todos` 组件作为远程组件暴露，业务工具保持不变。
- [ui-only 与自建服务端](../../packages/document/docs/zh/guides/advanced-features/mcp-apps/custom-server.mdx)：独立构建 UI，再由自建 MCP Server 使用 manifest 提供资源。
