# Bridge SSR 验证记录

## 当前 review 入口与记录范围（2026-09-29）

保留的总 PR 为 [Modern #8941](https://github.com/web-infra-dev/modern.js/pull/8941) 和 [MF #5164](https://github.com/module-federation/core/pull/5164)。下文按实际执行日期保留独立 Root SSR、CSS、生命周期拆分、提前水合和后到内容交互的历史记录；不能将较早阶段的“等待完整 snapshot”或“未验证 HTTP”当作当前所有能力的结论，也不能将历史命令记为本次重新执行。

当前初始文档 SSR 已采用 `ready / update / done` 提前水合。MF HTTP Service executor 及纯 HTTP 不加载 Host Node 产物的验收位于另一个仓库 `/Users/bytedance/personal/mf-x-bridge-service-ssr`，分支 `feat/bridge-progressive-service-ssr`；详细命令和证据见该仓库 `VERIFICATION.md`。React 18 Node UTF-8 输出专项和 pnpm 补丁也在该 Service Demo；本商品后台没有加入该补丁，历史 18.3.1 成功场景不等于该版本对任意内容安全。

本次只归并基础分支的文档提交并更新 README/本记录，不改运行时代码、Demo 配置、依赖或锁文件，没有同步 `main`。执行 `git diff --check`、文档 Biome 检查和差异范围检查；Biome 当前不处理 Markdown，因此不将它记为文档格式通过。构建、包单测、类型检查、浏览器和全量 E2E 本次未重复执行，原因是相对整理前的代码变更只有 Markdown；下文保留各轮实际通过与未覆盖的范围。Modern 内置 MF 的包归属迁移尚未执行。

## 独立 Root SSR 首轮记录（2026-09-24）

验证日期：2026-09-24。该记录对应两个本地工作区的实现：Modern `modern-js-bridge-ssr-demo` 和 MF `core-bridge-ssr-demo`。它证明的是 Host 本地执行生产者 Node 产物的链路，不包含远程 HTTP SSR 执行器。

## 环境与判定标准

- Node.js 24；Host 和库存应用使用 React/ReactDOM 19.2.8，商品应用使用 18.3.1。
- Host `modern serve` 运行于 4500。4501/4502 仅运行 `http-server dist`，分发生产者的 manifest、Node entry/chunk 和浏览器资源。
- 业务 API 由 Host 提供，数据保存在 SQLite。loader 通过真实 HTTP 请求获取列表和延迟的汇总/流水，组件通过真实 `Suspense` / `Await` 消费结果。
- 成功判定包括：记录到真实帧、完成顺序可反转、在 hydration 前捕获插入的 SSR 节点、完成后保留同一 DOM 引用、真实交互可用、健康 SSR 场景无控制台或页面错误。故障注入场景单独区分预期资源错误。仅在响应文本中找到商品名称不算通过。

以下时间是相对于各次页面导航的本地浏览器计时，记录的是独立应用 `done` 完成时刻，不代表首帧时间或性能承诺。

## 独立流与 hydration

| 页面参数                               | 商品 React 18 完成 | 库存 React 19 完成 | DOM 与错误检查                                                             |
| -------------------------------------- | -----------------: | -----------------: | -------------------------------------------------------------------------- |
| `?streamDelay=1000&activityDelay=2200` |          1246.7 ms |          2451.7 ms | 两者 `capturedBeforeHydrate: true`、`reused: true`；无错误                 |
| `?streamDelay=2200&activityDelay=800`  |          2253.8 ms |           859.2 ms | 两者 `capturedBeforeHydrate: true`、`reused: true`；无错误                 |
| `?streamDelay=4000&activityDelay=5000` |          4021.9 ms |          5020.3 ms | 274 ms 时 Host 侧栏已可交互，两个应用都未 `done`；最终两者仍保留原 SSR DOM |

所有故障产物恢复并完成最终构建后，再次访问 `/?streamDelay=1000&activityDelay=1800`：商品完成于 1165.4 ms，库存完成于 1966.3 ms；两个应用均 `before: true`、`reused: true`，错误列表为空。

真实浏览器的 renderer 列表为 `19.2.8 / 18.3.1 / 19.2.8`。快速应用无需等待慢速应用完成；Host 也无需等待所有 Remote 完成才能响应交互。

框架独立矩阵另用真实 React 18/19 renderer 与 React Router `Await`，交错两个应用各自的两个 Suspense boundary。三种完成顺序均通过：没有全局 `$RC` 覆盖，没有未插入的隐藏 segment 或 pending marker，立即 hydration 没有 recoverable error，保留 DOM 且点击后状态更新。该矩阵使用框架构建后的分帧、脚本隔离和 bootstrap，不使用 Demo 自制 renderer。

## 业务与路由

| 场景                         | 观察结果                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| SSR 商品分类筛选             | 所选分类返回 6 条商品                                                                                                                   |
| SSR 仓库切换                 | 可切换到上海前置仓并显示对应库存                                                                                                        |
| 商品应用内详情               | 使用生产者自己的 memory router；详情跳转不要求改变 Host 的地址栏                                                                        |
| 直接访问 `/products/SH-1001` | 服务端返回对应详情；商品应用完成于约 44.9 ms，hydration 保留原 DOM，无错误                                                              |
| CSR 库存写入                 | 实际提交 `+12`，库存从 8 变为 20；刷新后仍读取到 20                                                                                     |
| CSR 商品状态                 | `SH-1003` 的上下架操作经真实 API 完成                                                                                                   |
| 最终 SSR 分页与仓库隔离      | 商品进入第 `2 / 3` 页，库存切换上海前置仓，双方状态互不干扰                                                                             |
| 最终 SSR 库存写入与详情隔离  | 上海仓 `SH-1001` 库存实际 `+5`，从 11 到 16；API 读回 SQLite 中的 16。商品进入 `SH-1007` 详情后，库存仍显示上海仓和 16，Host URL 未变化 |
| 故障降级后的分页             | CSR 页面从第 1 页切换到第 `2 / 3` 页，两个应用仍正常，未再次导航                                                                        |

SQLite 的修改会保留。复验写入操作时，应以当前数据库数值为起点，不能假设仍是初始种子数据。

## Node 产物失败与整页 CSR

本次故障操作针对生成的 `product-app/dist/bundles/commerce_products.js`：临时移走该 Node entry，同时保留商品浏览器资源和两个静态服务。重启 Host 清除已加载的 MF Node 模块缓存后，Node entry 请求实际返回 404。

浏览器导航记录仅有：

```text
http://127.0.0.1:4500/
http://127.0.0.1:4500/?csr=1
```

降级页面没有 Bridge SSR 帧，三个 React renderer 正常加载；两个应用正常展示，商品分页进入 `2 / 3`，没有页面错误或第二次跳转。故障注入后已恢复原 Node entry 并重启 Host。

另一次测试同时移走商品 Node entry 和浏览器 entry。浏览器仍只有 `/` → `/?csr=1` 两次 document 加载，随后商品区域显示“工作区暂时无法打开”的 ErrorBoundary（浏览器脚本 404 / MF `RUNTIME-008`，属于本次注入的预期错误），库存应用继续加载，Host 侧栏仍可点击，没有自动再次刷新。不能把此结果表述为“CSR 没有任何错误”；它证明 CSR 本身也失败时错误可展示且没有重载循环。两个 entry 均已恢复。

复验时的顺序是：保存该生成文件 → 停止 Host → 临时移走 Node entry → 重新启动 Host → 访问 `/` 并观察一次 CSR 导航 → 恢复 Node entry → 再次重启 Host。不要停止整个生产者静态服务，否则浏览器资源也会缺失，无法证明 CSR 恢复能力。不要把故障注入写入应用代码或提交生成文件的变更。

`csr=1` 依赖 Host 开启 Modern 的 `server.ssr.forceCSR`。默认请求仍走 SSR；不支持在已经输出内容后把另一份本地渲染流接回原实例。浏览器缺失最终完成帧的情况由 watchdog 超时兜底；并非一旦取得流就算 SSR 成功。

## 构建与自动化检查

下面列出本次验证所用的框架检查入口。工作区路径应替换为自己的本地位置。

```bash
cd /Users/bytedance/outter/core-bridge-ssr-demo
pnpm --filter @module-federation/modern-js-v3 run test
pnpm --filter @module-federation/modern-js-v3 run build
pnpm --filter @module-federation/bridge-react run test
pnpm --filter @module-federation/bridge-react run build

node packages/modernjs-v3/tests/stream-react-versions.cjs \
  /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr/product-app \
  /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr/inventory-app

cd /Users/bytedance/outter/modern-js-bridge-ssr-demo
pnpm --filter @modern-js/runtime test
pnpm --filter @modern-js/runtime exec tsc --noEmit --pretty false
pnpm --filter @modern-js/runtime run build
pnpm --filter @modern-js/plugin run build
pnpm exec biome check \
  packages/runtime/plugin-runtime/src/router/runtime/routerHelper.ts \
  packages/runtime/plugin-runtime/src/router/cli/code/templates.ts \
  packages/runtime/plugin-runtime/tests/router/routeModuleRegistry.test.ts
git diff --check

cd examples/module-federation/bridge-ssr
pnpm run typecheck
pnpm run build
```

| 检查                   | 结果                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| MF Modern 包           | 62 个测试通过，构建通过                                                                               |
| Bridge React 包        | Jest 58 个、Rstest 11 个测试通过，构建通过                                                            |
| React 18/19 真实流矩阵 | 三种交错顺序通过，退出码 0                                                                            |
| Modern runtime 包检查  | 20 个测试文件、55 个测试通过，包含路由隔离回归；TypeScript、Biome 和 runtime 构建通过                 |
| Demo                   | 类型检查、三个应用生产构建通过                                                                        |
| 变更文件格式           | 定向格式检查通过                                                                                      |
| MF 全仓格式检查        | 已运行 `pnpm exec prettier --check .`；无关 Next 示例缺少 `@tailwindcss/typography`，未通过该全仓检查 |

Modern 新增回归覆盖 application 服务端/浏览器生命周期、shell readiness、SSR/browser 的 `useId` 路径一致性，以及独立应用的路由模块注册表。开发时曾运行 `pnpm --filter @modern-js/runtime exec rstest tests/router/templates.test.ts --update` 更新两份生成代码快照；最终 55 个测试运行没有使用快照更新参数。

本次没有以包单测替代真实浏览器验收，也没有把尚未运行的完整 Modern 全仓测试或全部 E2E 套件记为通过。

## 本地证据

以下 JSON 是本轮机器上的浏览器采集记录，位于临时目录，并非随仓库分发的测试 fixture：

| 文件                                        | 内容                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `/tmp/bridge-ssr-final.json`                | 最终恢复健康后的 renderer、完成时序、原 DOM 复用和空错误列表          |
| `/tmp/bridge-ssr-final-interaction.json`    | SSR 后分页与上海仓切换互不干扰                                        |
| `/tmp/bridge-ssr-inventory-api.json`        | 上海仓 SH-1001 调整后由 API 读回可用库存 16                           |
| `/tmp/bridge-ssr-final-detail-state.json`   | 商品详情 SH-1007 与另一应用的上海仓/16 库存状态共存                   |
| `/tmp/bridge-ssr-acceptance-forward.json`   | 商品先完成、renderer 版本、帧时间及 DOM 复用                          |
| `/tmp/bridge-ssr-acceptance-reverse.json`   | 库存先完成及 DOM 复用                                                 |
| `/tmp/bridge-ssr-early-interaction.json`    | Remote 未完成时的 Host 交互                                           |
| `/tmp/bridge-ssr-early-complete.json`       | 慢流最终完成、DOM 复用及错误检查                                      |
| `/tmp/bridge-ssr-direct-detail.json`        | 详情直达 SSR 与 DOM 复用                                              |
| `/tmp/bridge-ssr-fallback.json`             | Node 404 后的一次 CSR 导航与 renderer                                 |
| `/tmp/bridge-ssr-fallback-interaction.json` | 降级后分页可用、无新增导航或错误                                      |
| `/tmp/bridge-ssr-double-failure.json`       | CSR 也缺少商品浏览器 entry 时的预期错误边界、其他应用可用及无重载循环 |

最终页面截图为本机 `/tmp/bridge-commerce-ssr.png`（1440 × 2637，已检查布局正常，不随仓库分发）。

临时证据可能被系统清理；复验时应重新采集自己的结果。计时和节点引用记录来自真实页面，不参与业务渲染，也不会生成模拟 SSR 内容。

## 支持边界

- 已验证本地 Node 产物 SSR；远程 HTTP SSR service executor 和 HTTP → 本地重试未实现。
- 已验证上述 React 18.3.1/19.2.8 组合。完成脚本适配依赖 React 内部指令形态，不是任意 React 版本的兼容保证或 JavaScript 沙箱。
- React Form Actions 的 document 级 replay 协议未被当前隔离机制支持；RSC 未纳入本 Demo 的实现和验收。
- Remote 流支持内联 classic 完成脚本，并转发 CSP nonce。External/module 脚本不在这条重放路径内；完整 CSP 策略部署没有单独完成浏览器验收。
- Node entry 404 的一次降级、浏览器 entry 同时缺失时的错误展示和无重载循环均已做真实浏览器验证；超时、截断、取消和 hydration 错误有框架单测，不能据此声称所有网络故障都已在真实浏览器逐项注入。
- 两个 Remote 使用独立 memory router，当前不把每次应用内导航自动同步到 Host 地址栏。

## CSS 闪烁修复回归（2026-09-24）

修复前实际 `/inventory` 响应仅包含 Host CSS，浏览器在约 184.7 ms 已显示库存 HTML，生产者 CSS 约 224 ms 才开始请求、227.4 ms 完成；采集到 6 个 CSS 未就绪的 requestAnimationFrame。修复后冷请求中生产者 CSS 已在首次可见帧之前完成，`unstyled` 为空，库存仍保留原 SSR DOM。

首页响应的 head 中同时包含 Host、商品、库存三个 stylesheet，两个生产者链接均早于首个 Bridge 内容帧。正常网络双 Remote 浏览器采集结果：商品和库存首次可见时 `cssReady: true`，无无样式帧；每个 CSS 仅有一个活动 head link；React 18/19 的原 SSR DOM 均复用，商品与库存分别在约 1095.2 ms / 1895.8 ms 完成，错误列表为空。随后商品进入第 `2 / 3` 页、库存切到上海前置仓，互不影响。

本轮命令：

```bash
cd /Users/bytedance/outter/core-bridge-ssr-demo
pnpm --filter @module-federation/bridge-react run test
pnpm --filter @module-federation/bridge-react run build
pnpm --filter @module-federation/modern-js-v3 test -- src/bridge-stream/bootstrap.spec.ts
pnpm --filter @module-federation/modern-js-v3 run build
node packages/modernjs-v3/tests/stream-react-versions.cjs \
  /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr/product-app \
  /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr/inventory-app
pnpm --dir /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr run build
```

Bridge Jest 59 + Rstest 11 通过；Modern MF 命令实际运行全包，74 / 74 测试通过，其中 bootstrap 17 项。两个包构建、三个 Demo 生产构建、真实 React 18/19 流矩阵、变更文件格式检查通过。新增用例覆盖早期 CSS head 去重、晚到 metadata 顺序、CSS 加载前保留 loading、共享链接/已加载链接、两实例独立等待、错误/超时/取消及迟到 load 事件。

尝试通过 byted-browser 设置弱网时，工具报 `CDP error (Network.enable): Session with given id not found`，因此不把该场景记为通过；浏览器结果仅涵盖上述正常网络冷请求/双应用，延迟与失败规则另有框架回归测试。本轮没有修改 Modern runtime 或 Demo 业务代码，未重复 Modern 单测、全仓 E2E 或上一轮已被无关 Tailwind 依赖阻断的全仓 Prettier 检查。

本机证据：`/tmp/bridge-css-before-browser.json`、`/tmp/bridge-css-cold-browser.json`、`/tmp/bridge-css-response-proof.json`、`/tmp/bridge-css-home-browser.json`、`/tmp/bridge-css-interaction.json`。构建与矩阵日志：`/tmp/bridge-css-bridge-tests.log`、`/tmp/bridge-css-mf-build.log`、`/tmp/bridge-css-demo-build.log`、`/tmp/bridge-css-react-matrix.log`。这些是诊断采集，不参与应用渲染，不是模拟数据。

## 生命周期拆分回归（2026-09-28）

本轮把 Bridge 的服务端注册和浏览器生命周期拆到不同入口，`createHelpers.tsx` / `RemoteAppWrapper.tsx` 继续维护同一套 React 组件结构、`useId`、Suspense 和容器 JSX。Modern 的 Node 编译通过真实 `BridgeSSRPlugin` 将 `@module-federation/bridge-react/remote-lifecycle` 精确切换到 `.server` 入口；默认入口保留通用 CSR 能力。没有更改 exposes 配置方式、SSR 参数序列化或应用业务代码，也没有新增用户组件 hydration 不一致的诊断机制。

### 构建入口与自动化验证

使用构建后的 Bridge 包和 Rspack 插件执行 `bridge-platform-build.cjs`，而不是只用测试 mock 替换入口。React 18.3.1 和 19.2.8 各执行以下五种真实 Rspack 构建，共十项：

| 构建场景 | 检查结果 |
| --- | --- |
| Node + 插件，ESM `import` | 仅选入服务端生命周期，SSR 注册 ID 与共享 JSX 的容器 ID 对应 |
| Node + 插件，CommonJS `require` | 选入对应的 CJS 服务端入口，并与调用方的 SSR context 保持一致 |
| Node 不启用插件 | 保留默认入口，不注册 SSR 任务 |
| 浏览器启用插件 | 仍选入浏览器入口，插件不改变浏览器实现 |
| 浏览器不启用插件 | 保留通用 CSR 路径，不依赖 Modern SSR runtime |

矩阵中的最小 React fixture 会在同一 Host 内渲染两次相同 Remote，检查 ID 不重复，并执行真实 hydrate、点击、props 更新和卸载。ESM/CJS 两条 SSR 路径均复用原容器和 Remote DOM，props 更新保留各自状态，最终销毁两个 root；通用 CSR 路径没有 SSR runtime，直接 mount 后也能完成上述交互。矩阵通过 JSDOM 运行浏览器产物，下面的商品后台验收另外使用真实 Chrome。

| 检查 | 本轮结果 |
| --- | --- |
| MF 包构建 | Turbo 依赖构建 20 / 20 通过 |
| Bridge React 单测 | Jest 60 / 60，Rstest 11 / 11 通过 |
| MF Modern 单测 | 10 个测试文件、74 / 74 通过 |
| Rspack 入口矩阵 | 两个 React 版本、十项构建通过；两个 SSR 入口和通用 CSR 的生命周期检查通过 |
| React 18/19 流矩阵 | 三种交错完成顺序通过，`hydrationErrors` 均为 0 |
| Demo | Host、商品、库存的类型检查与生产构建通过 |

重建包产物后，MF Modern 的两项旧测试最初失败：Rstest 外置了 Bridge 包，测试没有经过服务端入口选择。测试配置现通过 `bundleDependencies` 将 Bridge 纳入构建，并安装同一个 `BridgeSSRPlugin`；重新运行全部 74 项通过。没有修改生产逻辑、放宽断言或增加超时时间来绕过失败。

复验命令：

```bash
cd /Users/bytedance/outter/core-bridge-ssr-demo
pnpm exec turbo run build --filter=@module-federation/modern-js-v3
pnpm --filter @module-federation/bridge-react run test
pnpm --filter @module-federation/modern-js-v3 run test

node packages/modernjs-v3/tests/bridge-platform-build.cjs \
  /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr/product-app \
  /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr/inventory-app
node packages/modernjs-v3/tests/stream-react-versions.cjs \
  /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr/product-app \
  /Users/bytedance/outter/modern-js-bridge-ssr-demo/examples/module-federation/bridge-ssr/inventory-app

cd /Users/bytedance/outter/modern-js-bridge-ssr-demo
pnpm --dir examples/module-federation/bridge-ssr run typecheck
pnpm --dir examples/module-federation/bridge-ssr run build
```

### 真实浏览器回归

重新构建三个应用并重启 Host 后，通过 byted-browser 验证 Chrome 中实际加载的 React renderer 为 `19.2.8 / 18.3.1 / 19.2.8`。完成时刻仍以各次导航为起点，不能当作首屏性能指标。

| 页面参数 | 商品 React 18 完成 | 库存 React 19 完成 | 检查结果 |
| --- | ---: | ---: | --- |
| `?streamDelay=1000&activityDelay=1800` | 1158.5 ms | 1955.9 ms | 两者在 hydration 前已捕获 SSR DOM，hydration 后仍复用；错误列表为空 |
| `?streamDelay=1800&activityDelay=600` | 1816.2 ms | 621.6 ms | 完成顺序反转，两者仍复用 SSR DOM；错误列表为空 |

两次导航中商品和库存的首次可见检查均为 `cssReady: true`，`unstyled` 为空。第一组完成后，商品切到 `2 / 3` 页、库存切到上海前置仓，双方状态独立，两个应用仍保留原 SSR 根节点，没有新增错误。

直接访问 `?csr=1` 时，页面没有 `__MF_BRIDGE_SSR__`，帧数为 0，商品显示 6 行、库存显示 18 行。随后商品切到 `2 / 3` 页（SH-1007 至 SH-1012），库存切到上海前置仓，仍没有 SSR runtime 或帧，错误列表为空。Node 产物故障导致的一次降级和双重故障无重载循环的真实浏览器证据仍见前面的 2026-09-24 记录，本轮没有重新注入这两项故障。

### 检查边界与本地证据

本轮没有修改 Modern runtime，未重复运行其整包单测、类型检查和独立构建；Demo 生产构建仍实际使用已链接的 Modern runtime。未运行两个仓库的完整 E2E / 全仓测试套件，当前验收采用受影响包单测、真实构建矩阵与商品后台浏览器回归。MF 全仓 `pnpm exec prettier --check .` 已尝试，因无关 Next 示例缺少 `@tailwindcss/typography` 报错，不能记为全仓格式通过。当前 PR 改动文件的 Prettier 检查通过，按仓库 `.prettierignore` 排除 pnpm 生成的锁文件。Modern 的 `pnpm exec biome check examples/module-federation/bridge-ssr/README.md examples/module-federation/bridge-ssr/VERIFICATION.md` 未处理文件（当前 Biome 不检查这些 Markdown）；文档通过 `git diff --check`，没有将该 Biome 命令记为通过。

下列证据保存在当前机器的 `/private/tmp`，不会随仓库分发，也不参与 Demo 渲染：

| 文件 | 内容 |
| --- | --- |
| `bridge-split-final-build.log` | 20 项依赖构建结果 |
| `bridge-split-final-bridge-tests.log` | Bridge Jest 60 + Rstest 11 |
| `bridge-split-server-wiring-mf-tests.log` | 启用真实服务端插件后的 MF Modern 74 项测试 |
| `bridge-split-final-platform-matrix.log` | 两个 React 版本的 ESM/CJS hydration 与 CSR 产物矩阵 |
| `bridge-split-final-stream-matrix.log` | 三种交错顺序及零 hydration error |
| `bridge-split-demo-typecheck.log`、`bridge-split-demo-build.log` | 三个应用类型检查和生产构建 |
| `bridge-split-ssr-browser.json` | 商品先完成、renderer、DOM 复用、CSS 首次就绪 |
| `bridge-split-reverse-browser.json` | 库存先完成、DOM 复用、CSS 首次就绪 |
| `bridge-split-interaction.json` | SSR 后商品分页与库存仓库切换 |
| `bridge-split-csr-browser.json` | 无 SSR runtime / 帧的 CSR 渲染 |
| `bridge-split-csr-interaction.json` | 纯 CSR 商品分页与库存仓库切换，无错误或 SSR 帧 |
| `bridge-split-format-full.log` | 全仓格式检查的缺失依赖错误 |
| `bridge-split-final-format.log` | 当前 PR 改动文件格式检查通过 |


## 提前水合回归（2026-09-28，新 worktree）

本轮在独立 worktree 实现提前水合，不覆盖前述历史验证环境：

- MF：`/Users/bytedance/outter/core-bridge-progressive-hydration`。
- Modern：`/Users/bytedance/outter/modern-js-bridge-progressive-hydration`。
- 新 Demo 的 Host / 商品静态资源 / 库存静态资源使用 `4600 / 4601 / 4602`；旧 Demo 的 `4500 / 4501 / 4502` 保留。

生产者 Modern 在完整 shell 就绪后发送 `modern-application/2` 初始状态，将未完成 loader 值编码为实例内的 pending 引用，后续通过 fulfilled / rejected 数据更新恢复浏览器 Promise。MF 在生产者 shell marker 到达后发送 `ready`，并行转发后续 HTML 和 `update`；Bridge 在 `ready` 时调用生产者 hydrate，不再等待该 Remote 的 `done`。同一套生产代码仍兼容没有 progressive hydration 信息的最终 snapshot 路径。

### 真实构建矩阵

`packages/modernjs-v3/tests/progressive-hydration.cjs` 使用构建后的 Modern / MF 包，为 React 18.3.1、19.2.8 分别真实编译 Node 与浏览器产物，共四次 Rspack 构建。浏览器产物在 JSDOM 执行；registry 和可控制完成时机的 loader 是测试 fixture，应用生命周期、SSR renderer、路由、数据恢复、MF 流组合及 bootstrap 使用实际框架实现。该矩阵与下面的真实 Chrome 商品后台验收分别记录，不能把 JSDOM 当成真实浏览器验收。

| 场景 | 结果 |
| --- | --- |
| 三个独立 root：React 18 同一生产者两实例，另一个 React 19 生产者 | 三个 shell 均在 deferred 数据完成前可点击，原 SSR DOM 复用，实例状态互不干扰 |
| deferred 按正序、反序完成 | 两种顺序通过；首个 details 区域完成后即可交互，另一个 secondary 区域仍在等待；每组转发六个数据更新 |
| React 18 deferred 拒绝 | 对应 `Await` error boundary 展示业务错误，其余应用继续完成，无 hydration error |
| React 19 deferred 拒绝 | 同上，拒绝状态按实例传递，没有将可处理的业务拒绝误判为传输失败 |
| 提前卸载 React 18 的第二个实例 | 被取消实例销毁，迟到内容不恢复它；另外两个实例继续完成并保持交互 |
| 纯 CSR | 两个版本直接 mount、交互和销毁通过，不依赖 SSR 会话 |

矩阵共六个场景，所有 `errors` 列表为空。另行重跑旧 `bridge-platform-build.cjs` 十项真实构建和 `stream-react-versions.cjs` 三种流交错顺序，均通过，覆盖旧入口选择、ESM/CJS 水合、CSR 和最终 snapshot 兼容路径。

### 单测、类型与构建

| 检查 | 本轮结果 |
| --- | --- |
| Bridge React | Jest 61 / 61、Rstest 11 / 11 通过 |
| MF Modern | 10 个文件、81 / 81 通过，包含 bootstrap 24 项 |
| Modern runtime | 21 个文件、69 / 69 通过；application 子集三个文件、19 项另行通过，这 19 项已经包含在 69 项中 |
| MF 包构建 | Turbo 依赖构建 20 / 20 通过；最终构建其中 18 项命中缓存 |
| Modern 构建 | app-tools、runtime、server-runtime 及所需依赖构建通过；修改完成后的 runtime 完整构建和声明生成通过 |
| Modern 类型检查 | runtime `tsc --noEmit --pretty false` 退出码 0 |
| Demo | 三个应用最终类型检查和生产构建通过 |
| MF 全仓格式 | 最终 `pnpm exec prettier --check .` 通过；本轮初检发现矩阵脚本格式问题，格式化后重新运行通过 |
| Modern 变更文件风格检查 | Biome 检查 17 个文件通过，无需修复 |

新增 Bridge 测试使用真实 React root：`ready` 到达后 producer hydrate 已执行，而 `done` 仍 pending；同一 SSR button 的点击使计数更新，snapshot / updates 对象原样透传，`done` 后不重复 hydrate。bootstrap 测试覆盖两实例相同数据 ID 隔离、ready 后传输失败、CSS 与 pending Suspense、取消、页面退出和未消费数据的 UTF-8 字节限制。测试发现并修复了“HTML 传输已经完成、但更新数据尚未消费时取消，reader 永久等待”的问题，release / pagehide 两种路径均有回归。

本轮主要复验命令：

```bash
cd /Users/bytedance/outter/core-bridge-progressive-hydration
pnpm exec turbo run build --filter=@module-federation/modern-js-v3
pnpm --filter @module-federation/bridge-react run test
pnpm --filter @module-federation/modern-js-v3 run test
pnpm --filter @module-federation/modern-js-v3 exec rstest run src/bridge-stream/bootstrap.spec.ts
pnpm exec prettier --check .

node packages/modernjs-v3/tests/progressive-hydration.cjs \
  /Users/bytedance/outter/modern-js-bridge-progressive-hydration/examples/module-federation/bridge-ssr/product-app \
  /Users/bytedance/outter/modern-js-bridge-progressive-hydration/examples/module-federation/bridge-ssr/inventory-app
node packages/modernjs-v3/tests/bridge-platform-build.cjs \
  /Users/bytedance/outter/modern-js-bridge-progressive-hydration/examples/module-federation/bridge-ssr/product-app \
  /Users/bytedance/outter/modern-js-bridge-progressive-hydration/examples/module-federation/bridge-ssr/inventory-app
node packages/modernjs-v3/tests/stream-react-versions.cjs \
  /Users/bytedance/outter/modern-js-bridge-progressive-hydration/examples/module-federation/bridge-ssr/product-app \
  /Users/bytedance/outter/modern-js-bridge-progressive-hydration/examples/module-federation/bridge-ssr/inventory-app

cd /Users/bytedance/outter/modern-js-bridge-progressive-hydration
pnpm --filter @modern-js/app-tools... --filter @modern-js/runtime... --filter @modern-js/server-runtime... run build
pnpm --filter @modern-js/runtime test
pnpm --filter @modern-js/runtime exec tsc --noEmit --pretty false
pnpm --filter @modern-js/runtime run build
pnpm --dir examples/module-federation/bridge-ssr run typecheck
pnpm --dir examples/module-federation/bridge-ssr run build
```

### 最终产物的真实 Chrome 提前交互

最终重建 Modern / MF 及三个 Demo 应用并重启 Host 后，通过 byted-browser 在真实页面观测协议时序，并点击已有的库存“调整库存”业务按钮；没有往应用注入替代 renderer 或模拟 HTML。浏览器加载的 React renderer 为 `19.2.8 / 18.3.1 / 19.2.8`。

| 事件（导航后时间） | 商品先完成：`?streamDelay=4500&activityDelay=5000` | 库存先完成：`?streamDelay=5000&activityDelay=3500` |
| --- | ---: | ---: |
| 商品 React 18 ready | 273.5 ms | 52.0 ms |
| 库存 React 19 ready | 274.1 ms | 52.5 ms |
| 点击库存“调整库存” | 420.8 ms | 108.1 ms |
| 检查到真实 React 模态框已打开 | 471.9 ms | 159.3 ms |
| 商品流完成 | 4729.9 ms | 5045.2 ms |
| 库存流完成 | 5234.7 ms | 3543.9 ms |

两组点击时两个 Remote 均未 done，模态框在慢数据仍 pending 时已经打开，并在两条流随后完成后保持打开。两个 Remote 的原容器与应用根 DOM 均复用，错误列表为空。两组 CSS 首次可见检查均为 `cssReady: true`，`unstyled` 为空。

这些是各次导航的观测时刻，不是固定性能承诺；协议 `ready` 表示允许启动水合，不能把它直接当成整个应用已经交互的时刻，实际提前交互由模态框行为证明。

最终产物另行访问 `http://127.0.0.1:4600/?csr=1`：没有 `__MF_BRIDGE_SSR__`，帧列表为空，商品显示 6 行、库存显示 18 行。点击库存“调整库存”后模态框正常打开，错误列表为空。

本轮没有重新注入真实页面的 Node entry 故障并执行 reload → CSR 验收；这次验证包括数据更新后期失败的单测、deferred 拒绝与取消的真实构建矩阵，以及纯 CSR 运行。之前的真实降级证据保留在上文，不能冒充本轮重测结果。两个仓库完整 E2E / 全仓测试套件未运行，本轮采用受影响包单测、真实构建矩阵和实际 Demo 浏览器回归；尚未验证任意 React 版本、RSC、Form Actions 或远程 HTTP SSR service executor。

本轮机器上的证据文件仍是诊断产物，不参与业务渲染，也不会随仓库分发：

| `/private/tmp/` 下文件 | 内容 |
| --- | --- |
| `bridge-progressive-matrix.log` | 四次 Rspack 构建产物运行的六个提前水合场景 |
| `bridge-progressive-legacy-matrix.log`、`bridge-progressive-legacy-stream.log` | 十项旧入口构建与三种旧流交错顺序通过 |
| `bridge-progressive-ready-tests.log` | Bridge Jest 61 + Rstest 11 |
| `bridge-progressive-mf-final-test.log` | MF Modern 81 项，包括 bootstrap 24 项 |
| `bridge-progressive-modern-final-test.log` | Modern runtime 69 项 |
| `modern-progressive-application-tests.log` | 上述 Modern runtime 中 application 子集 19 项 |
| `bridge-progressive-core-final-build.log` | MF Turbo 20 项依赖构建 |
| `bridge-progressive-modern-build.log`、`bridge-progressive-modern-final-build.log` | Modern 依赖构建和最终 runtime 完整构建 |
| `bridge-progressive-modern-types.log` | Modern runtime 类型检查；无诊断，退出码 0 |
| `bridge-progressive-demo-final-typecheck.log`、`bridge-progressive-demo-final-build.log` | 三个 Demo 最终类型检查和生产构建 |
| `bridge-progressive-format-final.log` | MF 最终全仓 Prettier 通过 |
| `bridge-progressive-modern-biome.log` | Modern 变更文件 Biome 检查 17 项通过 |
| `bridge-progressive-browser-final.json` | 最终产物商品先完成：提前模态框交互、ready / update / done 时序、原 DOM 复用、CSS 首次就绪及空错误列表 |
| `bridge-progressive-browser-final-reverse.json` | 最终产物库存先完成：提前交互、原 DOM 复用、CSS 首次就绪及空错误列表 |
| `bridge-progressive-browser-final-csr.json` | 最终产物纯 CSR：无 SSR runtime / 帧，两个列表和模态框交互正常 |


### 库存流水后到内容的点击交互（2026-09-28）

`Activity` 在 `Await` 内为每条真实流水提供“查看详情”，通过组件自己的 React state 打开只读详情弹窗。用 `?streamDelay=5000&activityDelay=2500` 重新构建库存应用、重启 Host 后验证：215.0 ms 观察到流水 loading；2649.9 ms 捕获后到的服务端详情按钮，此时未挂载 React 点击事件；2687.1 ms 同一按钮水合后点击，2789.5 ms 弹窗打开；2891.0 ms 确认关闭，2992.9 ms 重开成功。商品流到 5147.4 ms 才完成。弹窗内容与所点流水一致，两个 Remote 原容器、应用根节点和详情按钮均复用，页面错误为空。

点击时库存自身的流已于 2671.3 ms 完成；本次证明后到区域自身能水合并交互，以及与仍未完成的商品流相互独立。不要将此记录描述为库存自身还有其他 pending 边界；该情况由前述真实构建矩阵验证。

已运行命令：

```bash
# Modern worktree 根目录
pnpm exec biome check --write examples/module-federation/bridge-ssr/inventory-app/src/routes/page.tsx examples/module-federation/bridge-ssr/inventory-app/src/routes/inventory.css

# Demo workspace
pnpm --filter @examples/bridge-ssr-inventory-app run typecheck
pnpm --filter @examples/bridge-ssr-inventory-app run build

# host 目录；重启此 demo 的 Host 以清除旧 Node 产物缓存
pnpm run serve

# 真实 Chrome，诊断探针仅观察流与 DOM、点击业务按钮
bytedbrowser raw --session bridge-activity-late-hydration --init-script /private/tmp/bridge-activity-interaction-probe.js open 'http://127.0.0.1:4600/?streamDelay=5000&activityDelay=2500'
bytedbrowser raw --session bridge-activity-late-hydration eval 'JSON.stringify(window.__bridgeActivityProof)'
bytedbrowser raw --session bridge-activity-late-hydration screenshot /private/tmp/bridge-activity-dialog.png
```

本次仅修改 Demo 交互与样式，没有修改框架运行时；未重复框架包单测、完整 E2E 或其他应用构建，也未新增复刻组件实现的单测。验证采用库存应用类型检查、双端生产构建及真实浏览器交互。证据：`/private/tmp/bridge-activity-browser-proof.json`、`bridge-activity-dialog.png`、`bridge-activity-typecheck.log`、`bridge-activity-build.log`。
