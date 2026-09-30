---
name: modernjs-create-mcp-apps
description: 使用 Modern.js CLI 创建 MCP Apps（应用内 React 卡片或 MF 远程组件）及纯工具 MCP Server，配置工具与视图映射，完成构建、协议验证和 Agent 宿主调试准备。适用于新建项目；已有项目的普通 BFF 等功能启用使用 modernjs-feature-enable。
---

# 创建 Modern.js MCP Apps

## 1. 选择模板与版本

| 用户需求 | CLI 参数 | 生成内容 |
| --- | --- | --- |
| 新建交互卡片，组件随应用维护 | `--template mcp-apps` | MCP 服务、应用内 React 组件、普通应用首页 |
| 复用或独立发布 MF 远程组件 | `--template mcp-apps --mf` | MCP 服务、React 组件和 MF exposes/manifest 配置 |
| 数据查询、计算或业务操作，无 UI | `--template mcp-server` | HTTP MCP 工具服务，无 React 页面或卡片 |

用户未指定架构但要求卡片时，默认应用内组件模式。公网访问、CDN 或 UI 与服务端分别部署都不要求使用 MF。纯 MCP Server 可服务不支持 MCP Apps UI 的 MCP 客户端；当前模板不提供 stdio、Prompts 或通用业务 Resources 的配置入口。

确认目标目录为空或不存在，不覆盖已有项目。Node.js 要求 >=20，沿用用户的包管理器，以下示例使用 pnpm。

**版本前提：** 只有包含新模板、`@modern-js/mcp-apps` 和 `@modern-js/plugin-mcp-apps` 的版本发布后，才能从 registry 完整安装。确认所选 creator 支持 `--template` / `--mf`，且依赖包存在；不要假定 `latest` 已支持，也不要把本地版本号当成已发布证明。使用 CLI 生成的配套依赖，不单独套用外部示例的 SDK 版本。

## 2. 创建项目

### 已发布版本

将 `<version>` 替换为确认支持该功能的发布版本，项目名和模式按用户需求调整：

```sh
pnpm dlx @modern-js/create@<version> my-mcp-app --template mcp-apps
cd my-mcp-app
pnpm install
pnpm dev
```

MF 模式追加 `--mf`；纯工具使用 `--template mcp-server`。`--mf` 只适用于 `mcp-apps`。Monorepo 子项目可加 `--sub`，由宿主工作区管理依赖和 Agent 文件。

### 当前源码仓库、尚未发布时

此分支仅用于 Modern.js 源码仓库，从仓库根目录运行：

```sh
node packages/toolkit/create/bin/run.js examples/my-mcp-app --template mcp-apps --sub
```

CLI 只生成文件，不安装依赖。生成的版本号不会自动指向工作区包：

1. 将项目 `name` 改为合法且唯一的包名，如 `@examples/my-mcp-app`。CLI 当前会将传入的目录参数原样作为名称。
2. 将 dependencies/devDependencies 中实际存在于本仓库的 `@modern-js/*` 包改为 `workspace:*`，保留第三方版本。不要将 `workspace:*` 写入仓库外的独立项目。
3. 从仓库根目录执行 `pnpm install`，按仓库工作流构建所需依赖。
4. 执行 `pnpm --filter @examples/my-mcp-app dev`。若 8080 被占用，可用 `PORT=8081` 指定端口，并同步修改客户端 endpoint。

仓库外使用未发布版本需要正确打包、安装相关本地依赖，不能仅运行 registry 安装就宣称完成。只体验现有实现时可使用 `@examples/mcp-apps-modern`。

## 3. 配置工具与卡片

优先修改生成的示例，不重复实现运行时：

- `modern.config.ts`：`bffPlugin()`、`mcpAppsPlugin()` 和 `bff.prefix: '/mcp'`；MF 模式另有 MF 插件和资源前缀。
- `api/lambda/index.ts`：通过 `mcpApps(definition)` 导出 BFF 路由，提供 `/mcp`。
- `api/mcp_apps.ts`：`defineMcpApps()` 定义 `remotes`、工具名、JSON Schema、handler 和 view；函数本身不启动 HTTP 服务。
- `api/mcp-tools.ts`：服务端业务函数，模板包含 `greet` 和 `addNumbers`。
- `src/components/Greeting.tsx`、`Sum.tsx`：UI 模板的卡片组件。

### 应用内组件

`remotes: []`，工具省略 `remote`，通过相对**项目根目录**的 `view.module` 引用源码：

| 工具 `name` | `handler` | `view.module` |
| --- | --- | --- |
| `greet` | `greet` | `./src/components/Greeting.tsx` |
| `add_numbers` | `addNumbers` | `./src/components/Sum.tsx` |

`view.exportName` 默认 `default`，命名导出需显式配置。插件按工具生成卡片入口与 `ui://local/<tool>` 资源；仅创建组件文件不会注册工具。多个工具可以复用组件，原页面的文件系统路由 layout/loader 不会自动附加到卡片入口。

### MF 组件

`module-federation.config.ts` 的 `exposes` 将 `./Greeting`、`./Sum` 映射到组件文件。工具的 `remote` 匹配 `remotes[].name`，`view.module` 匹配 expose 键（包括大小写和 `./`），不是磁盘路径。模板使用 `mcp_ui`，manifest 地址为 `<origin>/static/mf-manifest.json`。

例如 `greet` 使用 `remote: 'mcp_ui'`、`view: { module: './Greeting' }`。MF 只暴露 UI 模块，不会自动注册工具；业务 handler 仍在服务端执行，无须放进 `exposes`。只使用标准 MF manifest，不添加 `manifestType`、Vmok 配置或另一份 UI manifest。

### 输入和结果

`inputSchema` 校验调用参数；handler 返回 `content`、`structuredContent`，以及可选 `viewProps`。卡片接收工具输入和 `viewProps`（同名属性以后者为准），并注入 `mcpApp`。业务 `structuredContent` 不会自动全部展开成组件 props。`outputSchema` 校验 handler 的业务结果。

卡片再次调用工具使用 `mcpApp.callServerTool({ name: 'add_numbers', arguments: { a: 2, b: 3 } })`，名称是 MCP 工具名。不要在已接收 `mcpApp` 的卡片里另建宿主连接。纯工具省略 `view`；也支持只有 view 的工具，但 handler 和 view 不能同时缺失。

### 卡片交互能力

使用注入的 `mcpApp`（两种 UI 模式一致），按需求选择 SDK 方法：

- `callServerTool({ name, arguments })`：执行指定工具，检查 `isError`、捕获异常，验证 `structuredContent` 结构并自行更新 React 状态；不要依赖再次收到 `ontoolresult`。
- `sendMessage({ role: 'user', content: [{ type: 'text', text }] })`：用户点击后向对话发送后续请求，检查宿主 `message.text` 能力及返回的 `isError`。它不直接返回模型回复，也不保证执行指定工具；不要在渲染或挂载时自动发送消息。
- `updateModelContext({ structuredContent })`：同步当前选择或筛选状态，检查宿主 `updateModelContext.structuredContent` 能力；更新替换此前上下文，不立即触发模型回复。
- `openLink()`、`requestDisplayMode()`、`sendLog()`：按业务需求使用。展示模式先检查 `getHostContext().availableDisplayModes`，采用实际返回的模式；其他能力也需处理宿主拒绝或失败。

连接后用 `getHostCapabilities()` 检查对应能力，未支持的操作提供禁用或替代行为。仅实现用户需要的交互，不给每张卡片默认添加全部能力。详见 [卡片交互](https://modernjs.dev/guides/advanced-features/mcp-apps/interactions)。

## 4. 启动与验证

按层验证并分别报告结果：

1. **开发与构建**：启动 `pnpm dev`；验证生产产物用 `pnpm build` 和 `pnpm serve`。不要让 dev 与 serve 争用端口。
2. **协议和工具**：保持服务运行，在另一个终端执行 `pnpm verify:mcp http://localhost:8080/mcp`。模板脚本验证 `server/discover`、`tools/list`、两个工具的结果和已声明 UI 资源读取，成功输出 `PASS`。修改工具后同步调整脚本断言，不要用旧示例断言测试新业务。
3. **UI 资源**：脚本通过 `_meta.ui.resourceUri` 执行 `resources/read`，检查 `text/html;profile=mcp-app` 与脚本引用。MF 模式另查 manifest、remote entry 和组件 JS/CSS 的可访问性，最终加载结果以宿主验证为准。
4. **真实宿主**：在支持 MCP Apps 的宿主中触发工具，检查卡片显示，再操作卡片调用工具并确认结果更新。纯 Server 验证工具结果即可。

当前验证脚本采用 MCP `2026-07-28` 的每请求版本/能力元数据和请求头；服务端也保留旧协议初始化握手的兼容路径。手动调试优先使用 MCP 客户端或生成脚本，避免手写缺少请求头的 JSON-RPC 请求。

区分启动地址：`/` 是 UI 模板的普通首页；`/mcp-ui-<hash>` 是应用内组件入口，脱离宿主可能停留在 `Connecting…`；`/mcp` 才是客户端连接地址，浏览器 GET 返回 405 是预期行为。`ui://...` 是协议资源标识，不是浏览器 URL。`Local` 与 `Network` 是同一服务的不同访问地址；MF 和纯 Server 不生成应用内组件入口，纯 Server 也没有首页。

协议脚本不会执行卡片 JavaScript。没有可用宿主时明确报告“卡片交互待验证”，不要将首页可访问或协议 PASS 当作完整 UI 验证。

## 5. 宿主调试与部署

远程宿主需能访问 HTTPS MCP endpoint 及卡片依赖的资源。按用户选择使用部署环境或隧道，连接地址为 `https://<公开域名>/mcp`。ChatGPT 的公网暴露和接入操作参考 [OpenAI 官方指南](https://developers.openai.com/plugins/build/app-quickstart#expose-your-server-to-the-public-internet)，修改工具元数据后刷新宿主连接。仅为生成项目不必自动创建公网隧道。

- **应用内组件**：HTML 位于 `dist/mcp-apps/ui/`，同时部署应用静态资源；单独托管资源时配置 `dev.assetPrefix` / `output.assetPrefix`。`view.html` 可指定独立 HTTPS HTML 地址，由服务端读取；通过 `view.csp` 声明资源权限。
- **MF**：将 `MCP_UI_ORIGIN` 设置为公开 UI origin（不含 `/mcp` 或 manifest 路径），开发启动或生产构建/启动均使用对应值。模板追加 `/static/mf-manifest.json`。检查 manifest 的资源路径、CORS 和 `remotes[].csp`，域名变化时同步更新。
- **应用部署**：`pnpm deploy` 生成可迁移的 `.output/`，通过 `node .output/index.js` 启动；此命令不等于已上传云平台。
- **独立 Hono 服务**：加载应用编译后的 definition 和 handler，使用 `@modern-js/mcp-apps/hono` 的 `mcpApps({ definition })` 挂载。应用内组件还需用 `@modern-js/mcp-apps/server` 的 `bindUiResources(definition, { directory, assetBase })` 绑定复制后的 HTML 目录和公开资源基址。`dist/mcp-apps/` 只有 UI 资源，不包含 `dist/api/` 的服务端定义及全部业务依赖，不能只复制它就宣称可独立运行。`configPath` 方案指向应用编译后的配置模块文件，不是产物目录；该适配器不编译源码、不启动监听器。

鉴权通过应用中间件处理。浏览器跨域调用需按实际来源配置 `allowedOrigins` 和应用 CORS；这与卡片资源 CSP 是不同配置。隧道若返回提示 HTML 而不是 manifest JSON，应检查浏览器实际响应，不能只凭 HTTP 200 判断成功。

交付说明项目目录、模板、启动命令、MCP endpoint、已验证范围，以及是否依赖本地进程/隧道。协议、类型及部署细节查 [Modern.js MCP Apps 文档](https://modernjs.dev/guides/advanced-features/mcp-apps/)。
