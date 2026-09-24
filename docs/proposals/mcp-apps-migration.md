# MCP Apps 迁入 Modern.js 的方案与进度

- 状态：P0 核心、P1 Modern.js 集成、P2 创建模板已实现；内部 Vmok 与目标产品宿主验收仍待进行。
- 日期：2026-09-22。
- 分支：`docs/mcp-apps-migration-plan`。
- 来源：Fancy commit `6fde5254d48edcc861edce4aadc92f96ffa6864c`。
- 本轮原则：能复用 Fancy 的尽量复用；保留独立部署，不引入 DevTools。

## 1. 已确认目标

1. `api/mcp_apps.ts` 是应用定义入口，沿用 `remotes + tools + handler/view`。
2. MCP Server/BFF 与 UI 可以分仓、分别构建部署，服务端不要求 UI 源码在场。
3. 一体化是上层便利封装，不是服务端的运行前提。
4. 不迁入 Fancy DevTools、Platform、隧道或内部部署管理功能。
5. 后续 Modern.js 插件统一接入 `modern dev/build/serve`，不另启 Fancy CLI。
6. 不启用插件的普通 Modern.js 项目不受影响。

此前 P0 使用自定义 `ui-manifest.json` 的设计已撤销。UI 使用 MF/Vmok 原有
构建产物；不增加要求用户生成、复制或维护的第二份 UI 清单。

## 2. 配置与运行链路

```text
服务端项目                         独立 UI 项目
api/mcp_apps.ts                        MF/Vmok exposes
  remotes                          ./Greeting → React 组件
  tools                              ↓ 构建、发布
    handler → ./tools.ts           mf-manifest.json / vmok-manifest.json
    view → ./Greeting              remote entry + JS/CSS chunks
        │                              ↑
        ↓                              │
MCP Server → Tool 结果 + ui://资源 → 宿主 iframe 中的 Fancy 远程渲染器
```

`api/mcp_apps.ts` 只属于服务端定义，不将 handler 路径或实现导入前端构建。
服务端通过 `remote.baseUrl/browserEntry` 引用已发布的组件；浏览器在宿主
iframe 中加载 manifest。服务端不下载 UI 源码，也不要求复制 manifest 文件。

最小定义见 [示例 api/mcp_apps.ts](../../examples/mcp-apps-modern/api/mcp_apps.ts)。

## 3. 复用清单与边界

| Fancy 来源 | 本轮处理 |
| --- | --- |
| `server/config.ts` 的 `defineMcpApps` | 复用轻量 identity helper |
| `server/mcp-apps.ts` 配置类型及 normalizeToolConfig | 迁移，保留 remote、handler、view 和旧顶层 view 字段 |
| 本地配置/handler 模块解析、TS 转 ESM | 迁移；已编译 JS 直接加载，失败缓存允许重试 |
| `createMcpAppsViewResource`、静态结果、结果合并 | 迁移，保留 `tool/resource/args/viewProps` 结果约定 |
| 远程级和 Tool 级 `ui://mf/` 资源 | 保留 URI 规则，增加冲突检测 |
| MF/Vmok loader、snapshot、公用 React 配置 | 迁移原有浏览器实现；没有内部 npm 强依赖 |
| component/mount 渲染、ErrorBoundary、样式 | 迁移，补齐 viewProps 实际传递 |
| runtime HTML 的内联构建 | 沿用，随核心包发布，无须业务项目另管渲染器资源 |
| Vmok manifest 安全转换测试 | 迁移到 rstest |
| vmok-server handler loader | 保留可选加载和自定义 loader 接口，不强装内部依赖 |
| Express 启动层、DevTools、Fancy CLI | 不迁移 |

继续保留第一轮已验证的改进：

- 官方无状态 HTTP transport，每请求独立实例，可适配 Node/Hono。
- 严格 JSON Schema 校验，避免原实现转换过程丢失约束。
- annotations 按工具声明，不将写操作强制标成只读。
- handler 超时、HTTP abort、每请求业务上下文隔离。
- 纯 handler 工具允许省略 remote，使用 `remotes: []`。

来源和修改记录见 [NOTICE](../../packages/toolkit/mcp-apps/NOTICE.md)，源仓库
许可证原文保留于 [THIRD-PARTY-LICENSE](../../packages/toolkit/mcp-apps/THIRD-PARTY-LICENSE)。

## 4. 包结构

已实现：`packages/toolkit/mcp-apps` → `@modern-js/mcp-apps`。

| 子路径 | 职责 |
| --- | --- |
| `/config` | Fancy 兼容定义类型和 defineMcpApps |
| `/server` | 配置加载、Tool/Resource 注册、HTTP handler、结果绑定 |
| `/react` | React 通信辅助和 App 类型，供自己拥有宿主连接的视图使用 |
| 包内 runtime HTML | 复用的 MF/Vmok 远程渲染器，运行在宿主 iframe |

已由远程渲染器加载的组件使用注入的 `mcpApp`，不能再调用 useApp/useMcpApp
创建第二条宿主连接。Node 服务端不执行浏览器 React 代码。

已实现：`packages/cli/plugin-mcp-apps` → `@modern-js/plugin-mcp-apps`。
它负责 Modern.js 工程集成，不反向成为核心包的运行依赖。

## 5. 独立部署

### 服务端

编译并部署启动文件、`api/mcp_apps.ts` 和它引用的 handler，保留相对路径。
示例构建生成 `index.mjs`、`mcp_apps.mjs`、`tools.mjs`。

- `createMcpAppsHandler({ configPath })` 加载定义。
- `createMcpHandler(definition, options)` 用于已经加载定义的调用方。
- 运行时仅需这些服务端产物和生产依赖，不要求 UI 工程、app-tools 或 React 安装。
- handler 可以直接执行业务逻辑，也可以请求独立部署的 BFF/API。
- 原型支持独立 Node HTTP 服务，不承诺 Edge/特定 Serverless 平台。

### UI

使用已有 MF/Vmok 工具构建 exposes，发布其原有 manifest、remote entry、chunks。
`api/mcp_apps.ts` 指向不可变版本 URL，CSP 配置实际脚本、样式和网络访问域名。
UI 与服务端可以独立发布；切换远程版本是修改服务端配置，不是复制 UI 工程。

## 6. 兼容说明

- 标准 MF 项目明确设置 `manifestType: 'mf'`；省略时保留 Fancy 的 vmok 默认值。
- view 支持 `module/exportName/renderMode/runtime`；handler 支持
  `module/exportName/runtime/timeoutMs`，相对路径以定义文件目录为基准。
- 支持 view-only、handler-only 和组合工具；旧顶层 module/exportName/renderMode
  继续被 normalize 成 view。
- 保留 `content`、业务 `structuredContent`、`_meta` 和 viewProps。与 Fancy 一致，
  视图工具的 structuredContent 会附加渲染信息。
- 新增 outputSchema 校验业务 structuredContent；视图工具不向宿主声明会与附加
  envelope 冲突的 outputSchema，纯 handler 工具正常发布它。
- CSP、permissions、domain、prefersBorder 从可信服务端定义透传。visibility 是宿主
  提示，不是服务端权限控制；鉴权与 Origin/Host 策略由 HTTP 中间件处理。
- 不开放请求参数指定任意远程配置的能力。本轮只加载可信本地 TS/JS/JSON 定义。
- vmok-server 需可选 `@vmok/kit` 或 loadRemoteHandler 注入；未强装内部包。
- Vmok 浏览器代码已迁移，其原有 CN region 静态 publicPath 转换限制仍在。
  内部 Vmok 环境不因迁入源码就自动算作部署验证通过。
- 本轮仍是无状态 POST 模式；持久会话、恢复 SSE、跨请求取消不是已实现能力。

## 7. Modern.js 集成（已实现）

采用 CLI 编译插件 + BFF API 路由：

- 配置在 `api/mcp_apps.ts`，工具函数通过普通 import 引入并直接赋给 `handler`。
- BFF 路由静态导入 definition 并调用 `mcpApps(definition)`，由 BFF 的 TypeScript 编译、监听、重载和部署依赖追踪统一管理。
- 已删除独立 MCP 编译器、生成配置包装程序、handler 文件名映射和 MCP 专用源码 watcher。
- UI 插件注册标准 Modern.js 自动挂载入口，执行逻辑在普通源码中的 `createMcpView`；生成入口仅包含导入和调用。
- `bindUiResources` 是普通 TypeScript 资源关联函数，不生成 JavaScript、不重写 handler。
- UI HTML 保留在 `dist/mcp-apps/ui/`，服务端产物在 `dist/api/`，JS/CSS 使用标准应用产物路径。
- MF 通用渲染器作为包资源由标准部署依赖处理保留；BFF 不新增 Web Server MCP 路由。


源码依据：

- [BFF CLI 插件](../../packages/cli/plugin-bff/src/cli.ts)：官方插件注册服务端入口的模式。
- [serverBase](../../packages/server/core/src/serverBase.ts)：等待 onPrepare 后挂载中间件。
- [生产入口生成](../../packages/solutions/app-tools/src/plugins/deploy/utils/generator.ts)：serverPlugins 导入。
- [serverBuild](../../packages/solutions/app-tools/src/plugins/serverBuild.ts)：现有编译目录/触发条件。
- [服务端 watcher](../../packages/server/server/src/helpers/index.ts)：默认监听不自动覆盖根配置。

## 8. 实施阶段

| 阶段 | 内容 | 验收 |
| --- | --- | --- |
| P0：核心原型 | 本轮修正为 Fancy 定义 + 远程渲染复用 | 独立 Server、独立 MF UI、完整工具交互；目标产品宿主另验 |
| P1：Modern.js 集成（完成） | CLI/Server 插件、配置编译与监听 | dev/build/serve、BFF 共存和系统临时目录中的 .output 启动通过 |
| P2：创建体验（完成） | mcp-apps / mcp-server 模板、已有项目接入、中英文文档 | 从创建器生成的项目通过整链路验证；发布包生成模板通过，默认模板不变 |
| P3：扩展验收 | 内部 Vmok 部署、更多宿主及高级 API | 按明确矩阵逐项验证 |

脚手架已扩展现有 @modern-js/create 的 --template 选项；不搬回 Fancy CLI，也不恢复 v3 已移除的
modern new。用户向自动化放根 skills，维护者流程遵循仓库约定。

## 9. 验证方式和记录

参见 [核心包 README](../../packages/toolkit/mcp-apps/README.md)、
[Hono 接入文档](../../packages/toolkit/mcp-apps/README.md#default-local-view-and-hono)、
[UI 示例](../../examples/mcp-apps-modern/README.md)。

```sh
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @examples/mcp-apps-modern build
pnpm --filter @modern-js/mcp-apps test
pnpm --filter @modern-js/mcp-apps test:deployment
```

浏览器测试：分别启动两个示例和 `scripts/browser-fixture.mjs`，访问 8092，检查
初始数据展示和按钮调用。该测试宿主使用官方 AppBridge，不是迁入 DevTools。

本轮验证记录（2026-09-22）：

- 25 项协议、配置加载和复用的 Vmok manifest 测试通过。
- 核心与两个独立示例构建、TypeScript 检查通过。
- 变更文件 Biome、依赖版本一致性、package.json 校验通过。
- 打包后在临时目录安装纯生产依赖，ESM/CJS 入口均可加载已编译定义，完成
  工具调用与内联资源读取；没有安装 React、app-tools 或 Fancy，也没有复制 UI 文件。
- Chrome 官方 AppBridge 测试宿主中，iframe 实际请求独立服务的 mf-manifest.json、
  remote entry、组件 JS/CSS，显示初始 `Hello, Ada!`；点击按钮后显示
  `Hello, Modern.js!`，确认经宿主调用服务端成功。
- 上述验证对应修正后的远程渲染实现，不沿用上一轮自定义 UI manifest 的结果。

目标产品宿主、内部 Vmok 部署尚未验收。P1/P2 本地验收记录见下。

## 10. P1/P2 交付与本地验证

- [插件说明](../../packages/cli/plugin-mcp-apps/README.md)。
- [可直接运行的一体化示例](../../examples/mcp-apps-modern/README.md)。
- [中文接入文档](../../packages/document/docs/zh/guides/advanced-features/mcp-apps.mdx)。
- [英文接入文档](../../packages/document/docs/en/guides/advanced-features/mcp-apps.mdx)。

新增模板：`--template mcp-apps` 创建 UI + Server；`--template mcp-server` 创建不含
UI 的服务端。核心/插件尚未发布，当前在仓库里验证应使用 workspace 示例，不依赖
公共 npm 已存在这些新包。

```sh
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @modern-js/plugin-mcp-apps build
pnpm --filter @examples/mcp-apps-modern dev
```

页面为 http://localhost:8080，MCP 端点为 /mcp。另开终端运行测试宿主：

```sh
MCP_ENDPOINT=http://127.0.0.1:8080/mcp node packages/toolkit/mcp-apps/scripts/browser-fixture.mjs
```

访问 http://127.0.0.1:8092 验证组件与按钮。生产验证需先停止 dev，再运行示例的
build 和 serve。

验证覆盖：

- 核心 29 项、Server 插件 3 项、创建器 27 项、真实 CLI 2 项测试。
- 配置/handler 重载、输入校验、开发/生产 React 产物选择、请求上下文隔离。
- 普通页面与 BFF 共存、POST 请求流适配、纯服务端无 UI 项目运行。
- build 后修改源码不影响 serve；.output 复制到系统临时目录、删除原项目后独立启动。
- npm pack 后的核心服务端隔离安装，以及创建器脱离源码目录生成模板。
- 中英文文档站构建通过。
- Chrome 官方 SDK 测试宿主中，Modern.js dev 和 build/serve 两种模式均实际渲染
  远程 Greeting 组件；点击按钮后从 Hello, Ada! 更新为 Hello, Modern.js!。
- UI 模板生产 /static/* CORS 断言通过；MCP 接口不使用该公共资源 CORS 中间件。

部署产物中的 mcp-apps 目录是服务端编译产物，不是新增的 UI 配置格式；用户仍然
只编写 api/mcp_apps.ts，UI 仍通过 MF/Vmok 原有 manifest 关联。

## 11. HTTPS / ngrok 宿主验证

示例新增 `preview:ngrok`：读取本机 ngrok agent 的 HTTPS 地址，再用同一个
MCP_UI_ORIGIN 构建和启动生产预览。开发配置也显式设置 dev.assetPrefix，防止
remote URL 已改 HTTPS、manifest publicPath 却仍指向 localhost。

已验证 HTTPS MCP POST、manifest 的 HTTPS publicPath 和资源 CSP；浏览器端遇到
ngrok 免费端点返回的提示页 HTML。因此当前免费域名的真实卡片渲染尚未验收，
需要无提示页的 ngrok 端点或独立 HTTPS UI 静态地址。

桌面豆包日志还显示 connect-src https: wss: 与 connect-src 'none'。前者需要 HTTPS，
后者需要宿主实际采用资源 CSP；不能把更换 URL 等同于已经解决所有宿主策略。


## 当前实现调整：默认本地 UI，MF 可选

`--template mcp-apps` 默认创建标准 Modern.js 应用和本地 React 卡片；
`--mf` 才添加 MF 配置与依赖。独立 Rsbuild UI 示例已合并回 Modern.js 示例。
本地 view 注册为标准 Modern.js 自动挂载入口，HTML 与 JS/CSS 分离输出；
资源 HTML 副本放在 `dist/mcp-apps/ui/`，静态资源需与服务一同部署或设置 CDN。
也支持通过 `view.html` 引用独立 HTTPS HTML。Hono 适配器位于 `@modern-js/mcp-apps/hono`，Modern.js 插件
复用它；独立部署通过测试 fixture 验证，接入方式在文档中说明，不再维护单独的 Server 示例项目。
