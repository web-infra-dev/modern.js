# MCP Apps 接入、部署与 ngrok 调试指南

本文对应当前仓库实现。新模板与包尚未发布到公开 registry；下文 `<version>` 必须替换为包含 MCP Apps 的实际发布版本，不能直接假定 `latest` 可用。Node.js 要求 >=20。

## 两个包分别负责什么

| 包 | 职责 | 适用场景 |
| --- | --- | --- |
| `@modern-js/mcp-apps` | MCP 协议、工具执行、卡片资源、配置与构建 API、Hono 适配器 | 自建 Hono 服务，或直接使用框架无关的核心能力 |
| `@modern-js/plugin-mcp-apps` | 接入 Modern.js 的 dev/build/serve，处理源码监听、产物生成和 `/mcp` 路由注册 | 使用 Modern.js 开发 MCP Apps |

选择方式：

- **Modern.js 项目**：安装两个包，在 `modern.config.ts` 中配置 `mcpAppsPlugin()`，由框架完成构建和服务集成。
- **自己的 Hono 项目**：只安装核心包 `@modern-js/mcp-apps`，通过 `@modern-js/mcp-apps/hono` 的 `mcpApps()` 挂载服务；Hono 和 HTTP listener 依赖由应用自行安装。
- **其他 HTTP 框架**：使用 `@modern-js/mcp-apps/server` 提供的 Web Request/Response handler，自行适配请求和响应。

两个包是上下层关系，不是两套 MCP 实现：Modern.js 插件复用核心包的 Hono 适配器。脱离 Modern.js 时，用户自行负责构建、产物路径、监听端口和进程生命周期；需要构建 MCP 产物时可调用核心包的 `/build` API。

## 选择接入方式

| 场景 | 入口 | UI 与服务端如何运行 |
| --- | --- | --- |
| 新建普通应用 | 默认 Modern.js 模板 | 不启用 MCP Apps |
| 新建带卡片的 MCP Apps | `--template mcp-apps` | 默认本地 React 卡片，无 MF |
| 已有 Modern.js 项目 | `mcpAppsPlugin()` | 在现有 Web Server 挂载 `/mcp` |
| 只提供工具，不需要卡片 | `--template mcp-server` | Modern.js 服务端项目，无 UI |
| 已有 Hono 服务或独立部署 | `@modern-js/mcp-apps/hono` | 用户自己的 Hono 服务加载 MCP 产物 |
| 需要 MF 远程组件 | `--template mcp-apps --mf` | UI 静态资源可单独部署 |

`mcp-server` 是 CLI 模板名称，不是要求用户复制的示例项目。仓库唯一业务 demo 是 `examples/mcp-apps-modern`。

## 1. 在当前仓库试用

从仓库根目录运行；依赖需已按仓库流程安装、构建：

```bash
pnpm --filter @modern-js/mcp-apps build
pnpm --filter @modern-js/plugin-mcp-apps build
pnpm --filter @examples/mcp-apps-modern dev
```

页面为 `http://localhost:8080`，MCP endpoint 为 `http://localhost:8080/mcp`。

创建新的源码试用项目：

```bash
node packages/toolkit/create/bin/run.js examples/my-mcp-app --template mcp-apps --sub
# MF 模式在末尾增加 --mf；纯工具项目将模板替换为 mcp-server。
```

当前 CLI 将目录参数原样写入 package name，需将生成的 `package.json` 的 `name` 改为合法名称，如 `@examples/my-mcp-app`。将该项目依赖中本仓库已有的 `@modern-js/*` 版本改为 `workspace:*`，保留第三方依赖版本，再执行：

```bash
pnpm install
PORT=8081 pnpm --filter @examples/my-mcp-app dev
```

生成器不自动安装依赖。仓库外项目不能使用 `workspace:*`，未发布时应安装本地打包产物及相关依赖。

## 2. 新建 Modern.js MCP Apps

以下创建和安装命令用于包含新功能的已发布版本：

```bash
pnpm dlx @modern-js/create@<version> my-app --template mcp-apps
cd my-app
pnpm install
pnpm dev
```

这是标准 Modern.js 项目，额外生成：

| 文件 | 作用 |
| --- | --- |
| `modern.config.ts` | 启用 `mcpAppsPlugin()` |
| `mcp_apps.ts` | 定义工具、输入 schema、handler 和 view |
| `mcp/tools.ts` | 在服务端执行的工具业务逻辑 |
| `src/components/Greeting.tsx` | 宿主中展示的 React 卡片 |

默认没有 MF 插件或 manifest。`api/lambda/index.ts` 声明 BFF MCP 入口；
`mcp/tools.ts` 由配置显式引用，只经过 MCP 编译，不会生成独立 HTTP 接口。
模板启用 `bffPlugin()` 和 `mcpAppsPlugin()`，并包含 BFF 开发所需的 `ts-node`。

调用关系：

```text
Agent → Modern.js Web Server 的 /mcp → handler → 工具结果
宿主 → resources/read → 卡片 HTML → React 卡片
卡片 → mcpApp.callServerTool() → 宿主 → /mcp
```

`content` 是工具文本结果，`structuredContent` 是结构化业务数据，`viewProps` 作为属性传给卡片。卡片通过传入的 `mcpApp` 与宿主通信，不再创建第二个宿主连接。

## 3. 接入已有 Modern.js 项目

安装与应用 app-tools 匹配的已发布版本，放入生产 dependencies：

```bash
pnpm add @modern-js/mcp-apps@<version> @modern-js/plugin-mcp-apps@<version> @modern-js/plugin-bff@<version>
pnpm add -D ts-node@^10.9.2
```

保留原配置并追加插件：

```ts
// modern.config.ts
import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { mcpAppsPlugin } from '@modern-js/plugin-mcp-apps';

export default defineConfig({
  bff: { prefix: "/mcp" },
  plugins: [appTools(), bffPlugin(), mcpAppsPlugin()],
});
```

```ts
// api/lambda/index.ts
import { mcpApps } from '@modern-js/plugin-mcp-apps/bff';

export const { POST, GET, DELETE, PUT, PATCH, OPTIONS } = mcpApps();
```

下面是一套可配合使用的最小定义、handler 和卡片：

```ts
// mcp_apps.ts
import { defineMcpApps } from '@modern-js/mcp-apps/config';

export default defineMcpApps({
  remotes: [],
  tools: [{
    name: 'greet',
    description: 'Greet someone with an interactive card.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', minLength: 1 } },
      required: ['name'],
    },
    handler: { module: './mcp/tools', exportName: 'greet' },
    view: { module: './src/components/Greeting.tsx' },
  }],
});
```

```ts
// mcp/tools.ts
import type { RemoteToolHandler } from '@modern-js/mcp-apps/config';

export const greet: RemoteToolHandler = input => {
  const { name } = input as { name: string };
  const message = `Hello, ${name}!`;
  return {
    content: [{ type: 'text', text: message }],
    structuredContent: { message },
    viewProps: { message },
  };
};
```

```tsx
// src/components/Greeting.tsx
import type { App } from '@modern-js/mcp-apps/react';
import { useState } from 'react';

export default function Greeting({ message, mcpApp }: {
  message?: string;
  mcpApp?: App;
}) {
  const [updated, setUpdated] = useState<string>();
  const [pending, setPending] = useState(false);
  return <section>
    <h1>{updated ?? message}</h1>
    <button disabled={!mcpApp || pending} onClick={async () => {
      if (!mcpApp) return;
      setPending(true);
      try {
        const result = await mcpApp.callServerTool({
          name: 'greet', arguments: { name: 'Modern.js' },
        });
        setUpdated(result.isError ? 'Greeting failed' : String(result.structuredContent?.message ?? ''));
      } catch {
        setUpdated('Greeting failed');
      } finally {
        setPending(false);
      }
    }}>Greet again</button>
  </section>;
}
```

将 `mcp_apps.ts`、`api` 和 `mcp` 加入已有 tsconfig 的 include。MCP 路由由 `api/lambda/index.ts` 和 `bff.prefix` 决定。`serverInfo` 在 `mcpApps({ serverInfo })` 中配置。

已有 BFF 应保留原 `bff.prefix`，例如 `/api` 下添加 `api/lambda/mcp.ts` 后，入口为 `/api/mcp`。不要重复注册 bffPlugin。鉴权放在 BFF 路由之前；handler 的 `context.context` 是当前请求的 Hono Context。

## 4. 只需要 MCP 工具

```bash
pnpm dlx @modern-js/create@<version> my-server --template mcp-server
cd my-server
pnpm install
pnpm dev
```

该模板使用 Modern.js 管理服务，包含定义与 handler，不生成 UI。已有配置也可以省略工具的 `view`、保留 `remotes: []`。工具只返回文本/结构化数据时，宿主不显示卡片属于预期行为。

## 5. 一体化生产部署

在应用目录：

```bash
pnpm build
pnpm serve
```

`build` 编译页面以及 `dist/mcp-apps/` 中的 MCP 定义、handler 和本地卡片 HTML；`serve` 读取生产产物，不直接运行源文件。

也可生成可搬迁的部署目录：

```bash
pnpm deploy
node .output/index.js
```

`deploy` 是生成产物，不等于已上传到云平台。发布 `.output/` 后，由目标环境提供进程管理、HTTPS 和访问策略。

## 6. 在自己的 Hono 服务中独立部署

运行时不需要 Modern.js CLI 插件或 app-tools。先构建 UI 应用，再将整个 `dist/mcp-apps/` 复制到 Hono 项目，保留内部目录结构：

```text
my-hono-server/
├── server.mjs
└── mcp-apps/
    ├── mcp_apps.mjs
    └── …生成的定义、handler、卡片 HTML 等文件
```

安装依赖；handler 用到的数据库 SDK 等外部包也需安装：

```bash
pnpm add hono @hono/node-server @modern-js/mcp-apps@<version>
```

```js
// server.mjs
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { mcpApps } from '@modern-js/mcp-apps/hono';

const app = new Hono();
app.get('/health', c => c.json({ ok: true }));
// 按业务需要，在 /mcp 前配置鉴权和 Host/Origin 策略。
app.all('/mcp', mcpApps({
  configPath: fileURLToPath(new URL('./mcp-apps/mcp_apps.mjs', import.meta.url)),
  serverInfo: { name: 'my-mcp-server', version: '1.0.0' },
  onError: error => console.error('[MCP Apps]', error),
}));
serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 8080) });
```

```bash
node server.mjs
```

默认卡片的 React 已打包进 HTML，在宿主 iframe 执行；服务端不需要 React 安装或 UI 源码。Hono 适配器本身不监听端口，监听与生命周期由用户应用管理。

### 完全不用 Modern.js 开发

也可以自行维护上一节示例中的 `mcp_apps.ts`、handler 和卡片，用核心构建 API 生成产物：

```js
// build-mcp.mjs
import { compileMcpApps } from '@modern-js/mcp-apps/build';

await compileMcpApps({
  configPath: './mcp_apps.ts',
  outDir: './dist/mcp-apps',
});
```

```bash
node build-mcp.mjs
```

有本地 React 卡片时，构建环境需安装兼容的 `react`、`react-dom`；纯 handler 不需要它们。将生成目录交给上述 Hono 服务运行即可。直接给适配器传未编译的本地 React view 配置，不能替代构建步骤。

## 7. UI 独立发布：默认 HTML 或可选 MF

### 默认模式：自包含 HTML

可直接随 Server 部署全部 MCP 产物，也可将生成的 `build-*/view-*.html` 发布到独立 HTTPS 静态服务。文件名以该次构建结果为准，不要依赖固定 build ID。

要引用托管的 HTML，在源配置中保留本地 module，并增加：

```ts
view: {
  module: './src/components/Greeting.tsx',
  html: process.env.MCP_VIEW_HTML_URL,
}
```

重新构建后，启动 MCP Server 时设置 `MCP_VIEW_HTML_URL` 为已发布 HTML 的完整 HTTPS URL。服务端在 `resources/read` 时获取 HTML，再通过 MCP 返回宿主。它不是 iframe 直接导航的网页地址。

默认 HTML 不需加载外部 UI 脚本。如果组件自行访问外部资源，应在 `view.csp` 中声明相应域名，并满足资源服务 CORS 和宿主自身的限制。

### MF 模式：使用标准 Modern.js MF 产物

```bash
pnpm dlx @modern-js/create@<version> my-mf-app --template mcp-apps --mf
cd my-mf-app
pnpm install
```

该选项额外生成 MF 配置、remote 声明与依赖。发布时设置资源 origin：

```bash
MCP_UI_ORIGIN=https://ui.example.com pnpm build
MCP_UI_ORIGIN=https://ui.example.com pnpm serve
```

发布 `dist/static/` 时保持对应的 `/static/` URL 路径，检查：

- `https://ui.example.com/static/mf-manifest.json` 返回 JSON。
- manifest 的 publicPath 指向实际部署地址，其 remote entry、JS、CSS 都可访问。
- 静态服务允许宿主 iframe 跨域读取资源；配置中的 CSP 包含资源 origin。

`MCP_UI_ORIGIN` 是 origin，不是 manifest 完整 URL，仅 MF 模板使用它。独立 Hono 部署时，在启动 Hono 的环境中设置同一变量即可。

## 8. 使用 ngrok 连接真实 Agent

### 安装并建立 HTTPS 隧道

按 [ngrok 安装指引](https://ngrok.com/docs/start)安装并配置自己的 authtoken。macOS 常见命令：

```bash
brew install ngrok
ngrok config add-authtoken YOUR_AUTHTOKEN
```

先在一个终端启动 MCP 应用（`pnpm dev`、`pnpm serve` 或 `node server.mjs` 三选一），确认实际端口。另一个终端运行：

```bash
ngrok http 8080
```

本仓库 demo 可直接使用 `ngrok http 8080`；如应用运行在 8096，则改用 `ngrok http 8096`。同一公开域名已有隧道在线时，先停止旧隧道再启动。

将 ngrok 输出的 HTTPS Forwarding 地址拼上 `/mcp`，填入 Agent 的 MCP 连接配置：

```text
https://你的-ngrok-域名/mcp
```

使用自有 Hono 的其他端口时，替换 `8080`；自定义 endpoint 时同步替换 `/mcp`。保持应用进程和 ngrok 都运行，端口被旧进程占用时先确认进程归属再停止。

### 默认本地卡片

只转发 MCP 端口即可。卡片 HTML 通过 `resources/read` 返回，不需要额外 UI 隧道，也不需要设置 `MCP_UI_ORIGIN`。

在 Agent 新会话中调用 `greet`，确认 `Hello, Ada!` 等工具结果和卡片，再点击按钮验证回调。旧会话可能仍保留旧工具资源，切换 UI 模式后应重新连接或新开会话。

### 仓库 demo 的辅助命令

先停止 demo 旧的 dev/serve 进程，保留已启动的 ngrok，然后从仓库根目录运行：

```bash
pnpm --filter @examples/mcp-apps-modern preview:ngrok
```

该脚本从默认 `http://127.0.0.1:4040` 获取匹配本地端口的 HTTPS 隧道，然后执行 build 和 serve。可以用 `PORT` 与 `NGROK_API_URL` 调整端口及管理 API。它属于仓库 demo，不是 CLI 创建模板自带的脚本，也不是自动启动 ngrok 的命令。

### MF 模式与 ngrok 提示页

MF 卡片还会从浏览器请求 manifest、JS 和 CSS。即使 MCP 调用成功，UI 也可能因免费 ngrok 提示页而失败：收到的是 HTML，JSON 解析会报 `Unexpected token '<'`。

ngrok 官方说明，免费服务可能显示浏览器提示页；请求头 `ngrok-skip-browser-warning` 可用于可控的客户端请求。但为 manifest fetch 加该头，不能保证普通 script/link 资源请求也携带它。因此不要仅凭 curl 200 判定 MF 卡片可用。参见 [ngrok 免费服务说明](https://ngrok.com/docs/pricing-limits/free-plan-limits)。

可将 MF 静态资源部署到无提示页的 HTTPS 静态服务，保留 ngrok 转发 `/mcp`；分别设置好 UI publicPath、CSP 和 CORS。无需为此创建另一份 UI 项目。

## 9. 验证顺序与常见问题

| 现象 | 检查方式 |
| --- | --- |
| 浏览器访问 `/mcp` 返回 405 | 当前为 POST-only MCP endpoint，用 MCP 客户端验证 |
| 普通首页正常但卡片没显示 | 首页不是 MCP 宿主；检查 tools/list、resources/read 和实际宿主 |
| 工具文本成功，卡片失败 | 单独检查 UI 资源、Console 与宿主是否支持 MCP Apps |
| `connect-src` 拦截 HTTP localhost | MF 资源改 HTTPS；所有生效的 CSP 都要允许该域名 |
| 已改 HTTPS 仍报 `connect-src 'none'` | 检查 resource CSP 元数据及宿主策略；HTTPS 本身不能解除这条限制 |
| manifest 报 `Unexpected token '<'` | 检查响应是否 ngrok 提示页、登录页、404 页或 HTML fallback |
| 跨域失败 | 检查实际静态服务的 CORS，不只检查本地开发配置 |
| 独立 Hono 返回 503 | 查看 onError，检查 configPath、整个产物目录和外部依赖 |
| 修改源文件后 serve 没变化 | 重新 build 并重启；开发迭代使用 dev |

仓库测试宿主（仅测试使用）可用于分层排查：

```bash
# 先启动 demo，另一个终端从仓库根目录执行
node packages/toolkit/mcp-apps/scripts/browser-fixture.mjs
# 独立服务使用自己的完整 endpoint：
# MCP_ENDPOINT=http://127.0.0.1:8090/mcp node packages/toolkit/mcp-apps/scripts/browser-fixture.mjs
```

打开 `http://127.0.0.1:8092`，确认初始卡片与按钮更新，再在真实 Agent 验证。该宿主不会随 npm 包发布。

## 当前边界

- 默认本地视图支持 React component 模式，以 esbuild 编译 JSX/TSX 和 CSS，不自动继承 Modern.js CSS 预处理器等扩展。MF 模式使用应用的 MF 构建配置。
- MCP 是无状态 HTTP POST，没有持久会话、可恢复 SSE 或跨请求取消路由。
- Hono 适配器依赖当前 Node 服务端实现，不能仅因 Hono 支持某平台就推断本包已支持该平台。
- 一体化、Hono 独立服务、MF 与本地卡片均有对应测试；目标 Agent 的 UI 展示与交互仍需实际验收。
