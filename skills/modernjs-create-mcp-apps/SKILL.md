---
name: modernjs-create-mcp-apps
description: 使用 Modern.js CLI 创建带交互式 React UI 的 MCP Apps 应用或独立 MCP Server，完成本地启动、协议验证和真实宿主验证准备。适用于新建项目；已有项目的普通 BFF 等功能启用使用 modernjs-feature-enable。
---

# 创建 Modern.js MCP Apps

## 1. 选择模板与版本

- 需要在 MCP 宿主中显示交互卡片：`--template mcp-apps`，标准 Modern.js 应用，增加本地 React 卡片、`mcp_apps.ts` 和 MCP 插件；默认无 MF 依赖。
- 用户明确需要远程组件/MF 时，再加 `--mf`：`--template mcp-apps --mf`。普通应用仍使用默认 app 模板。
- 只需要后端工具：`--template mcp-server`，不生成 UI，也不依赖 React 应用；以后可配置独立部署的 remote。
- 用户未指定架构但要求 MCP Apps 卡片时，默认 `mcp-apps`。这不要求生产环境将 UI 和 Server 部署在一起。

确认目标目录为空或不存在，不覆盖已有项目。Node.js 要求 >=20。沿用用户的包管理器，以下示例使用 pnpm。

**版本前提：** 本 skill 随 MCP Apps 实现一起开发。只有包含新模板、`@modern-js/mcp-apps` 和 `@modern-js/plugin-mcp-apps` 的版本发布后，才能从 registry 完整安装。不要假定 `latest` 已支持，也不要把本地包的版本号当成已发布证明。

## 2. 创建项目

### 已发布版本

将 `<version>` 替换为确认包含这三个包的发布版本：

```sh
pnpm dlx @modern-js/create@<version> my-mcp-app --template mcp-apps
cd my-mcp-app
pnpm install
pnpm dev
```

纯 Server 使用同一命令，将项目名改为 `my-mcp-server`、模板改为 `mcp-server`。Monorepo 子项目可加 `--sub`，由宿主工作区管理依赖和 Agent 文件。

### 当前源码仓库、尚未发布时

从 Modern.js 仓库根目录使用本地 CLI：

```sh
node packages/toolkit/create/bin/run.js examples/my-mcp-app --template mcp-apps --sub
```

CLI 只生成文件，不安装依赖。生成的 `package.json` 默认写入 creator 的版本号，**不会自动引用本地工作区包**。在仓库内运行时：

1. 将生成项目的 `name` 改为合法且唯一的包名，例如 `@examples/my-mcp-app`（CLI 当前会把传入的目录参数原样作为名称）。
2. 将 dependencies/devDependencies 中在本仓库存在的 `@modern-js/*` 包改为 `workspace:*`，保留 React、Module Federation 等第三方版本。不要将 `workspace:*` 写入仓库外的独立项目。
3. 从仓库根目录执行 `pnpm install`。本地依赖尚未构建时，按仓库工作流构建所需依赖。
4. 执行 `pnpm --filter @examples/my-mcp-app dev`。若 8080 已占用，使用 `PORT=8081 pnpm --filter @examples/my-mcp-app dev`，并同步修改客户端 endpoint。

仓库外试用未发布版本时，需要本地打包并正确安装相关依赖；不能只运行公开 registry 的 `pnpm install` 就宣称完成。只想体验时可直接运行仓库里的 `@examples/mcp-apps-modern`。

## 3. 定义工具与 UI

- `mcp_apps.ts`：工具名、JSON Schema、handler、remote 和 view 的对应关系；不另建 `ui-manifest.json`。
- `mcp/tools.ts`：工具处理函数。
- UI 模板的 `src/components/Greeting.tsx`：卡片组件。默认 `view.module` 指向本地源码，构建为自包含 HTML；仅 MF 模式生成 `module-federation.config.ts` 并暴露 `./Greeting`。
- `modern.config.ts`：CLI 插件和服务端口；仅 MF 模式还有 MF 插件和资源前缀。

优先修改已生成的示例，不重复手写整套运行时。`mcp-server` 初始只有文本工具，没有卡片属于预期行为。

## 4. 验证

按层验证并分别报告结果：

1. **构建/启动**：`pnpm build`，然后 `pnpm serve`。不要同时让 dev 和 serve 争用同一端口。
2. **MCP 协议**：用支持 Streamable HTTP 的 MCP 客户端连接 `http://localhost:8080/mcp`，完成 initialize、tools/list、tools/call，确认 `greet` 返回问候语。浏览器直接 GET `/mcp` 返回 405 是预期行为；首页正常也不代表 MCP Apps 已验证。
3. **UI 资源**：默认模式通过 tools/list 的 `_meta.ui.resourceUri` 执行 resources/read，确认返回包含卡片脚本的 HTML。MF 模式额外检查 `/static/mf-manifest.json`、publicPath 对应 JS/CSS 和跨域响应。
4. **真实 MCP Apps 宿主**：调用 greet，确认卡片显示；修改名字并点击按钮，确认卡片内容更新。仅工具文本调用成功不能算卡片验证通过。

没有可用宿主时如实报告协议/构建已验证、卡片交互待验证，不把普通首页当宿主。

## 5. HTTPS 与独立部署

默认卡片随 `dist/mcp-apps/` 生成自包含 HTML，宿主无需再请求 MF manifest。
可将整个产物目录复制到独立 Hono 服务，并使用 `@modern-js/mcp-apps/hono` 的
`mcpApps({ configPath })` 挂载 `/mcp`，不需要另一份 UI 项目。鉴权由应用中间件提供。
若单独托管 HTML，可通过本地 view 的 `html` 字段指定 HTTPS 地址（由 Server 获取），
额外网络权限在 `view.csp` 中声明。默认本地视图使用 esbuild 打包 JSX/TSX 和 CSS，
不自动继承 Modern.js CSS 预处理器等扩展；MF 模式使用应用的 MF 构建链路。

**以下资源 origin 配置仅适用于 MF 模式**：在要求 HTTPS 的宿主中，设置 `MCP_UI_ORIGIN` 为实际 UI 资源 origin。UI 构建与 MCP 服务启动均需正确设置：

```sh
MCP_UI_ORIGIN=https://<ui-domain> pnpm build
MCP_UI_ORIGIN=https://<ui-domain> pnpm serve
```

这是 origin，不是 manifest 完整 URL；模板追加 `/static/mf-manifest.json`。上传时保持构建产物目录与 manifest 的 publicPath 一致。为公开静态资源配置 CORS，并确认 MCP resource 的 CSP 声明包含该 origin。宿主额外施加的限制也必须满足。

UI 可以放在独立 HTTPS 静态服务，Server 可以独立运行。`pnpm deploy` 生成可迁移的 `.output/`，随后可用 `node .output/index.js` 启动；该命令本身不等于已上传到云平台。纯 Server 要展示 UI 时，需要添加 remotes 与 tool view 配置，仅设置环境变量不足以产生卡片。

ngrok 可转发本地 MCP 服务，但免费端点可能向浏览器返回 HTML 提示页，使 manifest JSON 解析失败。用浏览器验证实际响应；不要仅凭 curl 200 判定 UI 可用。可将 UI 放到无提示页的 HTTPS 静态服务，并保留 MCP 隧道。部署平台按用户选择，skill 不绑定 Goofy 或个人域名。

交付时说明项目目录、模板、启动命令、MCP endpoint、已验证范围，以及是否仍依赖本地进程/隧道。
