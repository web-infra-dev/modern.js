# MCP Apps 迁移与当前实现

本文记录当前代码的模块边界和运行链路。接入步骤见 [使用指南](../guides/mcp-apps-usage.md)，面向应用开发者的完整说明见[中文文档](../../packages/document/docs/zh/guides/advanced-features/mcp-apps/index.mdx)和[英文文档](../../packages/document/docs/en/guides/advanced-features/mcp-apps/index.mdx)。

## 迁移范围

核心包复用 Fancy 的配置、结果与视图绑定、MF 加载和浏览器渲染能力，保留来源说明与许可证。未迁移 Fancy CLI、Express 启动层或 DevTools，也不恢复 `modern new`。

- [NOTICE](../../packages/toolkit/mcp-apps/NOTICE.md)
- [THIRD-PARTY-LICENSE](../../packages/toolkit/mcp-apps/THIRD-PARTY-LICENSE)

不再要求生成独立 `ui-manifest.json`。本地视图使用标准 Modern.js 构建产物，MF 视图使用 MF 原有 manifest、remote entry 和 chunks。

## 包与入口

| 包或入口                         | 职责                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| `@modern-js/mcp-apps/config`     | `defineMcpServer`、`defineTool`、Schema 推导与配置类型             |
| `@modern-js/mcp-apps/server`     | 配置加载、输入输出校验、工具与资源注册、HTTP handler、UI HTML 绑定 |
| `@modern-js/mcp-apps/react`      | `createMcpView`、`useMcpApp` 和通信类型                            |
| `@modern-js/mcp-apps/hono`       | Hono 请求适配，不启动 listener                                     |
| `@modern-js/mcp-apps/bff`        | BFF 请求适配核心                                                   |
| `@modern-js/plugin-mcp-apps`     | 应用构建、定义编译、BFF 生命周期和 MF 产物发现                     |
| `@modern-js/plugin-mcp-apps/bff` | 手动路由声明 `mcpServer`，旧名 `mcpApps` 保留兼容                  |

核心包不依赖 Modern.js CLI，也不提供 `/build` 或 `compileMcpApps` 编译 API。

## 服务定义与工具

新定义使用 `defineMcpServer({ name, version, tools })`，名称和版本非空，`remotes` 默认 `[]`。内联工具根据 `inputSchema` 推导 handler 参数，拆分文件时可使用 `defineTool`，通过普通 import 让服务端编译器追踪依赖。

属性简写默认字段必填、禁止额外属性，`optional: true` 标记可选。嵌套对象、Schema 关键字同名字段和对象级约束使用完整 JSON Schema。运行时将简写展开，再使用严格 JSON Schema 2020-12 校验。`outputSchema` 校验业务 `structuredContent`，带 UI 的工具在附加视图数据后不向客户端声明该输出 schema。

每个工具至少提供 handler 或 view。结果保留 `content`、`structuredContent`、`_meta` 和 `isError`，视图工具额外附加 `tool/resource/args/viewProps` 信息。卡片合并工具输入和 `viewProps`，后者优先，并注入 `mcpApp`。

## Modern.js 运行链路

默认 UI 模板在根目录定义 `mcp_apps.ts`，启用 `appTools()`、`bffPlugin()` 和 `mcpAppsPlugin()`。

1. 插件读取定义，发现工具的本地 `view.module`，生成标准自动挂载入口。
2. 应用构建器编译卡片，继承应用 alias、CSS、preEntry、globalVars 和运行时插件。文件路由 layout 和 loader 不会自动附加到卡片组件。
3. 插件通过现有服务端编译器将根定义输出到 `dist/mcp_apps.js`，静态导入模块保留相对路径。`.mts` 和 `.cts` 分别输出 `.mjs` 和 `.cjs`。
4. BFF 生命周期绑定定义与资源，自动注册 `/mcp`。`endpoint` 是独立于 BFF prefix 的完整路径，不能与已有 BFF 路由冲突。
5. 本地 HTML 副本位于 `dist/mcp-apps/ui/`，JS/CSS/chunks 保留应用标准静态路径。部署必须同时提供这些资源。
6. 开发模式追踪定义与依赖变化并重载，生产模式读取编译产物。`modern deploy` 生成可迁移的 `.output/`。

手动路由设置 `config: 'api/mcp_apps.ts', endpoint: false`，在 BFF API 文件中导出 `mcpServer(definition)` 返回的方法。此时定义和导入模块由 BFF 编译到 `dist/api/`，路由遵循 BFF prefix。纯 `mcp-server` 模板采用此模式。

源码依据：[CLI](../../packages/cli/plugin-mcp-apps/src/cli.ts)、[UI 构建](../../packages/cli/plugin-mcp-apps/src/ui.ts)、[BFF 生命周期](../../packages/cli/plugin-mcp-apps/src/bff-runtime.ts)、[资源绑定](../../packages/toolkit/mcp-apps/src/ui-resources.ts)。

## 可选 MF

`--template mcp-apps --mf` 增加 MF 插件、依赖和 exposes。工具声明 `remote: 'mcp_ui'`，`view.module` 使用 expose 名称。本应用的 remote 无需重复写入 `remotes`：插件读取匹配名称的构建 manifest 和 publicPath，绑定地址和资源 CSP。`auto` 或相对 publicPath 按请求公开 origin 解析，显式外部 `remotes` 保持不变。

公开开发资源配置 `dev.assetPrefix`，生产资源配置 `output.assetPrefix`。公共 `/static/*` 的 CORS 和 OPTIONS 预检由 MCP Apps 插件处理，该策略不用于 `/mcp`。独立 CDN 需要自行配置 CORS。

显式外部 remote 的 `baseUrl` 指向标准 MF manifest，可用 `browserEntry` 覆盖加载入口，并声明实际 CSP。核心包不执行应用构建产物发现，独立服务需提供完整 remote 配置。

MF 渲染器支持 component 和 mount。本地自动挂载入口只支持 React component。已注入 `mcpApp` 的组件不应另建宿主连接，应通过 `callServerTool` 调用工具并将结果存入组件状态。

源码依据：[MF 发现与绑定](../../packages/cli/plugin-mcp-apps/src/mf.ts)、[浏览器运行时](../../packages/toolkit/mcp-apps/src/runtime/mcp-app.tsx)。

## 独立 Hono 部署

使用 `mcpApps({ definition })` 挂载导入的编译定义。本地视图通过 `bindUiResources` 关联 HTML，单独提供静态资源服务或 CDN。复制完整 `dist/` 时保留 `package.json` 的名称、版本、模块类型及导入模块路径，并安装生产依赖。加载编译文件可用 `loadMcpAppsConfig`，核心包不负责 TypeScript 编译。

Hono 适配器不监听端口，不提供静态服务或 Modern.js MF 自动发现。鉴权、listener 和部署配置由应用管理。独立 HTML 可通过 `view.html` 指定 HTTPS URL，由服务端读取后作为 MCP 资源返回。

## 模板与示例

UI 模板包含 `list_tasks`、`create_task`、`update_task`、`greet` 和 `add_numbers`。前三者复用任务看板，工具与存储位于 `src/features/tasks/server/`。纯服务端模板仅保留问候、加法工具，无 UI。

- [本地视图示例](../../examples/my-mcp-app-v2/README.md)
- [MF 示例](../../examples/my-mcp-app-mf/README.md)
- [创建器模板](../../packages/toolkit/create/mcp-templates/)

任务数据默认写入工作目录 `.mcp-demo/tasks.json`，可用 `MCP_TASKS_FILE` 覆盖。单进程最多 100 个任务，这是无认证共享演示，用户隔离和多实例存储需由应用实现。

## 验证与边界

```sh
pnpm install
pnpm prepare-build
pnpm --filter @modern-js/mcp-apps --filter @modern-js/plugin-mcp-apps test
pnpm --filter @modern-js/mcp-apps --filter @modern-js/plugin-mcp-apps typecheck
pnpm --dir tests exec rstest integration/mcp-apps/tests/index.test.ts
pnpm --filter my-mcp-app-v2 --filter my-mcp-app-mf build
pnpm --filter @modern-js/mcp-apps test:deployment
```

集成测试覆盖普通和 MF 视图、浏览器交互、任务工具、热更新、普通页面与 BFF 共存、生产构建、迁移部署及 ESM 纯服务端。部署冒烟测试打包核心包，在隔离生产依赖安装中运行编译定义，不安装 React 或 app-tools。

当前使用 MCP SDK core/server/client 2.2.0、Apps SDK 2.0.3，由官方 SDK 处理协议。HTTP 为无状态 POST，每次请求创建独立 server/transport，不提供持久会话、恢复 SSE 或跨请求取消路由。handler 应主动响应取消信号，超时不能回滚副作用。visibility 和 annotations 不代替权限控制。

测试宿主位于 `packages/toolkit/mcp-apps/scripts/browser-fixture.mjs`，使用官方 AppBridge，仅用于测试，不随 npm 包发布。目标产品宿主仍需实际验证工具、卡片和交互。
