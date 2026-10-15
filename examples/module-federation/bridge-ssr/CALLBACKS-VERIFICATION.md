# Bridge SSR 回调导出验证

分支：`feat/bridge-renderer-callbacks`。本轮使用完整根应用，两个生产者直接导出 `createBridgeComponent({ rootComponent, render, hydrate, renderStream })`，业务未实现渲染器或流组合器。

## Review 顺序

1. [`product-app/src/bridge.tsx`](product-app/src/bridge.tsx) 与 [`inventory-app/src/bridge.tsx`](inventory-app/src/bridge.tsx)：同一 Modern 回调 API，分别使用 React 18 / 19 的 Bridge 入口。
2. 两个生产者 `modern.config.ts`：普通 `config.exposes` 直接指向源码，没有 `bridge.exposes` 生成 provider。
3. [`host/src/components/Applications.tsx`](host/src/components/Applications.tsx)：首页同时消费两个完整应用。
4. [`Modern 浏览器回调`](../../../packages/runtime/plugin-runtime/src/mf/index.tsx) 与 [`Node 回调`](../../../packages/runtime/plugin-runtime/src/mf/server.tsx)：独立应用实例、传入根树与框架 snapshot。
5. MF 工作区 `packages/bridge/bridge-react/src/provider/versions/bridge-base.tsx`：SSR、hydrate、render 共用生产者树与生命周期。

## 已运行命令与结果

在本目录执行，均通过：

```bash
pnpm install --no-frozen-lockfile --offline
pnpm run typecheck
pnpm run build > /private/tmp/mf-bridge-callbacks-demo-build.log 2>&1
```

在 Modern 仓库根目录执行：

```bash
pnpm exec biome check --write examples/module-federation/bridge-ssr/host/modern.config.ts examples/module-federation/bridge-ssr/product-app/modern.config.ts examples/module-federation/bridge-ssr/product-app/src/bridge.tsx examples/module-federation/bridge-ssr/inventory-app/modern.config.ts examples/module-federation/bridge-ssr/inventory-app/src/bridge.tsx
git diff --check -- examples/module-federation/bridge-ssr
```

- 三个应用类型检查和 production build 通过。
- 商品、库存 Browser 产物包含真实 Modern `render/hydrate` 与 `modern-application/2` snapshot 恢复，没有混入 Node renderer。
- 本地依赖统一指向 `core-bridge-service-ssr` 同名分支。
- 商品 React 18.3.1 通过 pnpm 应用与 Service Demo 相同的 UTF-8 补丁，锁文件由 pnpm 生成；见 [React issue #31134](https://github.com/facebook/react/issues/31134)。

本目录没有独立单元测试脚本；框架单测由主线程在 Modern/MF 包运行。未运行 Playwright：本轮真实浏览器验收统一由主线程使用 Divebell 完成。构建与静态检查不等同于交互已通过。

## 预览与浏览器验收

```bash
pnpm start > /private/tmp/bridge-callback-preview.log 2>&1
```

- [首页双 Remote](http://127.0.0.1:4900/?streamDelay=4500&activityDelay=5000)
- [库存应用](http://127.0.0.1:4900/inventory?activityDelay=5000)
- [商品应用](http://127.0.0.1:4900/products?streamDelay=4500)
- [纯 CSR](http://127.0.0.1:4900/?csr=1)

4900 是 Modern Host SSR；4901 / 4902 是生产者静态产物服务，没有额外生产者 SSR server。

2026-10-15 真实 Chrome / Divebell 通过：

- 首页同时展示 React 18 商品应用和 React 19 库存应用。
- 约 507ms 打开「调整库存」，当时两个 Remote 的 session.complete 都为 false，库存流水仍为 loading。
- 约 5357ms 后到达的「库存流水详情」可点击。
- 两个应用的水合前按钮仍为原 DOM 节点，未重建；未捕获水合错误。
- 验收 URL：`http://127.0.0.1:4900/?streamDelay=1500&activityDelay=5000`。原始记录：本机 `/private/tmp/bridge-callback-browser-evidence.json`。

浏览器命令使用 `divebell raw --session callbacks-verified-bridge --init-script /private/tmp/bridge-callbacks-probe.js open <url>`、`eval 'window.__callbackProbe'`。探针仅观察、点击真实页面，未生成渲染结果。

Modern 框架验证（仓库根目录）：

```bash
pnpm --filter @modern-js/runtime exec rstest run
pnpm --filter @modern-js/runtime run build
pnpm exec biome check packages/runtime/plugin-runtime/src/application/index.tsx packages/runtime/plugin-runtime/tests/mf/browser.test.tsx
git diff --check
```

完整 runtime 75 tests / 23 files 通过，构建及类型生成通过。回归覆盖取消挂起初始化后同 DOM remount、实际根元素 props 的 SSR/hydration 一致性、多实例路由隔离、流未结束时更新 Host props 不重跑 loader 且保持交互状态。完整 monorepo 构建和其它框架 E2E 未运行；本次执行相关 package tests/build 与两套生产模式 Demo 的真实浏览器验证。
