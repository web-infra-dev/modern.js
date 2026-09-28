# Bridge SSR 验证记录

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
