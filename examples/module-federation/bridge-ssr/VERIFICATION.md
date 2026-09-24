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
