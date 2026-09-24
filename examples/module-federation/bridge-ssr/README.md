# 商品中台：Modern.js + Module Federation 独立 Root SSR

这个示例用于验证：完整 Modern 应用通过 Module Federation 暴露双端 Bridge 入口，由 Host 在自己的 Node 进程中执行生产者 SSR。首页同时嵌入商品管理和库存管理，每个应用使用自己的 React、路由和 hydration 生命周期。

本地 Node 产物执行、双版本 React 流组合、原 DOM hydration 复用、SSR 后分页与跨应用状态隔离，以及最终失败整页 CSR 降级均已通过真实浏览器验证。验收条件、数据和复现命令见 [VERIFICATION.md](./VERIFICATION.md)。

业务代码使用 Modern 文件路由、`.data.ts` / `.data.client.ts`、`Suspense` / `Await` 和真实 HTTP API。SSR 应用工厂、入口生成、HTML 分帧、流组合和客户端挂载位于 Modern/MF 包内，示例不维护另一套渲染器或手写路由树。

## 应用与端口

| 应用     | React / ReactDOM | 地址                    | 默认启动方式                            |
| -------- | ---------------- | ----------------------- | --------------------------------------- |
| Host     | 19.2.8           | `http://127.0.0.1:4500` | `modern serve`，负责页面 SSR 和商品 API |
| 商品管理 | 18.3.1           | `http://127.0.0.1:4501` | `http-server dist`，只提供构建产物      |
| 库存管理 | 19.2.8           | `http://127.0.0.1:4502` | `http-server dist`，只提供构建产物      |

两个生产者默认没有运行 SSR 服务。4501/4502 是静态资源服务，可对应线上 CDN；Host 通过 MF manifest 加载其中的 Node entry/chunk，再调用生产者的 `renderStream`。浏览器也从这两个静态域加载对应应用的 JavaScript 和样式。

```text
浏览器 ──页面请求──▶ Host Modern Node :4500
                        │
                        ├─加载商品 Node 产物──▶ 静态资源 :4501
                        ├─加载库存 Node 产物──▶ 静态资源 :4502
                        │
                        ├─本进程执行商品 Modern SSR（React 18）
                        ├─本进程执行库存 Modern SSR（React 19）
                        │       └─真实 loader ──HTTP──▶ 商品 API / SQLite
                        │
                        └─组合 Host 流与 Remote 帧──▶ 浏览器渐进展示
                                                   └─各自 hydration
```

## 本地依赖与构建

使用 Node.js 24；SQLite API 使用 Node 内置的 `node:sqlite`。两个仓库分别使用各自 `packageManager` 指定的 pnpm，建议通过 Corepack 启用。示例自身使用 pnpm 10.13.1；MF worktree 使用 pnpm 10.28.0。

当前示例通过相对 `link:` 指向下面两个相邻工作区。首次安装前，应确保它们包含本次实现的 Modern/MF 源码；直接换成已发布版本不包含这些新增能力。

```text
/Users/bytedance/outter/
├── modern-js-bridge-ssr-demo/     # Modern worktree
└── core-bridge-ssr-demo/          # Module Federation worktree
```

示例是独立 pnpm workspace，拥有自己的锁文件。它被排除在 Modern 根 workspace 之外，避免添加示例依赖时重新解析其他示例中的 `latest`。运行示例命令时需要进入本目录，或使用 `pnpm --dir examples/module-federation/bridge-ssr ...`。

首次准备框架依赖：

```bash
corepack enable

cd /Users/bytedance/outter/core-bridge-ssr-demo
pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=@module-federation/modern-js-v3

cd /Users/bytedance/outter/modern-js-bridge-ssr-demo
pnpm install --frozen-lockfile
pnpm --filter @modern-js/app-tools... --filter @modern-js/runtime... --filter @modern-js/server-runtime... run build
```

安装并构建示例：

```bash
cd /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm start
```

`pnpm start` 启动一个 Host SSR 服务和两个静态资源服务。修改业务代码后重新 `pnpm run build`；修改框架源码后先构建对应框架包，再构建示例并重启服务。不要额外在相同端口同时启动生产者的 `modern serve`。

`tsconfig.local.json` 用于本地链接开发：Modern 插件类型解析到当前 worktree 的声明，React 类型解析到每个应用自身的 `@types/react`。它解决跨仓库链接导致的 TypeScript 类型混用；JavaScript 运行时的 React/ReactDOM 隔离由 MF 构建配置实现，二者需分别验证。

## 业务与页面

- `/`：同一页面同时展示完整商品应用和库存应用。
- `/products`：商品应用单页入口。
- `/products/SH-1001`：Host 直接定位商品详情的示例地址。
- `/inventory`：库存应用单页入口。

商品应用包含搜索、分类/状态筛选、分页、商品详情和上下架操作；库存应用包含仓库切换、低库存筛选、库存调整和操作流水。两个应用通过同一业务 API 读取和修改实际数据库。

Host 的 `server/commerce.ts` 使用 SQLite，首次打开时创建表并写入种子商品、两个仓库和初始流水。默认数据文件是 `host/.data/commerce.sqlite`，由启动 Host 时的工作目录决定。刷新页面会重新查询数据库；业务修改会保留。

| API                                   | 用途               |
| ------------------------------------- | ------------------ |
| `GET /api/commerce/products`          | 商品筛选与分页     |
| `GET /api/commerce/products/:id`      | 商品详情           |
| `PATCH /api/commerce/products/:id`    | 修改上下架状态     |
| `GET /api/commerce/summary`           | 商品汇总           |
| `GET /api/commerce/inventory`         | 仓库库存           |
| `POST /api/commerce/inventory/adjust` | 库存调整及流水写入 |
| `GET /api/commerce/activity`          | 最近库存流水       |

可先检查业务 API 返回 JSON：

```bash
curl -fsS http://127.0.0.1:4500/api/commerce/products
curl -fsS http://127.0.0.1:4500/api/commerce/inventory
```

## 验证流式 SSR

商品 loader 首先等待商品列表，再把汇总请求以 Promise 返回；库存 loader 首先等待库存列表，再把流水请求以 Promise 返回。页面使用真实 `Suspense` / `Await` 消费这些 Promise。

延迟参数只作用于真实 API 请求，用于制造可观察的响应顺序；没有在浏览器里用定时器拼接假 SSR 内容。

| 页面参数            | 作用                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| `streamDelay=2500`  | 商品汇总 API 延迟 2500 毫秒；未指定 `activityDelay` 时也用于库存流水 |
| `activityDelay=900` | 单独设置库存流水 API 的延迟                                          |
| `csr=1`             | 使用 Modern 的整页 CSR 模式，作为降级入口                            |

API 延迟被限制在 0–5000 毫秒。推荐测试以下地址，交换快慢顺序：

```text
http://127.0.0.1:4500/?streamDelay=2500&activityDelay=900
http://127.0.0.1:4500/?streamDelay=500&activityDelay=2500
http://127.0.0.1:4500/?csr=1
```

检查 HTTP 输出时使用普通浏览器 User-Agent，避免框架把客户端识别为爬虫而等待完整渲染：

```bash
curl --http1.1 --no-buffer \
  -A 'Mozilla/5.0' \
  -D /tmp/bridge-demo-headers.txt \
  'http://127.0.0.1:4500/?streamDelay=2500&activityDelay=900' \
  | tee /tmp/bridge-demo-response.html
```

需要观察首屏内容和后续帧是否分批到达，而不是只检查最终文件包含商品文本。Remote 帧通过内联传输指令送到浏览器，轻量 bootstrap 插入完整 HTML 片段并执行 React 完成脚本；查看响应源码不能代替浏览器渐进展示验证。

服务端每个 Remote 有独立渲染任务、`identifierPrefix` 和 snapshot；浏览器收到该 Remote 的结束帧及 snapshot，并确认 React 延迟执行的 Suspense DOM 插入完成后，才由它自己的 ReactDOM hydration。Host 的首屏 hydration 不等待两个 Remote 的流全部结束。最终是否正确，需要同时检查页面展示顺序、控制台 hydration 错误、真实交互和数据持久化。

### 已完成的真实验收（2026-09-24）

| 场景                         | 结果                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 商品快、库存慢               | 商品完成于 1246.7 ms，库存完成于 2451.7 ms；分别完成 hydration                                                            |
| 库存快、商品慢               | 库存完成于 859.2 ms，商品完成于 2253.8 ms；完成顺序随 API 响应反转                                                        |
| Host 提前交互                | 274 ms 时两个 Remote 都未完成，Host 侧栏已可点击；Remote 后续完成仍复用先前插入的 DOM                                     |
| 多版本 React                 | 实际 renderer 为 Host 19.2.8、商品 18.3.1、库存 19.2.8；两个 Remote 均在 hydration 前捕获服务端节点并在完成后保留同一节点 |
| 真实业务                     | SSR 后可筛选分类、分页、切换仓库、进入详情；上海 SH-1001 库存 +5 写入 SQLite，商品进入详情后库存仍保留上海仓和 16 件      |
| Node entry 故障              | 保留浏览器资源，仅让商品 Node entry 返回 404，Host 清缓存重启后页面从 `/` 仅跳转一次到 `/?csr=1`；两个应用及分页仍可操作  |
| Node 与浏览器 entry 同时故障 | 同样仅降级一次；商品展示预期资源错误边界，库存和 Host 侧栏仍可用，没有自动再次刷新                                        |

这些时间来自单次本地验收的页面内计时，用于证明独立完成顺序，不是性能基准。最终恢复全部产物后再次验收，商品/库存分别在 1165.4/1966.3 ms 完成并复用原 DOM。详细 URL、DOM 复用证据、故障恢复步骤、测试范围和已知限制统一记录在 [VERIFICATION.md](./VERIFICATION.md)。健康 SSR 验收没有出现 hydration mismatch、invalid hook call、控制台错误或页面异常。故意移走浏览器资源的 CSR 失败场景会展示预期错误边界，单独记录其不循环刷新结果。

Host 配置 `server.ssr: { mode: 'stream', forceCSR: true }`。正常请求默认使用 SSR，最终失败才设置 `csr=1` 整页重新加载；`forceCSR` 必须由 Modern 配置启用。不要默认跳过 SSR，也不要在已经输出部分 SSR 内容后直接创建另一份本地 renderer 混入同一实例。

停止生产者的整个静态服务会同时破坏 SSR 产物和浏览器资源，不能用于证明 CSR 能恢复。验证降级时应保留浏览器资源，只针对 Node entry/chunk 或 SSR 执行注入故障。

本示例实现的是本地执行 Node 产物。远程 HTTP SSR service executor 以及“HTTP 渲染失败后切换本地”的重试策略尚未实现。React Form Actions 的 document 级 replay 协议不在当前隔离机制支持范围；RSC 未纳入此 Demo 验证。

## 路由所有权

Host 使用 Modern 自己的页面路由。嵌入的每个应用使用独立 memory router，因此首页两个 Remote 可以拥有不同的应用内路径，互不修改 Host 地址栏。

Host 的 `/products/SH-1001` 会通过 `memoryRoute.entryPath` 把商品应用定位到 `/SH-1001`。Remote 内部的链接继续由自己的路由处理；当前实现没有把每次 Remote 导航自动同步回 Host 地址栏。Host 可以通过 Bridge 的 update 生命周期传入新的 URL。

生产者也保留普通 Modern 入口。要验证生产者独立 SSR，可停止对应静态服务后，在对应应用目录执行 `pnpm serve`。这是一条额外验证路径，不是默认 Host 组合 SSR 所依赖的服务；默认静态服务以构建目录为根，仅负责产物分发。

## 框架代码归属

| 层              | 主要代码                                                                         | 职责                                                                        |
| --------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Modern runtime  | `packages/runtime/plugin-runtime/src/application/`                               | 真实应用 SSR、JSON snapshot、独立实例 hydration/mount/update/destroy        |
| Modern router   | `packages/runtime/plugin-runtime/src/router/runtime/`                            | 应用实例自己的路由数据与 memory router，避免全局 hydration 数据串用         |
| Modern SSR hook | `packages/runtime/plugin-runtime/src/core/server/stream/createReadableStream.ts` | 把请求、运行时 context、原生 shell marker 和 React 前缀交给 stream extender |
| MF Modern CLI   | `core-bridge-ssr-demo/packages/modernjs-v3/src/cli/bridgeApplications.ts`        | 根据 `bridge.exposes` 生成双端入口，接入现有 registry 和构建配置            |
| MF 流协议       | `core-bridge-ssr-demo/packages/modernjs-v3/src/bridge-stream/`                   | Bridge 生命周期适配、HTML 分帧、Host 流安全插入和浏览器 bootstrap           |
| MF Bridge React | `core-bridge-ssr-demo/packages/bridge/bridge-react/src/`                         | 消费者容器、SSR 注册、生产者 hydration 与 CSR 生命周期                      |
| Demo            | 当前目录下的三个应用                                                             | 配置、业务页面、loader、HTTP API 和 SQLite 数据                             |

生产者主要配置是 `moduleFederationPlugin({ bridge: { exposes: { './App': true } }, config: { name, dts: false } })`。Host 配置 `bridge: true` 与普通 MF `remotes`，页面通过现有 `createRemoteAppComponent` 加载应用。

更改框架后可运行已有针对性检查：

```bash
# Modern worktree
pnpm --filter @modern-js/runtime test
pnpm --filter @modern-js/runtime run build

# Demo workspace
pnpm run typecheck
pnpm run build
```

完整的已运行检查命令、结果和未覆盖范围见 [VERIFICATION.md](./VERIFICATION.md)。
