# MCP Apps 接入与部署指南

本文对应当前源码实现。下文 `<version>` 必须替换为包含本次架构调整的发布版本，不能直接假定旧 canary 或 `latest` 已包含这些改动。Node.js 要求 >=20。

## 两个包分别负责什么

| 包                           | 职责                                                 | 适用场景                                     |
| ---------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| `@modern-js/mcp-apps`        | MCP 协议、工具执行、卡片资源、配置类型与 HTTP 适配器 | 自建 Hono 服务，或直接使用框架无关的核心能力 |
| `@modern-js/plugin-mcp-apps` | 注册 Modern.js UI 入口、关联资源并接入 BFF 生命周期  | 使用 Modern.js 开发 MCP Apps                 |

选择方式：

- **Modern.js 项目**：安装两个包，在 `modern.config.ts` 中配置 `mcpAppsPlugin()`，由框架完成构建和服务集成。
- **自己的 Hono 项目**：只安装核心包 `@modern-js/mcp-apps`，通过 `@modern-js/mcp-apps/hono` 的 `mcpApps({ definition })` 挂载服务；Hono 和 HTTP listener 依赖由应用自行安装。
- **其他 HTTP 框架**：使用 `@modern-js/mcp-apps/server` 提供的 Web Request/Response handler，自行适配请求和响应。

两个适配器复用同一协议核心。Modern.js 的配置和工具函数通过普通 import 交给 BFF 编译；UI 交给应用构建。脱离 Modern.js 时，由应用自己的构建器生成 JavaScript 和 HTML。核心包不再提供 `/build` 编译 API。

## 从旧 canary 模板迁移

- 将服务定义放在根目录 `mcp_apps.ts`，内联工具可直接写对象。
- 启用 `mcpAppsPlugin({ endpoint: '/mcp' })`，删除原先仅用于 MCP 的手写 BFF 路由。
- `modern build` 复用服务端 TypeScript 编译器；UI 仍使用应用构建。
- 保留手动 BFF 路由时，设置 `config: 'api/mcp_apps.ts', endpoint: false`。

## 选择接入方式

| 场景                     | 入口                       | UI 与服务端如何运行               |
| ------------------------ | -------------------------- | --------------------------------- |
| 新建普通应用             | 默认 Modern.js 模板        | 不启用 MCP Apps                   |
| 新建带卡片的 MCP Apps    | `--template mcp-apps`      | 默认本地 React 卡片，无 MF        |
| 已有 Modern.js 项目      | `mcpAppsPlugin()`          | 在现有 Web Server 挂载 `/mcp`     |
| 只提供工具，不需要卡片   | `--template mcp-server`    | Modern.js 服务端项目，无 UI       |
| 已有 Hono 服务或独立部署 | `@modern-js/mcp-apps/hono` | 用户自己的 Hono 服务加载 MCP 产物 |
| 需要 MF 远程组件         | `--template mcp-apps --mf` | UI 静态资源可单独部署             |

`mcp-server` 是 CLI 模板名称，不是要求用户复制的示例项目。仓库提供本地视图示例 `examples/my-mcp-app-v2` 和 MF 示例 `examples/my-mcp-app-mf`。

## 1. 在当前仓库试用

从仓库根目录运行；依赖需已按仓库流程安装、构建：

```bash
pnpm install
pnpm prepare-build
pnpm --filter my-mcp-app-v2 dev
# MF 示例：pnpm --filter my-mcp-app-mf dev
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

| 文件                          | 作用                                   |
| ----------------------------- | -------------------------------------- |
| `modern.config.ts`            | 启用 `mcpAppsPlugin()`                 |
| `mcp_apps.ts`                 | 定义工具、输入 schema、handler 和 view |
| `src/components/Greeting.tsx` | 宿主中展示的 React 卡片                |

默认没有 MF 插件或 manifest。根目录 `mcp_apps.ts` 定义服务、schema、handler 和 view；
插件自动注册 `/mcp`，不需要 `api/lambda/index.ts`。模板同时启用 BFF 插件。

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
  plugins: [appTools(), bffPlugin(), mcpAppsPlugin()],
});
```

下面是一套可配合使用的最小定义、handler 和卡片：

```ts
// mcp_apps.ts
import { defineMcpServer, defineTool } from '@modern-js/mcp-apps/config';
import { name, version } from './package.json';

export default defineMcpServer({
  name,
  version,
  tools: [
    defineTool({
      name: 'greet',
      description: 'Greet someone.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } },
        required: ['name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      handler: async ({ name }) => {
        const message = `Hello, ${name}!`;
        return {
          content: [{ type: 'text', text: message }],
          structuredContent: { message },
          viewProps: { message },
        };
      },
      visibility: ['model', 'app'],
      view: { module: './src/components/Greeting.tsx' },
    }),
    defineTool({
      name: 'add_numbers',
      description: 'Add two numbers.',
      inputSchema: {
        type: 'object',
        properties: { a: { type: 'number' }, b: { type: 'number' } },
        required: ['a', 'b'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      handler: ({ a, b }) => {
        const sum = a + b;
        return {
          content: [{ type: 'text', text: `${a} + ${b} = ${sum}` }],
          structuredContent: { a, b, sum },
          viewProps: { a, b, sum },
        };
      },
      visibility: ['model', 'app'],
      view: { module: './src/components/Sum.tsx' },
    }),
  ],
});
```

```tsx
// src/components/Greeting.tsx
import type { App } from '@modern-js/mcp-apps/react';
import { useState } from 'react';

export default function Greeting({
  message,
  mcpApp,
}: {
  message?: string;
  mcpApp?: App;
}) {
  const [updated, setUpdated] = useState<string>();
  const [pending, setPending] = useState(false);
  return (
    <section>
      <h1>{updated ?? message}</h1>
      <button
        disabled={!mcpApp || pending}
        onClick={async () => {
          if (!mcpApp) return;
          setPending(true);
          try {
            const result = await mcpApp.callServerTool({
              name: 'greet',
              arguments: { name: 'Modern.js' },
            });
            setUpdated(
              result.isError
                ? 'Greeting failed'
                : String(result.structuredContent?.message ?? ''),
            );
          } catch {
            setUpdated('Greeting failed');
          } finally {
            setPending(false);
          }
        }}
      >
        Greet again
      </button>
    </section>
  );
}
```

将 `mcp_apps.ts` 加入 tsconfig 的 include。路由由插件的 `endpoint` 决定，默认 `/mcp`。
已有 BFF 保留原 prefix，无需重复启用插件。鉴权放在 BFF 路由之前；handler 的
`context.context` 是当前请求的 Hono Context。自定义挂载可设置 `endpoint: false`，
再通过 `mcpServer(definition)` 导出 BFF 方法。

## 4. 只需要 MCP 工具

```bash
pnpm dlx @modern-js/create@<version> my-server --template mcp-server
cd my-server
pnpm install
pnpm dev
```

该模板使用 Modern.js 管理服务，包含定义与 handler，不生成 UI。已有配置也可以省略工具的 `view`、省略 `remotes`。工具只返回文本/结构化数据时，宿主不显示卡片属于预期行为。

## 5. 一体化生产部署

在应用目录：

```bash
pnpm build
pnpm serve
```

自动挂载模式下，`build` 调用服务端编译器将根目录定义输出为 `dist/mcp_apps.js`，导入的工具保留相对路径。纯 `mcp-server` 模板的手动 BFF 定义输出到 `dist/api/`。UI 模式通过应用构建生成页面和 `dist/mcp-apps/ui/` 中的 UI HTML；`serve` 读取生产产物，不直接运行源文件。

也可生成可搬迁的部署目录：

```bash
pnpm deploy
node .output/index.js
```

`deploy` 是生成产物，不等于已上传到云平台。发布 `.output/` 后，由目标环境提供进程管理、HTTPS 和访问策略。

## 6. 在自己的 Hono 服务中独立部署

运行时不需要 Modern.js CLI。用 `modern build` 构建后，复制完整 `dist/` 到独立服务的 `application/` 目录，保留定义、导入的模块、`package.json`、UI HTML 和静态资源的相对路径及原有 CJS/ESM 模块类型。
工具导入的数据库 SDK 等生产依赖也要安装。

```ts
import path from 'node:path';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { mcpApps } from '@modern-js/mcp-apps/hono';
import { loadMcpAppsConfig, bindUiResources } from '@modern-js/mcp-apps/server';

const root = path.resolve('application'); // 放置应用构建产物的目录
const definition = await loadMcpAppsConfig(path.join(root, 'mcp_apps.js'));
const app = new Hono();
app.use('/static/*', serveStatic({ root }));
// 在 /mcp 前安装业务鉴权中间件。
app.all(
  '/mcp',
  mcpApps({
    definition: bindUiResources(definition, {
      directory: path.join(root, 'mcp-apps/ui'),
      assetBase: 'request',
    }),
  }),
);
serve({ fetch: app.fetch, port: 8080 });
```

### 完全不用 Modern.js 开发

核心不再提供独立编译器。用自己的 TypeScript/JavaScript 构建生成配置与工具模块，
然后静态导入 definition，调用 `createMcpHandler(definition)` 或 Hono 的
`mcpApps({ definition })`。本地 UI 由应用构建提供 HTML，通过 `bindUiResources`
关联到定义。无需序列化函数或生成包装入口。

## 7. UI 独立发布：默认 HTML 或可选 MF

### 默认模式：Modern.js HTML 和静态资源

`view.module` 会注册为标准 Modern.js 自动挂载入口，复用应用的 Rspack 构建、运行时配置、别名、样式处理、环境变量和 preEntry。
HTML 副本位于 `dist/mcp-apps/ui/`，JS/CSS/chunk 保留标准静态产物路径。`pnpm deploy` 将两者一起放入 `.output/`。

独立部署时，需要同时部署静态资源，或通过 Modern.js 的 `output.assetPrefix` 指向 CDN（开发使用 `dev.assetPrefix`）。资源响应会设置 HTML 的 base 和相应 CSP 域名。默认使用 MCP 请求的公开 origin，支持代理传入的 HTTPS 协议。代理若改写 Host，请配置明确的公开资源地址。

要引用托管的 HTML，在源配置中保留本地 module，并增加：

```ts
view: {
  module: './src/components/Greeting.tsx',
  html: process.env.MCP_VIEW_HTML_URL,
  // HTML 引用相对资源地址时，指定它们的公开基准地址。
  assetBase: process.env.MCP_VIEW_ASSET_BASE,
}
```

重新构建后，启动 MCP Server 时设置 `MCP_VIEW_HTML_URL` 为已发布 HTML 的完整 HTTPS URL。服务端在 `resources/read` 时获取 HTML，再通过 MCP 返回宿主。它不是 iframe 直接导航的网页地址。

宿主 iframe 会请求 HTML 引用的 JS/CSS、图片和动态 chunk。静态服务需可公开访问并满足 CORS 与宿主 CSP；如果组件访问额外 API 或 CDN，请在 `view.csp` 声明。生产验证应使用直接返回资源的 HTTPS 域名。

### MF 模式：使用标准 Modern.js MF 产物

```bash
pnpm dlx @modern-js/create@<version> my-mf-app --template mcp-apps --mf
cd my-mf-app
pnpm install
```

该选项额外生成 MF 配置和依赖，工具以 `remote: 'mcp_ui'` 引用本地 manifest。发布前在 `modern.config.ts` 配置资源前缀：

```ts
export default defineConfig({
  dev: { assetPrefix: 'https://ui.example.com/' },
  output: { assetPrefix: 'https://ui.example.com/' },
  // 保留 appTools、BFF、MF 和 MCP Apps 插件。
});
```

重新构建后运行 `pnpm serve`，将静态产物部署到所配置的域名。

发布 `dist/static/` 时保持对应的 `/static/` URL 路径，检查：

- `https://ui.example.com/static/mf-manifest.json` 返回 JSON。
- manifest 的 publicPath 指向实际部署地址，其 remote entry、JS、CSS 都可访问。
- 静态服务允许宿主 iframe 跨域读取资源；配置中的 CSP 包含资源 origin。

Modern.js 插件根据构建产物的 manifest 名称与 publicPath 生成本地 remote 和资源 CSP，显式声明的外部 `remotes` 保持不变。独立 Hono 使用核心包时不执行该插件的 MF 发现逻辑，需显式配置完整 `remotes`，并确保其 CSP 覆盖实际资源。

## 8. 验证顺序与常见问题

UI 模板包含五个工具：`list_tasks`、`create_task`、`update_task`、`greet` 和 `add_numbers`。前三者共用任务看板，处理函数及文件存储位于 `src/features/tasks/server/`。
纯 Server 模板仅提供 `greet` 和 `add_numbers`，不声明 UI 资源。

任务默认存储在工作目录 `.mcp-demo/tasks.json`，可通过 `MCP_TASKS_FILE` 指定路径，单进程最多 100 个任务。所有访问者共享演示数据，多用户隔离与多实例持久化由应用实现。

启动服务后，使用 MCP 客户端连接 `/mcp`，依次检查 tools/list、各工具的
tools/call，以及带 UI 工具的 resources/read。`greet` 应返回输入姓名的问候，
`add_numbers({ a: 2, b: 3 })` 应返回 `sum: 5`。在宿主中验证卡片显示与交互。
默认模板不再附带验证脚本。

| 现象                                 | 检查方式                                                       |
| ------------------------------------ | -------------------------------------------------------------- |
| 浏览器访问 `/mcp` 返回 405           | 当前为 POST-only MCP endpoint，用 MCP 客户端验证               |
| 普通首页正常但卡片没显示             | 首页不是 MCP 宿主；检查 tools/list、resources/read 和实际宿主  |
| 工具文本成功，卡片失败               | 单独检查 UI 资源、Console 与宿主是否支持 MCP Apps              |
| `connect-src` 拦截 HTTP localhost    | MF 资源改 HTTPS；所有生效的 CSP 都要允许该域名                 |
| 已改 HTTPS 仍报 `connect-src 'none'` | 检查 resource CSP 元数据及宿主策略；HTTPS 本身不能解除这条限制 |
| manifest 报 `Unexpected token '<'`   | 检查响应是否登录页、404 页或 HTML fallback                     |
| 跨域失败                             | 检查实际静态服务的 CORS，不只检查本地开发配置                  |
| 独立 Hono 返回 503                   | 查看 onError，检查 configPath、整个产物目录和外部依赖          |
| 修改源文件后 serve 没变化            | 重新 build 并重启；开发迭代使用 dev                            |

仓库测试宿主（仅测试使用）可用于分层排查：

```bash
# 先启动 demo，另一个终端从仓库根目录执行
node packages/toolkit/mcp-apps/scripts/browser-fixture.mjs
# 独立服务使用自己的完整 endpoint：
# MCP_ENDPOINT=http://127.0.0.1:8090/mcp node packages/toolkit/mcp-apps/scripts/browser-fixture.mjs
```

打开 `http://127.0.0.1:8092`，确认初始卡片与按钮更新，再在真实 Agent 验证。该宿主不会随 npm 包发布。

## 当前边界

- 默认本地视图通过标准 Modern.js 入口构建，继承应用构建和运行时配置。指向页面组件不会自动带上文件系统路由的 layout、loader 或服务端登录态，需要显式组织 UI 入口。MF 模式继续使用应用的 MF 构建配置。
- MCP 是无状态 HTTP POST，没有持久会话、可恢复 SSE 或跨请求取消路由。
- Hono 适配器依赖当前 Node 服务端实现，不能仅因 Hono 支持某平台就推断本包已支持该平台。
- 一体化、Hono 独立服务、MF 与本地卡片均有对应测试；目标 Agent 的 UI 展示与交互仍需实际验收。
