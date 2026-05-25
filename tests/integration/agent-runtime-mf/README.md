# Agent Runtime MF Demos

这里放第一批 Agent Runtime API 的真实 demo。每个 case 都是完整的 Modern.js + Module Federation 项目，并且都包含：

- `provider`：生产者，通过 Module Federation 暴露远程组件。
- `consumer`：消费者，加载生产者组件，并挂载 `window.__AGENT_RUNTIME__`。

对应的 API 设计文档在 [api-design.md](../../../docs/agent-runtime/api-design.md)。

## Demo 列表

| Case | Provider 端口 | Consumer 端口 | 目的 |
| --- | ---: | ---: | --- |
| [`react-multi-version`](./cases/react-multi-version) | 4311 | 4312 | React shared 状态和依赖来源检测 |
| [`nested-router-tree`](./cases/nested-router-tree) | 4321 | 4322 | Router tree 和远程组件关系检测 |
| [`async-chunk-runtime`](./cases/async-chunk-runtime) | 4331 | 4332 | async chunk 的 publicPath / uniqueName 冲突检测 |
| [`garfish-provider`](./cases/garfish-provider) | 4341 | 4342 | provider 导出和挂载状态检测 |
| [`redirect-loader`](./cases/redirect-loader) | 4351 | 4352 | redirect / loader pending 状态检测 |
| [`usenavigate-blank`](./cases/usenavigate-blank) | 4361 | 4362 | 路由动作和跳转空白检测 |

## 运行方式

先启动 provider，再启动 consumer：

```bash
pnpm --dir tests/integration/agent-runtime-mf/cases/redirect-loader/provider dev
pnpm --dir tests/integration/agent-runtime-mf/cases/redirect-loader/consumer dev
```

打开 consumer 页面后，可以读取：

```js
window.__AGENT_RUNTIME__.getSnapshot()
window.__AGENT_RUNTIME__.getEvents()
window.__AGENT_RUNTIME__.getActions()
```

## 测试信息

### react-multi-version

来源 case：

- `03-zustand-react-version-check`
- `13-react-multi-version-invalid-hook`

要证明的问题：

- shared 看起来配置了 React，但实际运行仍然有两份 React。
- 某个依赖包把 React 打进产物，导致 Invalid hook call。

需要用到的能力：

- `shared`
- `DependencySource`
- `component.error`
- `proxy` 状态

验证方式：

1. 打开 consumer 页面。
2. 读取 `snapshot.shared`，确认 React 注册情况。
3. 读取 `dependencySources`，确认是否有包把 React 打进产物。
4. 读取 `errors`，确认是否存在 Invalid hook call。
5. 执行 `runAction('apply-proxy-fix')` 后重新读取状态，确认错误消失。

### nested-router-tree

来源 case：

- `04-volcengine-nested-router-hmr`

要证明的问题：

- 页面出错不是 remote 没加载，而是 React tree / Router 结构异常。

需要用到的能力：

- `route`
- `components`
- `RemoteComponentRelation`

验证方式：

1. 打开 consumer 页面。
2. 读取当前 route 状态。
3. 读取组件树，确认是否存在重复 Router。
4. 关联 remote 名称，确认异常组件来自哪个 provider。
5. 执行 `runAction('flatten-remote-router')` 后重新读取状态，确认页面恢复。

### async-chunk-runtime

来源 case：

- `08-rivendell-async-chunk-404`

要证明的问题：

- 页面先加载一套 MF 产物，再进入另一套子应用产物，runtime 没隔离导致 async chunk 404。

需要用到的能力：

- `build.uniqueName`
- `build.chunkLoadingGlobal`
- `build.publicPath`
- `route`
- `events`

验证方式：

1. 打开 consumer 页面。
2. 读取构建运行信息。
3. 检查 `chunkLoadingGlobal` / `uniqueName` 是否冲突。
4. 查看 chunk 加载事件是否失败。
5. 执行 `runAction('isolate-runtime')` 后重新读取状态，确认冲突消失。

### garfish-provider

来源 case：

- `10-garfish-provider-white-screen`

要证明的问题：

- 子应用入口文件可能加载了，但 provider 没有正确导出或 Garfish 没有识别到。

需要用到的能力：

- `EntryState`
- `GarfishState`
- `component.ready`

验证方式：

1. 打开 consumer 页面。
2. 读取入口文件是否加载。
3. 读取 provider 是否存在。
4. 读取 Garfish 子应用是否 mounted。
5. 如果白屏，明确是 entry、provider 还是 component ready 的问题。
6. 执行 `runAction('fix-provider-export')` 后重新读取状态，确认子应用 mounted。

### redirect-loader

来源 case：

- `12-cloud-engine-redirect-stuck`

要证明的问题：

- 页面一直显示 redirect/loading，但 Agent 不知道是 loader 没执行、redirect 没发生，还是客户端兜底没跑。

需要用到的能力：

- `page`
- `route`
- `loaders`
- `pendingReason`

验证方式：

1. 打开 consumer 根路径。
2. 读取 loader 是否执行。
3. 读取 redirect 是否发生。
4. 如果页面卡住，读取 `pendingReason`。
5. 执行 `runAction('run-client-fallback')` 后重新读取状态，确认跳转完成。

### usenavigate-blank

来源 case：

- `14-usenavigate-jump-blank`

要证明的问题：

- 子应用内部跳转后页面空白，需要知道是路由不匹配、basename 不对、组件没挂载，还是跳转方式错。

需要用到的能力：

- `route`
- `components`
- `actions`
- `events`

验证方式：

1. 打开 consumer 页面。
2. 执行 `runAction('enter-default-page')`，确认默认页 ready。
3. 执行 `runAction('navigate-lineage')`，读取 route 和 component 状态。
4. 执行 `runAction('navigate-features')`，确认可以回到 features。
5. 空白时输出具体卡点。

## 结构校验

```bash
node tests/integration/agent-runtime-mf/verify.mjs
```
