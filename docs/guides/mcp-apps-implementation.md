# Modern.js MCP Apps 实现与设计

Modern.js 将 MCP Apps 支持拆成协议运行库、框架插件和独立的开发 Inspector。开发者声明服务端 Tool 及其可选 View，插件负责构建浏览器入口、输出 UI 资源并接入 BFF。宿主通过 MCP 获取工具和 HTML，再将工具输入与结果传给卡片中的 React 组件。

本文面向 PR reviewer，按定义、构建、服务接入和浏览器运行的顺序解释当前实现。需要特别关注结果元数据格式、本地与 Module Federation 两条渲染路径，以及服务端和 UI 产物的升级边界。

## 先看完整链路

以 [Todo 示例](../../examples/mcp-apps) 为例：

```text
mcp_apps.ts 声明 list_todos 与 Todos View
  → 插件编译 View，生成 HTML 和 ui-manifest.json
  → 服务端绑定 UI 产物，注册 /mcp
  → 宿主调用 list_todos，按 resourceUri 读取 HTML
  → 宿主将结果传入卡片，Todos 渲染待办事项
  → 用户修改事项，卡片调用 update_todo，再调用 list_todos 更新界面
```

这里有两个独立的数据流：宿主将工具调用结果传入卡片，卡片也可以通过 MCP 主动调用工具。后者的返回值由卡片消费，不能依赖宿主再次推送。

## 包边界与代码入口

| 模块                         | 职责                                            | 主要入口                                                                                                                                           |
| ---------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@modern-js/mcp-apps/config` | 工具、视图与远程配置的声明和类型推导            | [config.ts](../../packages/toolkit/mcp-apps/src/config.ts)                                                                                         |
| `@modern-js/mcp-apps/server` | MCP 请求处理、工具执行和结果封装                | [server.ts](../../packages/toolkit/mcp-apps/src/server.ts)                                                                                         |
| 资源管理                     | 资源 URI、Manifest、HTML 和静态资源基址         | [resources.ts](../../packages/toolkit/mcp-apps/src/resources.ts)                                                                                   |
| React 运行时                 | 宿主连接、事件状态与组件包装                    | [react.ts](../../packages/toolkit/mcp-apps/src/react.ts)                                                                                           |
| MF 运行时                    | 通用卡片容器和远程组件加载                      | [mcp-app.tsx](../../packages/toolkit/mcp-apps/src/mf-runtime/mcp-app.tsx)、[remote.tsx](../../packages/toolkit/mcp-apps/src/mf-runtime/remote.tsx) |
| `@modern-js/plugin-mcp-apps` | Modern.js 构建、监听、服务插件和 Inspector 入口 | [cli.ts](../../packages/cli/plugin-mcp-apps/src/cli.ts)                                                                                            |
| BFF 服务插件                 | 绑定 UI 资源，注册或替换 API handler            | [bff-runtime.ts](../../packages/cli/plugin-mcp-apps/src/bff-runtime.ts)                                                                            |

Inspector 由 `@modern-js/mcp-apps-inspector` 独立发布，负责开发调试 UI 和预览沙箱。核心运行库不依赖 Inspector，框架插件负责将它接入开发流程。

核心 HTTP 接口是标准 `Request → Promise<Response>`。BFF 和 Hono 负责适配宿主框架，核心库不自行监听端口。应用可以使用完整 Modern.js 集成，也可以只构建 UI，将 MCP 服务部署在自己管理的服务器上。

## 从 Tool 定义开始

`defineMcpServer()` 接收应用的工具定义，检查服务名称和版本，并将缺省 `remotes` 补成空数组。它不会启动服务器或编译组件。`defineTool()` 支持将工具拆到单独模块，类型层通过 JSON Schema 推导输入等信息。

定义 API 和构建模式分别承担不同职责：

| 入口 | 使用场景 |
| --- | --- |
| `defineMcpServer()` | 声明完整服务，包括工具 handler 和可选 View |
| `defineTool()` | 单独声明工具，保留输入和结果的类型推导 |
| `defineMcpUi()` | 只声明本地 View，不导入业务 handler，适合 UI 独立构建 |
| 插件 `mode: 'ui-only'` | 构建 UI 和 Manifest，不自动注册 MCP 服务，也不编译服务定义 |

`defineMcpUi()` 是配置辅助函数，`ui-only` 是插件选项，前者不会自动开启后者。完整 Modern.js 服务使用 `defineMcpServer()` 和默认插件模式即可。

一个工具的关键字段是：

<!-- prettier-ignore -->
```ts
{
  name: 'list_todos',
  inputSchema,
  outputSchema,
  handler,
  view: { module: './src/components/Todos.tsx' },
}
```

`handler` 在服务端执行业务，`view` 指定浏览器界面。两者可以独立存在：只有 handler 是普通 MCP 工具，只有 View 可以直接展示输入，同时配置则由 handler 计算数据、View 展示结果。

`validateMcpAppsConfig()` 检查至少有 handler 或 View、远程引用有效、渲染模式受支持等条件。`normalizeToolConfig()` 统一兼容字段和视图默认值。相关实现集中在 [resources.ts](../../packages/toolkit/mcp-apps/src/resources.ts)。

设计上，配置只声明业务能力，构建和服务生命周期负责执行这些声明，避免业务定义自行处理框架初始化。

## 本地 View 如何进入 Modern.js 构建

[cli.ts](../../packages/cli/plugin-mcp-apps/src/cli.ts) 中的 `mcpAppsPlugin()` 默认读取项目根目录的 `mcp_apps.ts`。普通集成模式要求启用 BFF 插件，`ui-only` 模式只提供 UI 构建与调试能力。

`setupMcpUi()` 在 `modifyEntrypoints` 阶段加载、校验定义，为没有远程配置和预编译 HTML 的本地 View 生成入口。生成代码的核心形式是：

<!-- prettier-ignore -->
```tsx
import { createMcpView } from '@modern-js/mcp-apps/react'
import View from '/absolute/path/to/component'

export default createMcpView(View, appInfo, capabilities)
```

入口设置 `isAutoMount: true`，交给 Modern.js 原有前端构建流程处理。本地自动生成入口只支持 `component` 渲染模式。`getUiEntryName()` 根据工具名生成稳定的哈希入口名，避免直接用工具名作为输出文件路径。

插件在 Web compiler 的 `afterEmit` 中保存入口生成的 HTML，再生成版本化 UI Manifest：

```text
mcp-apps/
  ui-manifest.json
  ui/
    mcp-ui-<hash>.html
```

开发环境保存在框架内部目录，生产环境保存在 `dist`。Manifest 记录工具名、资源 URI、HTML 路径、静态资源基址和 UI 元数据。`writeArtifact()` 先写临时文件再重命名，降低读取到半成品的风险。生产构建还会编译 MCP 服务定义。

这里的设计边界是：前端构建生成 UI 产物，MCP 服务消费产物。请求处理阶段无需编译 React 源码，也无需理解前端模块依赖图。

## UI 产物如何绑定到 BFF

CLI 插件通过 `_internalServerPlugins` 注册 `bff-runtime`。服务端插件在 `prepareApiServer` 阶段工作，在 BFF 正式注册路由前完成：

```text
读取 MCP 定义与 UI Manifest
  → bindUiResources 为本地 View 绑定 HTML 和 assetBase
  → createMcpBffHandler 创建请求适配器
  → 更新 apiHandlerInfos
  → BFF 注册路由
```

`bindUiResources()` 保留业务 handler，只补充 View 的产物信息。提供 Manifest 时，校验资源 URI、MIME 类型和 HTML 字段，尽早发现资源映射不匹配。生产环境优先读取 Manifest，缺少 Manifest 的旧产物仍可按约定路径绑定。此校验不等价于完整的构建版本一致性检查。

路由既支持默认自动挂载到 `/mcp`，也支持设置 `endpoint: false` 后手动声明。手动方式由 [插件 bff.ts](../../packages/cli/plugin-mcp-apps/src/bff.ts) 返回带 `Symbol.for()` 标记的占位 handler，`bff-runtime` 在路由准备阶段读取标记并替换为真实实现。占位函数若未被初始化，会给出明确错误。

[核心 BFF 适配器](../../packages/toolkit/mcp-apps/src/bff.ts) 还处理了请求体生命周期：BFF 已解析原始 body，需要从 `input.data` 重建 `Request`，删除旧的 `content-length`，同时保留请求取消信号。

## MCP 请求如何关联工具与卡片

`createMcpHandler()` 在创建时校验定义、构建工具表和资源表，并为工具编译 AJV 输入输出校验器。每次 HTTP 请求创建对应 SDK Server，注册以下业务处理：

| 请求             | 行为                                   |
| ---------------- | -------------------------------------- |
| `tools/list`     | 返回工具描述、schema 和 UI 关联        |
| `tools/call`     | 校验输入、执行业务、校验输出并封装结果 |
| `resources/list` | 返回 UI 资源描述                       |
| `resources/read` | 返回 HTML 内容及资源元数据             |

工具通过标准字段 `_meta.ui.resourceUri` 关联卡片。本地资源采用 `ui://app/<toolName>`，MF 工具资源采用 `ui://mf/app/<remoteName>/<toolName>`，名称按 URI 编码规则转义。HTML 的标准 MCP App MIME 类型由 `UI_MIME_TYPE` 常量定义。

资源 URI 是协议标识。`resources/read` 返回 HTML 内容，宿主无需直接导航到应用页面。由于 HTML 在宿主环境中运行，`resolveUiHtml()` 根据 `assetBase` 注入 HTML base 地址，并将来源补充到相关 CSP 域名列表，让卡片能够访问应用的 JS、CSS 和 chunk。

`tools/list` 在能够获取客户端能力时检查 UI MIME 支持，对不支持的客户端移除卡片资源关联。普通客户端仍可调用工具并读取业务结果。

## handler 执行与结果数据边界

[server.ts](../../packages/toolkit/mcp-apps/src/server.ts) 的 `tools/call` 路径依次查找工具、校验参数、执行 handler、校验业务输出，再封装渲染元数据。

handler 可以是函数，也可以通过本地模块路径加载。虽然部分类型使用 `RemoteToolHandler` 命名，默认 loader 加载的是服务端本地模块，不会通过 MF 在服务端执行远程业务代码。

执行上下文包含原始请求、框架注入的请求上下文、工具信息、`signal`、`fetch` 和 `fetchJson`。请求取消、协议取消和工具超时被合并成同一个 signal。超时或取消会结束等待，业务中的网络请求和其他副作用仍需主动响应 signal。

结果的三类信息分别保存：

| 字段                            | 语义                                                   |
| ------------------------------- | ------------------------------------------------------ |
| `content`                       | 文本等工具内容                                         |
| `structuredContent`             | 原始结构的业务结果，供 outputSchema 校验               |
| `_meta['modernjs.dev/mcp-app']` | Modern.js 渲染约定，包括版本、输入、组件属性和资源配置 |

例如 `list_todos` 的结果可以是：

```json
{
  "content": [{ "type": "text", "text": "[]" }],
  "structuredContent": { "todos": [] },
  "_meta": {
    "modernjs.dev/mcp-app": {
      "version": 1,
      "args": {},
      "viewProps": { "todos": [] }
    }
  }
}
```

框架生成的元数据还可包含 `tool` 和 `resource`。命名空间由框架保留，`version` 描述内部渲染数据格式，与 MCP 协议版本无关。标准卡片关联仍由工具描述中的 `_meta.ui.resourceUri` 承担。

业务数据与渲染元数据分开保存，避免覆盖同名业务字段，也使 `outputSchema` 只约束业务结果。带 View 的工具同样可以公开 `outputSchema`。`meaningfulContent()` 在缺少内容时提供文本回退，不会将仅用于 UI 的 `viewProps` 自动序列化到文本中。

[withViewProps()](../../packages/toolkit/mcp-apps/src/server.ts) 用来减少重复声明：

<!-- prettier-ignore -->
```ts
return withViewProps({
  content: [{ type: 'text', text: JSON.stringify(todos) }],
  structuredContent: { todos },
})
```

它返回一个同时含业务数据和 `viewProps` 的新结果对象。默认复用业务对象引用，也可以传映射函数来转换组件接口。业务数据不会自动展开成组件属性，显式映射使组件接口与工具输出可以独立演进。

## React 如何消费宿主事件

[react.ts](../../packages/toolkit/mcp-apps/src/react.ts) 的 `useMcpApp()` 包装官方 `useApp()`，在连接握手前注册流式输入、完整输入、结果、取消和销毁事件，并应用宿主样式。

事件交给 [view-result.ts](../../packages/toolkit/mcp-apps/src/view-result.ts) 中的 `reduceMcpToolState()` 处理。新输入清除上一轮结果属性，避免旧结果覆盖当前输入。取消清除当前调用数据，销毁清空状态。已加载的 MF 资源可以跨输入保留。

`readMcpViewResult()` 优先读取版本化元数据，兼容读取旧 structuredContent 和文本中的渲染信息。遇到显式但不支持的元数据版本时，不再尝试将业务内容解释成旧格式。

`mergeMcpViewProps()` 按以下顺序合并，后者覆盖前者：

```text
流式输入 → 完整输入 → 结果 args → viewProps
```

本地入口通过 `createMcpView()` 将合并后的属性和官方 `mcpApp` 实例交给业务组件。组件可以调用 `mcpApp.callServerTool()` 发起后续操作。此方法的返回值应由当前交互代码消费，不能依赖宿主一定再次发送工具结果事件来更新界面。

## Todo 中的状态由谁管理

MCP Apps 提供宿主与卡片的通信和生命周期能力，当前封装没有提供通用业务状态仓库。Todo 的状态分为三层：

| 状态 | 所属位置 | 更新方式 |
| --- | --- | --- |
| 待办事项、标题、完成状态 | 服务端 `server/store.ts` | `add_todo`、`update_todo`、`delete_todo` 修改，`list_todos` 读取 |
| 工具输入、结果、取消状态 | `useMcpApp()` | 处理宿主事件，由 reducer 清理旧调用数据 |
| 筛选、编辑草稿、请求中和错误提示 | `Todos.tsx` | React 本地状态，只影响当前卡片 |

首次展示时，`list_todos` 通过 `withViewProps()` 将数据传给组件。卡片内的修改先调用业务工具，再重新读取列表并更新 React 状态。勾选完成或改回待完成都会写入服务端，分组和统计由最新列表计算。

这体现了“同一组工具既可供模型调用，也可供卡片交互调用”的能力。它不代表跨卡片实时同步：其他卡片需要刷新才能读到变化。示例存储是进程内共享内存，重启会清空，也没有按用户隔离。批量操作由多次工具调用组成，不是事务。

## MF 如何复用同一套运行时

本地 View 在构建时确定组件入口，MF View 使用通用 HTML 容器，收到结果后根据资源配置动态加载远程组件。

[MF 容器](../../packages/toolkit/mcp-apps/src/mf-runtime/mcp-app.tsx) 复用 `useMcpApp()`，因此结果解析、输入、取消和销毁行为与本地路径保持一致。它额外负责显示模式切换，以及将 `moduleFederation` 配置传给远程加载器。

[remote.tsx](../../packages/toolkit/mcp-apps/src/mf-runtime/remote.tsx) 使用 `createInstance()` 创建 MF runtime，按 remote 名称和入口地址缓存实例，并共享 React 及 React DOM singleton。模块身份不变时，参数更新只更新组件属性。

远程视图支持两种模式：`component` 直接渲染 React 组件，`mount` 调用命令式挂载接口，并处理 update 和 unmount。MF 的职责是浏览器组件分发，业务工具执行仍由服务端 handler 负责。

## Inspector 与脚手架

CLI 在开发流程中添加 `/mcp/inspector` 入口，并启动独立来源的预览沙箱。Inspector 使用官方 Client SDK 连接 MCP 服务，使用 AppBridge 扮演宿主，通过跨源沙箱加载 HTML 并传递输入和结果。

Inspector 独立发布为 `@modern-js/mcp-apps-inspector`，由框架插件接入。主要代码位于 [index.tsx](../../packages/toolkit/mcp-apps-inspector/src/index.tsx)、[client.ts](../../packages/toolkit/mcp-apps-inspector/src/client.ts)、[protocol.ts](../../packages/toolkit/mcp-apps-inspector/src/protocol.ts) 和 [sandbox-server.ts](../../packages/toolkit/mcp-apps-inspector/src/sandbox-server.ts)。模拟预览与真实调用共用新的结果约定。Inspector 提供的是本地调试闭环，不能代替真实宿主兼容性验证。

[CLI 模板](../../packages/toolkit/create/templates/mcp-apps/mcp_apps.ts.handlebars) 默认生成四个 Todo 工具：`list_todos` 绑定交互卡片，`add_todo`、`update_todo` 和 `delete_todo` 只返回业务结果。卡片复用这些工具编辑名称、修改完成状态和删除事项。MF 变体复用相同业务，只替换视图来源。

## 协议边界与升级要求

HTTP handler 默认只接受 POST，采用无状态处理。新协议请求交给官方 SDK handler，旧协议请求走无 session ID 的 Streamable HTTP JSON 响应路径。Origin 校验与应用鉴权是不同职责，鉴权由外围中间件或请求上下文创建逻辑承担。

结果 `_meta` 是协议扩展位置，命名空间内的渲染字段属于 Modern.js 约定。宿主需要将结果元数据完整转发给卡片。当前测试覆盖官方 SDK 的 AppBridge 到 App 转发，外部宿主仍需实际验证。

新运行时兼容读取旧格式，新服务端只生成版本化元数据。旧运行时无法读取新结果，因此升级时必须一起重新构建、部署服务端和 UI。自建服务器应通过 `createMcpViewResult()` 生成结果，避免手工拼接过时结构。

## Review 顺序与验证入口

建议先检查 `config.ts → cli.ts → bff-runtime.ts`，确认声明如何进入构建和服务生命周期，再检查 `server.ts → resources.ts → view-result.ts → react.ts`，最后查看 MF 和 Inspector 分支。

重点检查以下边界：

- 业务结果和自定义元数据是否完整保留，outputSchema 是否仅约束业务数据
- 新旧格式解析优先级是否明确，不支持的版本是否被错误解释
- 新输入、取消、销毁是否清除旧状态，两条渲染路径是否一致
- HTML 基址和 CSP 是否覆盖实际静态资源部署方式
- BFF 请求体重建和取消信号传递是否正确
- 服务端与 UI 同步升级要求，以及真实宿主转发元数据的验证是否充分

[view-result.test.ts](../../packages/toolkit/mcp-apps/tests/view-result.test.ts) 覆盖结果隔离、旧格式读取、状态变化、输出校验、Manifest 标识检查及官方 SDK 通知转发。[protocol.test.ts](../../packages/toolkit/mcp-apps/tests/protocol.test.ts) 覆盖能力协商、资源绑定、Origin 校验、开发配置重载、请求头保留和 Hono 错误回调。Inspector 的桥接与沙箱行为由其独立包中的 [protocol.test.ts](../../packages/toolkit/mcp-apps-inspector/tests/protocol.test.ts) 验证。快捷函数行为由 `view-result.test.ts` 覆盖，[类型用例](../../packages/toolkit/mcp-apps/tests/view-props.types.ts) 验证类型推导。

```sh
pnpm --filter @modern-js/mcp-apps test
pnpm --filter @modern-js/mcp-apps-inspector test
pnpm --filter @modern-js/mcp-apps typecheck
pnpm exec tsc -p packages/toolkit/mcp-apps/tests/tsconfig.types.json
pnpm --filter @modern-js/plugin-mcp-apps typecheck
pnpm --filter @modern-js/create test
```

这些检查覆盖协议和类型边界。发布前还应在目标宿主中验证本地与 MF 卡片的实际加载、工具回调、取消和显示模式切换。
