# MCP Apps Todo Example

示例提供本地卡片 `local_todos`、MF 卡片 `list_todos` 和普通 tool `add_todo`。两张卡片共用同一个 Todo 组件和内存数据，重启服务后恢复初始数据。

## 开发

Modern.js 安装依赖均使用 `latest`，指向 registry 已发布的稳定版本，不依赖当前仓库源码或未发布特性。无需在仓库中构建框架包。

将本目录复制为独立项目后，在项目目录执行：

```bash
pnpm install
pnpm dev
```

如果 pnpm 报告 `ERR_PNPM_IGNORED_BUILDS`，使用 `pnpm approve-builds` 审核被阻止的依赖脚本，只批准你信任的依赖，再重新执行 `pnpm install`。独立验证时需批准 `@swc/core` 和 `core-js`，不要全局关闭脚本审批。

在仓库根目录也可以执行：

```bash
pnpm install
pnpm --filter @examples/mcp-apps-todo dev
```

打开 http://localhost:8088 查看说明。MCP 客户端连接 http://localhost:8088/api/mcp。

在支持 MCP Apps 的客户端中调用 `local_todos` 或 `list_todos` 展示卡片。在一张卡片内添加 Todo，再运行另一张卡片即可看到相同数据。

## 代码入口

- `mcp-views.json`：本地组件路径与本项目 MF expose 声明
- `modern.config.ts`：Modern.js、BFF、MF、MCP UI 构建插件
- `module-federation.config.ts`：暴露 `./Todos`
- `src/components/Todos.tsx`：通过 `McpViewProps` 接收 structuredContent 和 mcpApp
- `api/lambda/mcp.ts`：官方 SDK 注册 tools，通过 UI 清单注册 resources，显式导出 BFF handlers
- `api/server/store.ts`：内存数据
- `server/modern.server.ts`：仅为 `/static/*` 公开资源添加 CORS 响应头，供隔离 iframe 内的 MF 卡片读取

## 生产

在独立项目目录执行：

```bash
pnpm build
pnpm serve
```

在仓库根目录运行时，可使用 `pnpm --filter @examples/mcp-apps-todo build` 和 `pnpm --filter @examples/mcp-apps-todo serve`。

构建生成 `dist/mcp-apps/ui-manifest.json`、本地卡片 HTML 和 MF shell，静态文件与 MF manifest 使用标准应用产物。

MF 卡片运行在 `sandbox="allow-scripts"` 的 iframe 中，源站为不透明的 `null`。生产模式读取 MF manifest 和脚本时，需要公开静态资源允许跨域访问。示例中的服务端 middleware 只为 `/static/*` 设置 `Access-Control-Allow-Origin: *`，不对 `/api/mcp` 或其他 API 开放跨域权限，也不允许跨域凭据。若将静态资源交给 CDN，应同步配置这一公开资源策略。

使用 `PORT=8090 pnpm --filter @examples/mcp-apps-todo dev` 可以切换端口。

同一项目目录只运行一个 `modern dev` 实例。多个实例会共享 `.modern-js` 中间产物，可能导致 UI HTML 与所连接开发服务器的脚本不匹配。重启前先退出已有 dev 进程，并让 MCP 客户端连接终端实际打印的服务端口。

## 本机 STDIO 调试

示例已配置 `inline: 'dev'`，仍然只需运行 `pnpm dev`。将终端打印的 `command` 和 `args` 填入豆包等客户端的 STDIO 连接器。客户端启动包内置的转发脚本，请求经 HTTP 到达当前开发服务，继续使用原有 BFF、中间件和业务逻辑。

连接后调用 `local_todos` 打开本地卡片，点击 Add todo，再次调用 `local_todos` 验证新增结果。MF 卡片 `list_todos` 仍需宿主能够访问本地 HTTP 静态资源。

无需运行 `mcp-prepare`、配置 `stdio.server` 或生成 `dist-mcp/`。框架在 `.modern-js/mcp-apps/` 内管理临时 UI 文件和开发服务地址。默认连接器使用 `--cwd` 在每次请求时发现服务端口。修改组件后自动重编，下次读取卡片资源时获取更新后的 HTML，无需重启连接器。开发服务需保持运行，重启服务会重置内存数据。
