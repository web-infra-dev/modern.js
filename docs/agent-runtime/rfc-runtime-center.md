# RFC: Agent Runtime Center

## 状态

Draft

## 摘要

本文定义一套 Agent Runtime Center 方案，用于让框架和业务页面把运行态信息统一暴露给 Agent。

核心思路：

- 框架内置能力和用户标注都写入同一个运行态中心。
- Agent 只通过这个中心读取状态、订阅事件、执行声明过的动作。
- 页面 runtime 只负责采集和维护状态，不在浏览器页面里启动 server。
- HTTP / SSE / CLI 由外部 Node Bridge Server 提供。

目标是把 Agent 过去依赖 UI、DOM、请求是否安静这类脆弱判断，改成结构化的运行态证据。

## 背景

现在 Agent 判断一个页面是否加载成功，通常依赖：

- 看页面 UI 是否正常；
- 等请求是否安静；
- 查关键 DOM 是否出现；
- 看 console 有没有错误；
- 点击页面按钮后观察变化。

这些信号有价值，但不能单独作为稳定判断：

- 很多页面有轮询、埋点、长连接，请求不会真正安静；
- DOM 出现不代表业务数据已经 ready；
- 页面 shell 可能已经 mounted，但 remote 组件仍然白屏；
- remote entry 可能加载成功，但 React 组件渲染失败；
- Agent 可能错过组件真正 ready 的瞬间，只能反复轮询。

因此需要一个统一中心，回答这些问题：

- 页面现在是什么状态；
- 运行过程中发生过什么；
- Agent 当前可以执行哪些动作；
- 页面没有 ready 时，具体卡在哪一层。

## 目标

- 提供统一运行态中心，承载 snapshot、events、actions 和用户 ready 标注。
- 支持 Agent 在组件或路由出现之前先订阅目标。
- 支持页面 ready 的结构化判断，返回证据和阻塞原因。
- 支持框架自动采集，也支持业务用轻量方式声明关键 ready。
- 支持页面内 API、CLI、HTTP API 和 SSE event stream。
- 明确区分 event 和 action：event 只观察，action 才执行。
- 支持本地 demo、登录态页面和 oncall 调试场景。

## 非目标

- 第一阶段不复刻完整 React DevTools。
- 第一阶段不提供通用 DOM selector 点击能力。
- 不把请求安静作为页面 ready 的核心标准。
- 不在浏览器页面 runtime 里启动 HTTP server。
- 不要求生产页面默认暴露可访问的 debug server。
- 不允许通过 event 直接执行动作。

## 使用示例

### 获取页面当前快照

Agent 打开页面后，先读取当前 snapshot，判断页面卡在哪一层。

```ts
const snapshot = await runtime.getSnapshot();
```

返回信息可以包含：

- 当前 URL、route match 和 navigation 状态；
- app root 是否 mounted；
- 当前 route loader 是否完成；
- 当前页面依赖的 remote / expose / shared 是否成功；
- Garfish 子应用是否 mounted；
- 当前 fatal error 和最近 runtime error；
- 当前页面声明过哪些 actions。

这类能力用于 oncall 排障时，先回答“页面现在是什么状态”，而不是直接猜。

### 等待页面 ready

Agent 可以等待页面达到指定 ready level。

```ts
const result = await runtime.waitForEvent(
  { type: 'page.ready', target: 'route:/trade/order' },
  { timeout: 10000 },
);
```

如果超时，返回当前 blockers：

```json
{
  "ready": false,
  "phase": "blocked",
  "blockers": [
    "remote expose failed: provider/Button",
    "component not ready: order-form"
  ]
}
```

这类能力用于区分：

- 路由没匹配；
- loader 没完成；
- remote 没加载成功；
- 组件已经 mounted，但业务 ready 没触发。

### 订阅还没出现的组件

Agent 可以在组件出现前先订阅目标。

```ts
const unsubscribe = runtime.subscribeEvents(
  { type: 'component.ready', target: 'component:user-profile' },
  event => {
    console.log('user profile ready', event);
  },
);
```

页面稍后执行：

```tsx
useAgentReady('user-profile', !loading && Boolean(data));
```

Agent 会在 ready 发生时立即收到事件，不需要反复轮询 DOM。

### 执行页面声明过的动作

页面或框架可以声明安全动作，例如加载 remote、进入某个路由、重试失败请求。

```ts
const actions = await runtime.getActions();
await runtime.runAction('load-provider-remote');
```

event 只能观察，action 才能执行。Agent 不能通过订阅事件来触发页面行为。

### CLI 调试登录态页面

oncall 场景可以让 CLI 连接已有浏览器 tab，复用当前登录态。

```bash
agent-runtime snapshot --target http://localhost:4332
agent-runtime wait page.ready --timeout 10000
agent-runtime events --since 42
agent-runtime action load-provider-remote
```

典型流程：

1. 读取 snapshot，确认当前页面是否 ready；
2. 如果不 ready，查看 blockers；
3. 订阅后续 events；
4. 只执行页面声明过的 actions；
5. 把 snapshot 和 events 作为 oncall 结论证据。

## 术语

### Runtime Center

页面内的运行态中心，负责维护当前 snapshot、历史 events、订阅关系和 actions。

### Runtime Client

页面里的 runtime 包。它可以由框架插件自动注入，也可以被业务代码显式使用。

### Bridge Server

本地 Node server，对 Agent 暴露 HTTP / SSE / CLI 能力，并通过浏览器连接访问页面 runtime。

### Connector

Bridge Server 和浏览器 tab 之间的连接层。第一阶段推荐使用 CDP。

### Snapshot

当前页面结构化状态。

### Event

运行过程中发生过的事实，例如 `route.started`、`loader.success`、`component.ready`。

### Action

页面或框架声明过的可执行动作，例如 `load-provider-remote`、`enter-default-page`。

## 总体架构

```txt
框架内置采集 / 用户标注
  -> Runtime Client
  -> 页面内 Runtime Center
  -> 浏览器连接层，第一阶段 CDP
  -> 本地 Bridge Server
  -> HTTP / SSE / CLI
  -> Agent
```

页面 runtime 不开端口，只在页面内暴露 API，例如：

```ts
window.__AGENT_RUNTIME__;
```

Bridge Server 负责：

- 启动或连接浏览器；
- 找到目标 tab；
- 通过 CDP 调用页面内 runtime；
- 对外提供 HTTP / SSE；
- 把页面 events 转成 Agent 可消费的事件流。

## 运行态来源

所有来源都写入 Runtime Center。

### 框架自动采集

框架应尽量自动采集：

- document 和 app root 生命周期；
- route location、match、basename、redirect、navigation；
- loader start、success、redirect、pending、error；
- React root mounted 和 render error；
- Suspense pending / resolved；
- Module Federation / Vmok remote 加载状态；
- shared 依赖运行态；
- Garfish app load、provider、mount、unmount、error；
- 构建运行信息，例如 `uniqueName`、`chunkLoadingGlobal`、`publicPath`、entry URL；
- 影响页面 ready 的 fatal error。

## 框架内置采集和事件注入

框架内置能力应该通过插件接入，而不是要求用户在每个页面手写事件。

框架插件负责在应用启动时创建 Runtime Center，并把框架内部生命周期转换成统一状态和事件：

```txt
framework lifecycle
  -> runtimeCenter.updateState()
  -> runtimeCenter.emit()
  -> snapshot / events / subscriptions
```

原则：

- 先更新 snapshot，再发 event，保证 Agent 收到事件后马上能读到最新状态。
- event 必须有稳定 `type`、`target`、`phase` 和 `timestamp`。
- 同一类框架能力使用统一命名，例如 `route:/home`、`loader:root`、`component:UserProfile`。
- 框架只自动发它确定知道的事件，不猜业务 ready。
- 用户标注发出的事件也进入同一个 Runtime Center。

### 初始化注入

框架插件在应用入口初始化：

```ts
const runtimeCenter = createRuntimeCenter({
  appName,
  framework: 'modern-js',
  build,
});

window.__AGENT_RUNTIME__ = runtimeCenter.api;
```

框架随后把 router、loader、render root、error boundary、Vmok、Garfish 等生命周期接到这个中心。

### 路由事件

框架 router 层可以自动注入 route 状态和事件。

建议事件：

| 框架生命周期 | Runtime event | Snapshot 更新 |
| --- | --- | --- |
| 开始跳转 | `route.started` | `route.phase = 'started'` |
| 路由匹配完成 | `route.matched` | `route.matched = true` |
| loader 开始执行 | `loader.started` | `loader.phase = 'started'` |
| loader redirect | `loader.redirect` | `route.redirecting = true` |
| loader 成功 | `loader.success` | `loader.phase = 'success'` |
| 路由页面 mounted | `route.ready` | `route.phase = 'success'` |
| 路由不匹配 | `route.unmatched` | `route.matched = false` |
| 路由错误 | `route.error` | `route.phase = 'error'` |

示例事件：

```ts
runtimeCenter.emit({
  type: 'route.started',
  target: 'route:/workspace/home',
  source: 'framework',
  phase: 'started',
  details: {
    from: '/workspace',
    to: '/workspace/home',
    navigationType: 'push',
  },
});
```

对应 snapshot：

```ts
runtimeCenter.updateState({
  route: {
    id: 'route:/workspace/home',
    location: '/workspace/home',
    matched: true,
    phase: 'success',
    updatedAt: Date.now(),
  },
});
```

### Router 实现方式

router 采集应该基于当前框架路由，不另起一套路由监听，也不通过 DOM click 或 `useNavigate` monkey patch 来猜测跳转。

以 Modern.js 当前路由为例，框架已经在 runtime router 插件中完成：

1. 生成或读取 route objects。
2. 执行 `modifyRoutes`。
3. 创建 `createBrowserRouter` 或 `createHashRouter`。
4. 通过 `RouterProvider` 渲染。

Agent Runtime 应该接在这条链路上，分成两个挂点。

#### 创建 router 前：包装 routes

在 `modifiedRoutes` 已经生成、但还没传给 `createBrowserRouter` / `createHashRouter` 前，递归包装 route objects。

包装内容：

- 如果 route 已经有 loader，包装这个已有 loader，自动发 `loader.started`、`loader.success`、`loader.redirect`、`loader.error`。
- 包装 route component，自动发 `component.mounted` 和 `route.component.mounted`。
- 保留原始 route 行为，不改变用户代码返回值。
- 保留 route id、path、handle、hasLoader 等元信息，用于生成稳定 target。
- 如果 route 没有 loader，不创建新的 loader，只记录 route metadata。

示例 target：

```txt
route:/workspace/home
loader:routes/page.loader
component:routes/page
```

#### 创建 router 后：订阅 router state

router 创建后，通过框架路由对象的 subscribe 能力订阅 router state。

这层负责记录路由整体状态：

- 当前 location；
- 当前 navigation state；
- 当前 matches；
- 当前 route errors；
- 当前 loaderData；
- basename 是否匹配；
- navigation 从 loading 回到 idle 后，框架层 route 是否 ready。

这层可以发：

- `route.started`
- `route.matched`
- `route.unmatched`
- `route.error`
- `route.ready`

`route.ready` 只代表框架层 ready，不代表业务 ready。业务成功条件仍然由 `useAgentReady`、`AgentReady` 或业务 action 显式声明。

没有 loader 的 route 仍然可以判断框架层 route ready，因为 route 状态来自 router state，而不是 loader。

无 loader route 的默认 ready 条件：

1. route matched；
2. navigation idle；
3. 没有 route error；
4. route component mounted；
5. 没有 fatal error。

如果 route 没有 loader，那么“没有 pending loader”天然成立。

#### 为什么需要两个挂点

只订阅 router state，能看到最终路由状态，但不一定能精确知道每个 loader 的开始、成功、redirect 和失败。

只包装 loader，能看到 loader 细节，但不知道最终 navigation 是否完成、route 是否匹配、页面是否进入错误路由。

因此第一阶段建议同时做：

- route wrapper：采集 loader / component 细粒度事件；
- router subscriber：采集 route / navigation 整体状态。

这里的 wrapper 只观察已有能力，不改变路由语义：

- route 本来有 loader：包装并记录执行状态；
- route 本来有约定式 data：视作 route data loader，包装并记录执行状态；
- route 没有 loader / data：不创建 loader；
- 本该执行但没看到执行：只标记 `loader.missing`，不补执行。

#### `loader.missing`

`loader.missing` 用于判断“框架知道这里应该有 loader，但它没有执行”。

判断条件可以是：

1. 当前 matched route 标记了 `hasLoader`。
2. event history 里没有对应 `loader.started` / `loader.success`。
3. snapshot 里没有对应 loaderData。
4. router navigation 已经不是 loading。
5. 页面仍停在 pending 或 redirect UI。

命中后 Runtime Center 可以更新：

```ts
runtimeCenter.emit({
  type: 'loader.missing',
  target: 'loader:routes/page.loader',
  source: 'framework',
  phase: 'blocked',
  evidence: ['matched route has loader', 'no loader event found'],
});
```

这类信号用于定位 redirect / loader 卡住场景，比 Agent 只看页面上是否还显示 loading 更稳定。

#### SSR 初始状态

SSR 场景需要补充服务端侧状态。

如果 loader / redirect 在服务端执行，只在客户端订阅 router state 会丢失服务端过程。因此 SSR 应该把这些信息写进初始 runtime 数据，随 HTML 一起下发：

- 服务端 matched routes；
- 服务端 loader started / success / redirect / error；
- 初始 loaderData；
- 初始 route error；
- 是否发生 SSR 降级。

客户端 Runtime Center 初始化时合并这份初始状态，再继续监听后续客户端路由变化。

### Loader 事件

框架 loader 层应该记录每个 route data loader 的执行结果。

在 Modern.js 约定式路由里，`page.loader.ts`、`layout.loader.ts`、`page.data.ts`、`layout.data.ts` 都应该归到同一类能力：route data loader。

它们最终都服务于某个 route 的数据加载，只是来源约定不同：

| 约定文件 | Runtime kind | 说明 |
| --- | --- | --- |
| `page.loader.ts` | `route-loader` | 页面 route loader |
| `layout.loader.ts` | `route-loader` | layout route loader |
| `page.data.ts` | `route-loader` | 页面约定式 data loader |
| `layout.data.ts` | `route-loader` | layout 约定式 data loader |
| `page.data.client.ts` | `route-loader` | 页面 client data loader |
| `layout.data.client.ts` | `route-loader` | layout client data loader |

因此模型里不应该把“router loader”和“框架 dataLoader”拆成两类。它们都进入 `loaders`，通过字段区分来源和执行端。

建议状态：

```ts
type LoaderState = {
  id: string;
  routeId: string;
  kind: 'route-loader';
  convention:
    | 'page.loader'
    | 'layout.loader'
    | 'page.data'
    | 'layout.data'
    | 'page.data.client'
    | 'layout.data.client';
  execution: 'server' | 'client' | 'data-request';
  phase:
    | 'idle'
    | 'started'
    | 'pending'
    | 'success'
    | 'redirect'
    | 'error'
    | 'aborted'
    | 'missing';
  expected: boolean;
  startedAt?: number;
  updatedAt: number;
  duration?: number;
  redirectTarget?: string;
  dataReady?: boolean;
  deferred?: boolean;
  error?: RuntimeError;
};
```

单个 route object 通常最多对应一个 route data loader，但一次 navigation 会命中多个 routes，所以一次页面跳转可能有多个 loader 同时参与。

例如：

```txt
routes/layout.tsx          -> layout loader
routes/user/layout.tsx     -> user layout loader
routes/user/page.tsx       -> user page loader
```

访问 `/user` 时，page ready 要看 matched routes 上所有关键 loader 是否完成。

建议事件：

| 状态 | Runtime event |
| --- | --- |
| 开始执行 | `loader.started` |
| 成功返回 | `loader.success` |
| 返回 redirect | `loader.redirect` |
| 仍在等待 | `loader.pending` |
| 执行失败 | `loader.error` |
| 执行被取消 | `loader.aborted` |
| deferred 数据返回 | `loader.deferred` |
| 预期应执行但未执行 | `loader.missing` |

`loader.missing` 用于类似 redirect 卡住场景：页面已经返回静态壳页，但框架知道当前 route 本应有 loader。

实现边界：

- 只包装已有 loader / data，不自动创建业务 loader。
- 原 loader 返回什么、抛什么、redirect 什么，都必须原样保留。
- `loader.redirect` 不能当作 `loader.error`。
- `page.data.client.ts` 这类 client loader 要和 server loader 用同一个 `routeId` 关联，但用 `execution` 区分。
- `loader.missing` 只是诊断信号，不会补执行 loader。

和业务自定义数据请求的边界：

- 框架约定式 `page.loader` / `page.data` 属于 route data loader。
- 业务自己用 SWR、React Query、fetch 等发出的请求不属于 route data loader。
- 业务请求如果要参与 Agent 判断，应通过 `useAgentReady` 或后续 data dependency 标注进入 Runtime Center。

### React 事件

React 层第一阶段不复刻完整 React tree，只记录框架能够稳定确认的生命周期。

范围分成三类：

1. React root 生命周期；
2. route component 生命周期；
3. 用户声明的 ready marker。

不包含：

- 遍历完整 React fiber tree；
- 输出页面所有组件列表；
- 自动判断任意业务组件是否 ready；
- monkey patch 所有 hooks；
- 自动识别 `Loading` / `UserProfile` 谁代表成功态。

这样可以避免把 Agent Runtime 做成 React DevTools，也避免因为组件名压缩、StrictMode、多次 mount 等行为产生误判。

#### React root 生命周期

框架可以从 render / hydrate 入口自动记录 root 级别事件。

建议事件：

| 状态 | Runtime event |
| --- | --- |
| root 开始 render | `react.root.render.started` |
| root mounted | `react.root.mounted` |
| hydrate 开始 | `react.root.hydrate.started` |
| hydrate 成功 | `react.root.hydrate.success` |
| hydrate 失败或降级 CSR | `react.root.hydrate.fallback-client-render` |
| root 级错误 | `react.root.error` |

这类事件只回答一个问题：React 应用本身有没有起来。

#### Route component 生命周期

route component 生命周期来自 router 包装，不来自全量 React tree 扫描。

框架在包装 route objects 时，只追踪框架认识的 route component，例如 page component 和 layout component。

建议事件：

| 状态 | Runtime event |
| --- | --- |
| route component mounted | `component.mounted` |
| route component unmounted | `component.unmounted` |
| Suspense fallback 出现 | `component.pending` |
| Suspense resolved | `component.resolved` |
| render error | `component.error` |
| ErrorBoundary 捕获错误 | `component.error` |

target 应该带 route 关系：

```txt
component:routes/user/page
route:routes/user/page
```

这类事件回答的是：路由命中后，对应页面组件有没有真的挂载，以及渲染阶段有没有错误。

#### 用户 ready marker

框架自动发 `component.mounted`，但不自动猜业务 ready。

业务通过 `useAgentReady` 或 `AgentReady` 触发：

```txt
component.ready
```

示例：

```tsx
useAgentReady('user-profile', !loading && Boolean(data));
```

这类事件回答的是：关键业务组件是否已经满足业务 ready 条件。

#### 和 page ready 的关系

React 事件只参与 page ready 判断，不单独决定页面成功。

有 loader 的页面：

```txt
route matched
+ loaders settled
+ route component mounted
+ no render error
+ user ready marker if configured
= page ready
```

没有 loader 的页面：

```txt
route matched
+ navigation idle
+ route component mounted
+ no render error
= framework ready
```

### Vmok / Module Federation 事件

Vmok / Module Federation 侧应该提供通用的运行态观测能力。它不应该直接依赖 Modern.js、React、Garfish 或具体 Agent。

Runtime Center 只消费这些通用信息，并把它们和框架 route、loader、React mounted、业务 ready marker 组合起来判断页面状态。

#### MF 侧需要提供的能力

MF 侧建议提供稳定 API：

```ts
type FederationRuntimeObserver = {
  getFederationSnapshot(): FederationSnapshot;
  getFederationEvents(filter?: FederationEventFilter): FederationEvent[];
  subscribeFederationEvents(
    filter: FederationEventFilter,
    listener: (event: FederationEvent) => void,
  ): () => void;
};
```

这些 API 应该是通用调试能力，不以 Agent 命名。Chrome DevTools、CLI、框架插件、oncall 工具都可以复用。

最小闭环：

- `getFederationSnapshot()`：拿当前 MF 状态。
- `getFederationEvents({ since })`：补齐历史事件。
- `subscribeFederationEvents()`：订阅后续事件。
- 稳定 event schema：保证不同工具可以消费同一套数据。

#### Snapshot

MF snapshot 至少需要包含：

- 当前页面有哪些 MF runtime instance；
- 每个 instance 的 name、version、shareScope、build 信息；
- 加载过哪些 remote；
- remote 的 manifest、entry、remote container 是否成功；
- expose 是否开始加载、是否成功、是否失败；
- shared 依赖解析结果，包括包名、版本、provider、是否 singleton、是否复用已有实例；
- 最近错误、重试、fallback、timeout；
- manifest / stats 中能帮助定位问题的信息，例如 remoteEntry、publicPath、assets、exposes、shared。

示例结构：

```ts
type FederationSnapshot = {
  instances: FederationInstanceState[];
  remotes: RemoteState[];
  exposes: RemoteExposeState[];
  shared: SharedState[];
  errors: FederationRuntimeError[];
  updatedAt: number;
};
```

#### Events

MF 侧需要把加载链路拆成可订阅事件。

建议事件：

| 状态 | Federation event | Runtime Center event |
| --- | --- | --- |
| manifest 开始加载 | `mf.manifest.started` | `remote.manifest.started` |
| manifest 成功 | `mf.manifest.success` | `remote.manifest.success` |
| manifest 失败 | `mf.manifest.error` | `remote.error` |
| remote entry 开始加载 | `mf.entry.started` | `remote.entry.started` |
| remote entry 成功 | `mf.entry.success` | `remote.entry.success` |
| remote entry 失败 | `mf.entry.error` | `remote.error` |
| remote container init 开始 | `mf.container.init.started` | `remote.init.started` |
| remote container init 成功 | `mf.container.init.success` | `remote.init.success` |
| remote container init 失败 | `mf.container.init.error` | `remote.error` |
| expose 开始加载 | `mf.expose.started` | `remote.expose.started` |
| expose 成功 | `mf.expose.success` | `remote.expose.success` |
| expose 失败 | `mf.expose.error` | `remote.error` |
| shared 依赖开始解析 | `mf.shared.resolve.started` | `shared.resolve.started` |
| shared 依赖解析成功 | `mf.shared.resolve.success` | `shared.resolve.success` |
| shared 依赖解析失败 | `mf.shared.resolve.error` | `shared.resolve.error` |
| chunk 开始加载 | `mf.chunk.started` | `remote.chunk.started` |
| chunk 成功 | `mf.chunk.success` | `remote.chunk.success` |
| chunk 失败 | `mf.chunk.error` | `remote.error` |
| retry / fallback / cache hit | `mf.retry` / `mf.fallback` / `mf.cache.hit` | 对应 remote / shared event |

MF event 字段至少包含：

- `eventId`；
- `timestamp`；
- `instanceName`；
- `remoteName`；
- `expose`；
- `packageName`、`requiredVersion`、`resolvedVersion`；
- `shareScope`；
- `entryUrl`、`manifestUrl`、`assetUrl`；
- `requestId` / `traceId`，用于串联一次加载链路；
- `duration`；
- `buildVersion` / `manifestVersion`；
- `success`；
- `error`。

#### 错误类型

MF 侧不要只提供字符串错误。错误结构需要稳定区分：

- manifest 拉取失败；
- manifest 解析失败；
- remote entry 拉取失败；
- remote container 初始化失败；
- expose 不存在；
- expose factory 执行失败；
- shared 版本不匹配；
- singleton 冲突；
- shared provider 缺失；
- chunk 加载失败；
- publicPath / asset url 异常；
- timeout；
- retry 后仍失败；
- fallback 生效。

Runtime Center 可以把这些错误统一映射到 `remote.error` 或 `shared.resolve.error`，但原始错误类型需要保留在 `details` 中。

#### 事件历史

Agent 可能不是页面启动时就连接上，所以 MF 侧需要保留最近一段事件历史。

要求：

- 每个 event 有递增 `eventId`；
- 支持按 `since` 增量读取；
- 保留一个有上限的 ring buffer；
- snapshot 里记录当前最新 `eventId`；
- event history 不应该无限增长。

#### 和当前 Observability Plugin 的关系

当前 Observability Plugin 可以作为第一阶段数据来源。Runtime Center 可以通过 MF adapter 消费它已有的 report / trace 信息，再标准化成 Runtime Center 事件。

但长期看，MF 侧应该沉淀稳定的 runtime observer API，而不是让框架或 Agent 依赖插件内部实现、页面全局变量或特定 DevTools 面板的数据格式。

建议分层：

```txt
MF runtime / Observability Plugin
  -> FederationRuntimeObserver
  -> Runtime Center MF Adapter
  -> snapshot / events
```

#### 边界

MF 侧只负责判断 MF 加载链路：

- remote 资源是否加载成功；
- expose factory 是否拿到；
- shared 依赖是否解析成功；
- chunk 是否加载成功；
- runtime 是否发生 MF 层错误。

MF 侧不负责判断：

- React 组件是否 mounted；
- remote 组件业务是否 ready；
- Garfish 子应用是否 mounted；
- 页面是否最终可用。

这些状态由框架 React / Garfish 采集和用户 ready marker 补齐。

最终 page ready 应该组合判断：

```txt
remote.expose.success
+ shared.resolve.success
+ remote chunk success if needed
+ component.mounted
+ component.ready if configured
= remote view ready
```

### Garfish 事件

Garfish 层应把子应用生命周期写入 Runtime Center。

建议事件：

| 状态 | Runtime event |
| --- | --- |
| 子应用注册 | `garfish.app.registered` |
| 入口开始加载 | `garfish.entry.started` |
| 入口加载成功 | `garfish.entry.success` |
| provider 找到 | `garfish.provider.ready` |
| provider 缺失 | `garfish.provider.missing` |
| 子应用 mounted | `garfish.app.mounted` |
| 子应用 ready | `garfish.app.ready` |
| 子应用失败 | `garfish.app.error` |

`garfish.app.mounted` 可以自动判断，`garfish.app.ready` 可以由子应用业务标注触发。

### 构建信息注入

构建插件应在产物中注入可读的运行信息：

```ts
runtimeCenter.updateState({
  build: {
    uniqueName,
    chunkLoadingGlobal,
    publicPath,
    runtimeChunk,
    entryUrl,
  },
});
```

这些信息用于 async chunk 404、`undefined.js`、多套产物 runtime 冲突等问题。

### 用户标注

业务应用用轻量方式补充框架无法知道的语义：

- 关键组件 ready；
- 页面业务 ready；
- Agent 可以执行的动作；
- 需要关注的 route 或 component；
- 可忽略错误；
- 敏感数据脱敏规则。

示例：

```tsx
function UserProfile() {
  const { data, loading } = useUser();

  useAgentReady('user-profile', !loading && Boolean(data));

  if (loading) {
    return <Loading />;
  }

  return <Profile data={data} />;
}
```

框架可以知道 `UserProfile` 是否 mounted，但业务需要声明它什么时候真正 ready。

## 页面 Ready 模型

页面 ready 不应该只是一个简单 boolean。它应该包含层级、证据和阻塞原因。

```ts
type PageReadyLevel = 'document' | 'framework' | 'view' | 'business';

type ReadyResult = {
  ready: boolean;
  level: PageReadyLevel;
  phase: 'pending' | 'success' | 'error' | 'blocked' | 'unknown';
  evidence: string[];
  blockers: string[];
};
```

推荐层级：

| Level | 含义 | 来源 |
| --- | --- | --- |
| `document` | HTML document 已加载 | 浏览器 |
| `framework` | route 命中、loader 完成、无框架级 fatal error | 框架 |
| `view` | app root、route component、remote 或 Garfish app 已挂载 | 框架 + runtime |
| `business` | 页面业务成功条件达成 | 用户标注 |

默认 ready 判断：

1. document 已加载；
2. 当前 route 命中；
3. loader 没有 pending；
4. 没有 fatal error；
5. app root mounted；
6. 如果当前页面依赖 remote / Garfish，需要对应挂载完成；
7. 如果用户声明了 ready marker，需要 ready marker 触发。

请求是否安静可以作为 evidence，但不应该作为必须满足的 ready 条件。

## 组件订阅模型

Agent 应该可以在组件还没出现之前先订阅。

典型流程：

1. Agent 订阅 `component:user-profile.ready`。
2. 页面开始加载。
3. `UserProfile` 还没有渲染。
4. `UserProfile` mounted，并执行 `useAgentReady('user-profile', true)`。
5. Runtime Center 发出 `component.ready` 事件。
6. Agent 立刻收到事件，不需要 sleep 或反复扫 DOM。

`waitForEvent` 需要同时支持已经发生和未来发生的事件：

1. 先读当前 snapshot；
2. 如果目标已经满足，立即返回；
3. 如果还没满足，再进入订阅等待；
4. 超时后返回当前 blockers。

## 核心页面 API

页面内 runtime 暴露：

```ts
type AgentRuntime = {
  getSnapshot(filter?: SnapshotFilter): Promise<RuntimeSnapshot>;
  getEvents(filter?: EventFilter): Promise<RuntimeEvent[]>;
  subscribeEvents(
    filter: EventFilter,
    listener: (event: RuntimeEvent) => void,
  ): () => void;
  waitForEvent(
    filter: EventFilter,
    options?: WaitOptions,
  ): Promise<RuntimeEvent | ReadyResult>;
  getActions(filter?: ActionFilter): Promise<ActionDescriptor[]>;
  runAction(actionId: string, payload?: unknown): Promise<ActionResult>;
};
```

### Snapshot

```ts
type RuntimeSnapshot = {
  page: PageState;
  route?: RouteState;
  loaders?: LoaderState[];
  components?: ComponentState[];
  remotes?: RemoteState[];
  shared?: SharedState[];
  garfish?: GarfishState;
  build?: BuildRuntimeInfo;
  actions?: ActionDescriptor[];
  errors?: RuntimeError[];
};
```

### Event

```ts
type RuntimeEvent = {
  id: string;
  type: string;
  target?: string;
  phase?: string;
  source: 'framework' | 'user' | 'agent' | 'bridge';
  timestamp: number;
  route?: string;
  evidence?: string[];
  details?: unknown;
  error?: RuntimeError;
};
```

### Action

```ts
type ActionDescriptor = {
  id: string;
  label: string;
  kind: 'navigation' | 'click' | 'input' | 'retry' | 'custom';
  enabled: boolean;
  reason?: string | null;
  payloadSchema?: unknown;
  risk?: 'safe' | 'state-changing' | 'destructive' | 'sensitive';
};
```

event 只表示“发生了什么”。action 才表示“执行什么”。两者不能合并。

## Bridge Server 协议

第一阶段推荐：

```txt
HTTP API + SSE events + long polling fallback
```

推荐端点：

```txt
GET  /snapshot
GET  /events?since=<eventId>
GET  /events/stream
GET  /actions
POST /actions/:id
POST /wait
GET  /health
```

### Snapshot

```http
GET /snapshot
```

返回示例：

```json
{
  "page": {
    "ready": false,
    "phase": "pending",
    "blockers": ["loader not executed: page.loader.ts"]
  }
}
```

### Event Stream

```http
GET /events/stream?target=component:user-profile
```

SSE 示例：

```txt
event: component.ready
id: 42
data: {"target":"component:user-profile","route":"/user"}
```

### Action

```http
POST /actions/load-provider-remote
Content-Type: application/json

{}
```

动作必须通过 action 端点触发，不能通过 event 订阅触发。

## CLI 形态

CLI 是 Bridge Server 的薄封装。

示例命令：

```bash
agent-runtime open http://localhost:4332
agent-runtime snapshot
agent-runtime wait page.ready --timeout 10000
agent-runtime wait component.ready --target component:user-profile
agent-runtime actions
agent-runtime action load-provider-remote
agent-runtime events --since 42
```

CLI 支持两种浏览器模式：

| 模式 | 场景 |
| --- | --- |
| 启动隔离浏览器 | 本地 demo，不依赖登录态 |
| 连接已有浏览器 | oncall 页面、内网页面、需要账号态 |

第一阶段通过 CDP 连接 Chrome。

## CLI 如何连接页面 Runtime

CLI 不是直接请求业务页面，而是通过浏览器调试通道进入目标 tab。

```txt
CLI
  -> CDP
  -> 目标浏览器 tab
  -> window.__AGENT_RUNTIME__
  -> Runtime Center
```

事件流第一版可以用事件历史增量拉取：

1. 页面 runtime 维护带递增 id 的 event history；
2. Bridge Server 通过 CDP 调 `getEvents({ since })`；
3. Bridge Server 把新增 events 转成 SSE；
4. long polling 复用同一套 event history。

这样第一版不需要处理跨进程 callback。

## Server 生命周期

HTTP / SSE server 在浏览器页面外部运行。

### CLI 模式

```bash
agent-runtime open http://localhost:4332
```

CLI 启动本地 Bridge Server，打开或连接浏览器，并绑定目标 tab。

### Dev Plugin 模式

框架 dev 模式可以选择自动启动：

```txt
App Dev Server:    http://localhost:4332
Agent Runtime API: http://localhost:7332
```

这个能力只应该在 dev / debug / oncall 模式启用，不应该成为生产默认行为。

## 传输协议选择

| 协议 | 第一阶段建议 | 原因 |
| --- | --- | --- |
| HTTP | 用于 snapshot 和 action | 简单、好调试 |
| SSE | 用于 event stream | 适合服务端持续推事件给 Agent |
| Long polling | 兜底 | 流式连接不可用时仍能工作 |
| WebSocket | 暂不默认 | 双向能力强，但连接管理和调试成本更高 |

只有在需要高频双向通信、页面主动向 Agent 请求能力、或未来做复杂远程调试时，才需要把 WebSocket 作为 adapter 加进来。

## 自动能力和用户配置边界

### 应该自动内置

| 能力 | 归属 |
| --- | --- |
| route location / match | 框架 |
| loader lifecycle | 框架 |
| app root mounted | 框架 |
| render error | 框架 |
| remote load state | Vmok / Module Federation |
| shared runtime state | Vmok / Module Federation |
| build runtime info | 构建插件 |
| Garfish app lifecycle | Garfish |
| fatal browser error | Runtime Client |

### 必须用户声明

| 能力 | 原因 |
| --- | --- |
| business ready | 框架不知道业务成功条件 |
| key components | 框架不知道 Agent 关心哪个组件 |
| safe actions | 执行动作必须有明确授权和意图 |
| sensitive data masking | 业务最清楚数据含义 |
| ignored errors | 业务知道哪些 warning 可以忽略 |

### 可以半自动

| 能力 | 默认 | 用户覆盖 |
| --- | --- | --- |
| page ready | route + loader + mount + no fatal error | business ready marker |
| component ready | mounted | `useAgentReady` |
| navigation actions | 安全路由动作 | 业务声明 action |
| Garfish ready | app mounted | 子应用业务 ready marker |

## Demo 映射

| Demo | 主要运行态信号 |
| --- | --- |
| `react-multi-version` | shared state、dependency source、component error |
| `nested-router-tree` | route state、component relation、render error |
| `async-chunk-runtime` | build info、remote event、Garfish event、chunk error |
| `garfish-provider` | entry loaded、provider missing、Garfish mount failed |
| `redirect-loader` | loader not executed、redirect missing、page pending |
| `usenavigate-blank` | route mismatch、basename issue、action result、blank state |

## 安全边界

- Bridge Server 默认只监听 localhost。
- 生产页面默认不启动 server。
- Agent 只能执行声明过的 actions。
- actions 应带 risk 标记。
- snapshot 中敏感字段需要支持脱敏。
- Bridge Server 默认绑定单个目标 tab。
- 连接已有浏览器时，必须由用户明确选择或授权。

## 实现阶段

### Phase 1: 页面内 Runtime Center

- 实现 snapshot store。
- 实现带递增 id 的 event history。
- 实现 `subscribeEvents` 和 `waitForEvent`。
- 实现 action registry。
- 提供 React helper，例如 `useAgentReady`。

### Phase 2: 框架采集

- 接入 route / loader 状态。
- 接入 app root 和 render error。
- 注入 build runtime info。
- 接入 Vmok / Module Federation 状态。
- 接入 Garfish 生命周期。

### Phase 3: Bridge Server 和 CLI

- 实现 CDP connector。
- 实现 HTTP snapshot / actions。
- 实现 SSE event stream。
- 实现 long polling fallback。
- 实现 CLI 命令。

### Phase 4: Demo 验证

- 给现有 MF demos 接入 Runtime Center。
- 用 snapshot / events / actions 验证每个 demo。
- 保持 demo 页面只负责复现真实问题，不混入未来 API 面板。

## 待确认问题

1. `waitForEvent` 超时时，是只返回 timeout，还是返回包含 blockers 的结构化结果？
2. action 的 risk 标记是否第一阶段强制要求？
3. Garfish 状态由 Garfish 自己提供，还是先由 Agent Runtime 兼容采集？
4. React tree 第一阶段暴露到什么深度，才不会变成重做 React DevTools？
5. Bridge Server 第一阶段是一个进程支持多 tab，还是一个进程绑定一个 tab？
