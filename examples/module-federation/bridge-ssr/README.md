# 商品中台：Modern.js + Module Federation 独立 Root SSR

这个示例用于验证：完整 Modern 应用通过 Module Federation 暴露双端 Bridge 入口，由 Host 在自己的 Node 进程中执行生产者 SSR。首页同时嵌入商品管理和库存管理，每个应用使用自己的 React、路由和 hydration 生命周期。

本地 Node 产物执行、双版本 React 流组合、原 DOM hydration 复用、SSR 后分页与跨应用状态隔离，以及最终失败整页 CSR 降级均已通过真实浏览器验证。验收条件、数据和复现命令见 [VERIFICATION.md](./VERIFICATION.md)。

业务代码使用 Modern 文件路由、`.data.ts` / `.data.client.ts`、`Suspense` / `Await` 和真实 HTTP API。SSR 应用工厂、入口生成、HTML 分帧、流组合和客户端挂载位于 Modern/MF 包内，示例不维护另一套渲染器或手写路由树。

## 保留的总 PR 与当前边界（2026-09-29）

当前实现收敛到两个框架 PR，后续 review 和 Modern 内置工作以它们为入口：

| PR | 内容 |
| --- | --- |
| [Modern #8941](https://github.com/web-infra-dev/modern.js/pull/8941) | 独立 application SSR / hydration API、按实例恢复 deferred 数据、SSR 扩展和本商品后台 Demo |
| [MF #5164](https://github.com/module-federation/core/pull/5164) | Bridge 独立 root、CSS 收集、SSR/CSR 生命周期拆分、提前水合、Service HTTP executor 与降级 |

Modern [#8926](https://github.com/web-infra-dev/modern.js/pull/8926) 和 MF [#5112](https://github.com/module-federation/core/pull/5112)、[#5162](https://github.com/module-federation/core/pull/5162) 是上述总 PR 已包含的历史阶段，不再作为独立合入入口。这是分支和文档整理，不表示代码已合入 `main`。

本目录继续验证 Host 本地执行 Node 产物，现有 `link:` 仍指向 `core-bridge-progressive-hydration`；本次不改依赖和运行时代码。Service HTTP 路径由 MF 总 PR 实现，验收 Demo 位于第三个仓库 `/Users/bytedance/personal/mf-x-bridge-service-ssr`，分支 `feat/bridge-progressive-service-ssr`。它复用本 Modern 分支，但不属于本 PR 的商品后台示例，也没有将该仓库源码迁入这里。

## 应用与端口

| 应用     | React / ReactDOM | 地址                    | 默认启动方式                            |
| -------- | ---------------- | ----------------------- | --------------------------------------- |
| Host     | 19.2.8           | `http://127.0.0.1:4600` | `modern serve`，负责页面 SSR 和商品 API |
| 商品管理 | 18.3.1           | `http://127.0.0.1:4601` | `http-server dist`，只提供构建产物      |
| 库存管理 | 19.2.8           | `http://127.0.0.1:4602` | `http-server dist`，只提供构建产物      |

两个生产者默认没有运行 SSR 服务。4601/4602 是静态资源服务，可对应线上 CDN；Host 通过 MF manifest 加载其中的 Node entry/chunk，再调用生产者的 `renderStream`。浏览器也从这两个静态域加载对应应用的 JavaScript 和样式。

```text
浏览器 ──页面请求──▶ Host Modern Node :4600
                        │
                        ├─加载商品 Node 产物──▶ 静态资源 :4601
                        ├─加载库存 Node 产物──▶ 静态资源 :4602
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
├── modern-js-bridge-progressive-hydration/     # Modern worktree
└── core-bridge-progressive-hydration/          # Module Federation worktree
```

示例是独立 pnpm workspace，拥有自己的锁文件。它被排除在 Modern 根 workspace 之外，避免添加示例依赖时重新解析其他示例中的 `latest`。运行示例命令时需要进入本目录，或使用 `pnpm --dir examples/module-federation/bridge-ssr ...`。

首次准备框架依赖：

```bash
corepack enable

cd /Users/bytedance/outter/core-bridge-progressive-hydration
pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=@module-federation/modern-js-v3

cd /Users/bytedance/outter/modern-js-bridge-progressive-hydration
pnpm install --frozen-lockfile
pnpm --filter @modern-js/app-tools... --filter @modern-js/runtime... --filter @modern-js/server-runtime... run build
```

安装并构建示例：

```bash
cd /Users/bytedance/outter/modern-js-bridge-progressive-hydration/examples/module-federation/bridge-ssr
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
curl -fsS http://127.0.0.1:4600/api/commerce/products
curl -fsS http://127.0.0.1:4600/api/commerce/inventory
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
http://127.0.0.1:4600/?streamDelay=2500&activityDelay=900
http://127.0.0.1:4600/?streamDelay=500&activityDelay=2500
http://127.0.0.1:4600/?csr=1
```

检查 HTTP 输出时使用普通浏览器 User-Agent，避免框架把客户端识别为爬虫而等待完整渲染：

```bash
curl --http1.1 --no-buffer \
  -A 'Mozilla/5.0' \
  -D /tmp/bridge-demo-headers.txt \
  'http://127.0.0.1:4600/?streamDelay=2500&activityDelay=900' \
  | tee /tmp/bridge-demo-response.html
```

需要观察首屏内容和后续帧是否分批到达，而不是只检查最终文件包含商品文本。Remote 帧通过内联传输指令送到浏览器，轻量 bootstrap 插入完整 HTML 片段并执行 React 完成脚本；查看响应源码不能代替浏览器渐进展示验证。

服务端每个 Remote 有独立渲染任务、`identifierPrefix` 和 snapshot；浏览器收到该 Remote 的完整 shell 与初始 snapshot，并确认 CSS 就绪后，就由它自己的 ReactDOM 开始 hydration。初始 snapshot 中的 deferred 引用由生产者恢复成当前实例的 Promise；后续数据帧会继续完成这些 Promise，不需要等待整个 Remote 流结束。Host 的首屏 hydration 不等待两个 Remote 的流全部结束。最终是否正确，需要同时检查页面展示顺序、控制台 hydration 错误、真实交互和数据持久化。

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

本示例运行本地 Node executor；HTTP Service executor 已在 MF #5164 实现并由单独的 Service Demo 验证，复用关系和可选本地回退见下文。本目录没有开启 HTTP Service，也没有加入 Service Demo 中的 React 18 补丁。React Form Actions 的 document 级 replay 协议不在当前隔离机制支持范围；RSC 未纳入此 Demo 验证。

## 生产者 CSS 与首屏样式

框架自动从已加载的 MF manifest 中收集当前 expose 的 `css.sync` 和 `css.async`，Demo 无需手写 CSS URL 或增加配置。这是 expose 级的保守依赖集合，不承诺只加载实际访问路由的 CSS。

在 Host head 输出前已经收集到的样式直接生成 `<link rel="stylesheet">`。这和普通 Modern SSR 一样会阻塞首绘，也可能阻塞后面的内联 bootstrap；慢 CSS 在这条路径上可能影响整个页面。如果 Remote 通过后续 Suspense 才被发现，CSS 清单随该实例的 `meta.stylesheets` 发出，浏览器立即创建或复用 head stylesheet，只在该实例的 CSS 加载完成后插入其 HTML。晚到 CSS 的等待按实例隔离，加载失败/超时沿已有 CSR 降级路径处理；watchdog 从 bootstrap 执行后才开始，不覆盖此前原生 head 样式阻塞阶段。

CSS URL 在 head 和客户端加载阶段会去重；`preload`、disabled、alternate 或非 CSS 类型的链接不被当成已经应用的 stylesheet。此次修复还统一了自动注入的 Bridge 插件与组件使用的 ESM 入口，避免 CJS/ESM 各自持有一个运行时实例、导致 SSR 样式收集为空。

真实浏览器修复前采集到库存内容已显示、生产者 CSS 仍未加载的 6 个绘制帧。修复后库存页冷请求和首页双 Remote 的首次可见帧均已具备 CSS，未再采集到无样式帧；两个独立 Root 保留原 SSR DOM，交互正常。详见 [验证记录](./VERIFICATION.md)。

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
| MF Modern CLI   | `core-bridge-progressive-hydration/packages/modernjs-v3/src/cli/bridgeApplications.ts`        | 根据 `bridge.exposes` 生成双端入口，接入现有 registry 和构建配置            |
| MF 流协议       | `core-bridge-progressive-hydration/packages/modernjs-v3/src/bridge-stream/`                   | Bridge 生命周期适配、HTML 分帧、Host 流安全插入和浏览器 bootstrap           |
| MF Bridge React | `core-bridge-progressive-hydration/packages/bridge/bridge-react/src/`                         | 消费者容器、SSR 注册、生产者 hydration 与 CSR 生命周期                      |
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

## Review 生命周期拆分

Bridge 的普通 CSR 继续使用通用浏览器生命周期，不要求安装 Modern 插件。独立应用 SSR 由 Modern MF 集成启用 `BridgeSSRPlugin`：仅在 Node Rspack 编译中，将内部 `@module-federation/bridge-react/remote-lifecycle` 解析到 `.server` 入口。浏览器构建不替换；没有安装该插件的 Node 构建也只输出普通 CSR 容器。插件限定于 Bridge 模块，不改变业务文件的后缀解析规则。

`createHelpers.tsx` 和 `RemoteAppWrapper.tsx` 保留同一份 ID、Suspense 和容器结构；Node 注册与浏览器生命周期通过构建边界拆开。Bridge 库显式发布两套生命周期入口，并保留这条外部导入，避免打包后模块已经合并、应用构建无法选择。

建议按下面顺序 review MF PR：

1. `packages/bridge/bridge-react/src/remote/RemoteAppWrapper.tsx` 与 `createHelpers.tsx`：先确认组件结构和实例 ID 仍然只有一份。
2. `packages/bridge/bridge-react/src/remote/lifecycleTypes.ts`：检查双端生命周期的共同接口。
3. `packages/bridge/bridge-react/src/remote/remoteLifecycle.server.ts`：检查预注册、最终参数激活和 CSS 登记。
4. `packages/bridge/bridge-react/src/remote/remoteLifecycle.ts` 与 `hydration.ts`：检查独立 root 水合、CSR 挂载、更新队列及销毁。
5. `packages/modernjs-v3/src/rspack/index.ts` 与 `src/cli/bridgeApplications.ts`：检查 Modern 如何安装 Node 构建插件，以及插件如何选择正确模块。
6. Bridge 的 `package.json`、`vite.config.ts` 和 `scripts/write-dts-entrypoints.mjs`：确认发布后的模块边界和类型声明存在。
7. `packages/modernjs-v3/tests/bridge-platform-build.cjs`：真实编译 Node/browser 产物，验证插件启用和未启用时的行为，并检查两次挂载同一 Remote 的 ID 和 DOM 水合复用。

之后再按本文的双 Remote 延迟 URL、页面筛选/分页、`csr=1` 路径验收 Demo。此轮没有修改 `bridge.exposes` API、参数序列化策略，也没有增加业务 hydration mismatch 的自动诊断。

## 验证提前水合

本分支在原独立 Root SSR 实现上增加了初始 snapshot 和逐步数据传输。`ready` 表示 shell 与初始数据已经可用于水合；`done` 表示 HTML 和数据流结束。两者都不是 React commit 本身，验收必须执行真实交互。

打开 `http://127.0.0.1:4600/?streamDelay=5000&activityDelay=4000`，在库存流水还显示 loading 时点击“调整库存”，弹窗应立即打开；也可以用“仅看低库存”过滤现有列表。后续流水到达时，已打开的弹窗和筛选状态应保留。商品使用 React 18，库存使用 React 19；交换两个延迟参数可检查完成顺序反转。`?csr=1` 继续验证普通 CSR 路径。

验证后到内容自身的交互：打开 `http://127.0.0.1:4600/?streamDelay=5000&activityDelay=2500`，滚动到“最近库存流水”，等待 loading 被实际流水替换，点击任意一条右侧的“查看详情”。应打开“库存流水详情”弹窗，展示该条记录的商品、SKU、仓库、变更数量、原因和时间；关闭后可以再次打开。按钮和弹窗状态都位于 `Await` 后到的 `Activity` 子树内。这个场景中库存先完成，商品仍可能在加载；详情操作只读取已有流水，不修改库存。

实现入口：Modern 的 `application/server.tsx` 生成 v2 初始 snapshot，`data.server.ts` 编码 deferred 引用和后续结果，`data.ts` 在浏览器恢复实例自己的 Promise，`application/index.tsx` 在 shell commit 后完成 hydrate 调用。MF 的 `bridgeStreamPlugin.node.tsx` 识别完整 shell marker 并转发帧；`bootstrap.ts` 提供独立的 `session.ready` 和 `session.done`；Bridge 的 `hydration.ts` 优先等待 ready。

延迟数据协议只传生产者定义的数据，Host 不理解 loader 或路由。原有 v1 完整 snapshot 仍可使用。当前验证覆盖 React 18.3.1 / 19.2.8；需要 Host 保持 HTTP 文档流开放直到 Remote 完成，不覆盖在已结束的文档上再次插入带 pending 边界的 SSR 流。完整命令、结果和边界见 VERIFICATION.md 的本轮记录。

## 执行流程与生产落地边界

以下是当前实现的分工，后续优化计划不能当作已实现能力。MF 侧的完整说明与测试计划见 [MF README](https://github.com/module-federation/core/blob/feat/bridge-service-ssr/packages/modernjs-v3/README.md)。

### 生产者与 Host Node

1. 生产者 Modern 提供 `renderApplication(request, options)`，返回应用 HTML 流、兼容完整状态的 `snapshot` Promise 和 `cancel`；启用 `progressiveHydration` 时额外返回 `hydration.snapshot`、`hydration.updates` 和 shell marker；浏览器 `createApplication()` 提供 `mount / hydrate / update / destroy`。它们使用生产者自己的 registry、路由、loader、runtime context 和 React renderer。
2. MF 根据当前 `bridge.exposes` 配置生成 Node/browser 入口，分别导出 `createModernServerBridge({ renderApplication })` 和 `createModernBrowserBridge({ createApplication })`。构建只生成代码，实际 SSR 在请求时执行；普通 exposes 自动扫描尚未实现。
3. Host 的 `createRemoteAppComponent` 使用 `useId` 派生本次挂载的 ID，在 lazy 加载前以 `deferRender: true` 预注册；内层 `RemoteAppWrapper` 服务端生命周期补齐路由参数后激活同一任务。`BridgeSSRContext` 与任务集合由 MF 的 `api.extendStreamSSR` 集成为每次请求单独创建。
4. 本商品后台的 Host 通过 MF 加载生产者 Node 模块，在自己的进程调用 `provider.renderStream`，最终执行生产者 `renderApplication`。没有启动额外 SSR 服务，也没有调用 HTTP 渲染接口；静态资源 HTTP 加载与服务端渲染传输是两回事。
5. Host 原始 React 流先经 `hostPieces`，首段包含 Modern shell marker，后续复用 `htmlFrames`；Remote 流从头使用服务端 `htmlFrames`。分帧保持字节顺序，将完整 HTML 片段送往脚本隔离与组合器。Host 仍输出原始 HTML，Remote 才包装为 `accept(instanceId, frame)`。
6. Host shell 写出后放行 Remote 帧，与 Host 后续内容交错发送；不等待整个 Host 完成、浏览器首绘或 Host 水合。生产者加载和 SSR 可以提前开始，晚出现的容器由浏览器队列处理。

### 浏览器与水合

浏览器运行的是 `bridgeStreamBootstrap`，不是服务端分帧器。它目前借 `getStyleTags` 注入，确保早于 `accept` 指令执行；独立的 early-bootstrap hook 仍待实现，需要保留执行顺序和 CSP nonce。bootstrap 按实例等待容器与 CSS，使用 `template.innerHTML` 解析完整片段后插入，并执行 React 生成的完成脚本。初次清理 Host 的 Remote loading 由 bootstrap 完成；后续 Suspense fallback 的替换算法来自 React，我们在服务端改写其已知 helper 名称以隔离实例。

`window._SSR_DATA_READY` 是普通 Modern 页面入口的 Host 数据就绪 Promise，用于防止异步入口脚本早于首屏数据启动；它不表示 Remote 完成。当前 Remote SSR 不经过完整页面模板，浏览器入口使用独立 application API，因此不创建或等待这个全局信号。若未来把多个完整 Modern 页面模板直接拼入同一 document，会有 resolver 和页面数据覆盖风险，不能原样复用这条路径。

当前 progressive 路径在生产者完整 shell marker 与初始 snapshot 就绪后发送 `ready`，浏览器容器和 CSS 就绪后即可由生产者自己的 `hydrateRoot` 开始水合。后续 HTML 和 `update` 帧继续到达，生产者恢复的 pending Promise 随数据更新完成，React 接管后到的 Suspense 区域。HTML 与数据流结束后发送 `done`；它用于完成与清理，不会再次调用 `hydrateRoot`。未提供 progressive 状态的旧 provider 仍走完整 snapshot 的兼容路径，等待 `session.done` 后水合。

snapshot 是协议版本、React 版本、ID 前缀、URL、basename、props、initialData、routerData 等可序列化初始状态，不是完整 runtime context 或任意组件状态。Host 不理解 loader 结构，只转发给生产者；生产者把路由数据交给自己的 Router 恢复。SSR 会话不会同时启动独立 CSR 渲染，消费者参数更新排在初始化后，复用现有 root；无 SSR 会话才直接 CSR 挂载。失败/超时/取消沿现有策略处理，最终失败可整页转 `csr=1`。

当前已经实现“shell 先水合，deferred 区域继续流式展示与水合”。初始 shell 仍必须等待非 deferred 的必要 loader 数据与 CSS；只把已声明为 pending 的结果留给后续 `update`，并不是任意 loader 都能跳过等待。同一生产者可有多个应用实例，但不同生产者仍不得共用 React/ReactDOM/Router/Modern runtime singleton：Modern 还有应用级 registry 全局状态，相同 React 版本也不自动消除覆盖风险。

### 风险、验证计划与落地判断

- HTML 分帧与片段插入是自定义集成；`htmlparser2` 与浏览器片段解析并不完全相同，特殊 HTML 上下文、字节切分、大帧和缓存限制需要真实浏览器覆盖。
- React 完成脚本改名、Suspense DOM 完成检测依赖内部格式，不是 React 承诺稳定的公开组合协议。未知脚本形态当前原样放行，可能漏改或部分隔离。应建立经过验证的版本/特性准入，并对已识别但无法安全适配的 React 指令明确失败；不能把所有普通业务脚本一概误判。
- 测试计划是 React 19 全部稳定版本（含 patch）、React 18 大多数稳定版本（明确清单与遗漏理由）、React 17 最新稳定版。React 17 只覆盖当前可支持的通用 CSR；它没有当前流式 SSR 使用的 React 18+ API。完整功能矩阵尚未落实，本商品后台和提前水合矩阵的 renderer 证据覆盖 18.3.1 / 19.2.8。另已对 React 18 全部稳定版本及两个 React 19 版本完成 Node UTF-8 输出缺陷的专项检测，见下文；该专项结果不等于所有 Bridge 功能通过版本矩阵。
- 一个文档所有者、独立 runtime 和显式 snapshot 可以规避当前全局信号冲突；允许完整页面嵌入或跨应用共享 runtime，需要另外改造。`getStyleTags` 注入 JS 的职责问题可以通过框架接口修正。已经实现的初始状态和 deferred 更新消除了等待全部数据才能水合的限制，但仍需核对初始 shell、Promise 恢复及后到边界的行为。
- React 私有输出依赖的风险只能通过版本约束和持续回归降低，不能靠一次测试彻底消除。正式落地前仍需版本矩阵、跨版本与多实例真实浏览器回归、并发/慢客户端/代理缓冲/断连/内存背压验证、错误诊断和灰度回滚。CSR 降级降低故障影响，不证明 SSR 组合逻辑绝不会出错。

客观判断：当前 Demo 证明了限定版本和场景的可行性；受控版本、页面形态与能力范围下有可落地路径，但当前不能据此承诺生产就绪，或任意生产者升级 React 后都自动兼容。失败版本必须修复、禁用或明确排除，不能把测试目标提前当成通过保证。

### 与 Service App 的复用和失败边界

MF #5164 已实现 Service middleware 与 `mf-bridge-service/1` HTTP 协议。Service 在自己的 Node 进程执行同一 Modern `renderApplication`，Host 将 HTTP 结果还原成统一 `BridgeSSRResult`，随后复用 HTML 分帧、React 指令隔离、CSS、`ready / update / done` 与生产者独立水合。Host 的普通本地 Node executor 和 HTTP executor 的区别在执行位置及获取结果的方式；Modern application API 不需要另一套 Service 实现。

纯 HTTP Service SSR 不要求 Host 加载或执行生产者 Node 产物。Host 的 Node 侧 loader 先返回描述和延迟执行的 provider，只有选择本地 SSR，或 HTTP metadata 被接受前失败且明确设置 `localFallback: true` 时，才执行 Node 产物。Service Demo 的正常 HTTP 配置为 `localFallback: false`；专用故障场景才开启回退。版本校验仍然适用，HTTP metadata 接受后的流错误不能拼接另一条本地流，而是走一次整页 `csr=1` 降级。浏览器水合仍需匹配 revision 的生产者 browser expose。

Service Demo 已记录阻断 Host 下载/执行生产者 Node 产物后 HTTP 提前水合仍正常、本地执行被同一 guard 阻断并转 CSR 的验收。具体代码、命令与证据见其 `VERIFICATION.md`；这些不是本商品后台本轮重跑的结果。CSR Host 在页面加载后请求 Service 的路径仍采用完整结果后水合，不能将初始 SSR 文档的提前水合承诺直接套用到它。

### React 18 Node 流输出补丁

[React issue #31134](https://github.com/react/react/issues/31134) 对应 Node `renderToPipeableStream` 在部分多字节字符缓冲边界写入多余 NUL 的问题，官方修复见 [React PR #26228](https://github.com/facebook/react/pull/26228)。专项检测在 dev/prod 下均复现于 18.1.0、18.2.0、18.3.0、18.3.1；18.0.0、19.0.0、19.2.8 未复现。`renderToReadableStream` 对照未复现，但尚未验证用它替换 Modern renderer 的完整集成。

Service Demo 通过 `patches/react-dom@18.3.1.patch` 和 pnpm patched dependencies 应用与上游一致的截断修复，没有在协议层删除 NUL。本目录未加入该补丁，因此之前的商品后台成功记录只能证明记录中的页面场景，不能证明未打补丁的 React 18.3.1 对所有内容安全。本次没有改变商品后台依赖或重跑该兼容性专项。

### 后续 Modern 内置的包归属

以下是下一阶段的方向，尚未改动包归属、peer dependencies 或公开入口：

- 实际引用 MF 的 Modern 发布包声明 `@module-federation/enhanced` peer；MF API 统一从 `@module-federation/enhanced/runtime` 导入，并确保构建初始化与调用使用同一应用内的 MF 实例。
- 通用 Bridge 组件、协议和只依赖 MF/Bridge 契约的 `loadBridgeRemote` 下沉到 Bridge 包；Bridge 不反向依赖 Modern。
- Modern 专属 application 适配、构建生成及 `extendStreamSSR` 接入放入 Modern，通过 `@modern-js/runtime/mf` 等浏览器安全入口导出；Node 能力独立保留服务端边界。
- 普通 CSR 保持通用；独立应用 SSR 的 Modern 集成继续选择 `.server` 生命周期。Host 与生产者不因此共享 React 或 Modern runtime singleton。

当前适配仍位于 `@module-federation/modern-js-v3`。两条总 PR 保留现有可验证实现，等待后续内置迁移；本次文档与分支整理没有新增运行时能力。
