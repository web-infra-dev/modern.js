# Agent Runtime API Design

## 目标

这份文档总结第一批 oncall case 里需要补的页面运行态能力，以及对应应该准备的 demo。

现有 MF / Module Federation 观测插件已经能覆盖很多加载层问题，例如 remote、manifest、shared、snapshot、remoteEntry、runtime error。这里要补的是另一层：当加载层看起来成功后，页面、路由、loader、React 组件、Garfish 子应用和业务流程到底有没有真正 ready。

## 设计原则

### 不做一堆 `getXXStatus`

不要把能力拆成很多碎片接口，例如：

```ts
getRouteStatus();
getLoaderStatus();
getComponentStatus();
getGarfishStatus();
```

更推荐做成一个统一状态模型：

```ts
getSnapshot();
getEvents(filter?);
subscribeEvents(filter, listener);
waitForEvent(filter, options?);
getActions(filter?);
runAction(actionId, payload?);
```

其中：

- `snapshot` 表示当前页面状态。
- `events` 表示历史过程。
- `actions` 表示当前可以执行的动作。

一句话：snapshot 是结果，event 是过程，action 是命令。

### 事件和动作必须分开

不要设计成：

```ts
getEvents(selector).call('event');
```

事件只能用来观察“发生过什么”，不能用来执行页面动作。执行动作必须走 `runAction`，这样 Agent 才能清楚区分“读状态”和“改页面”。

## 核心 API

### `getSnapshot(filter?)`

读取当前页面的完整结构化状态。

```ts
const snapshot = await agentRuntime.getSnapshot();
```

建议返回结构：

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

第一版可以不用一次性填满所有字段，但结构要先稳定下来。

### `getEvents(filter?)`

读取页面运行过程中已经发生的事件。

```ts
const events = await agentRuntime.getEvents({
  type: ['route.started', 'component.ready'],
  since: startTime,
});
```

事件用于回答：

- 哪一步开始了？
- 哪一步完成了？
- 哪一步报错了？
- 最后停在哪个事件？

### `subscribeEvents(filter, listener)`

持续监听页面事件。

```ts
const unsubscribe = agentRuntime.subscribeEvents(
  { target: 'route:/features' },
  event => {
    console.log(event);
  },
);
```

监听主要给 Agent 做稳定等待，不是给人看的主入口。它可以替代固定 sleep，避免 Agent 一直等或误判成功。

### `waitForEvent(filter, options?)`

等待某个明确事件出现。

```ts
await agentRuntime.waitForEvent(
  { type: 'component.ready', target: 'page:features' },
  { timeout: 10_000 },
);
```

适合验证跳转、loader、组件挂载、业务 ready。

### `getActions(filter?)`

读取当前页面可执行动作。

```ts
const actions = await agentRuntime.getActions({
  kind: 'navigation',
});
```

返回示例：

```ts
[
  {
    id: 'go-to-features',
    label: 'Go to features',
    kind: 'navigation',
    enabled: true,
    reason: null,
  },
];
```

### `runAction(actionId, payload?)`

执行页面声明过的动作。

```ts
await agentRuntime.runAction('go-to-features');
```

动作执行后，Agent 应该再读取 `getSnapshot()` 或等待 `waitForEvent()` 来判断结果。

第一版可以先只支持 demo 内动作，不急着做通用点击所有 DOM。

## 状态模型

### 通用 phase

route、loader、remote、Garfish、业务流程都可以用同一套 phase：

```ts
type Phase =
  | 'idle'
  | 'started'
  | 'pending'
  | 'loading'
  | 'success'
  | 'error'
  | 'blocked'
  | 'unknown';
```

每个状态对象建议都有：

```ts
type BaseState = {
  id: string;
  phase: Phase;
  startedAt?: number;
  updatedAt: number;
  duration?: number;
  reason?: string;
  error?: RuntimeError;
};
```

### React component lifecycle

React 组件不能只用 `success` 表示。组件需要单独生命周期：

```ts
type ComponentLifecycle =
  | 'created'
  | 'rendering'
  | 'mounted'
  | 'ready'
  | 'error'
  | 'unmounted';
```

必须区分：

- `remote.loaded`：MF / MF 层加载成功。
- `component.mounted`：React 组件真的挂载。
- `component.ready`：业务声明首屏或关键数据 ready。
- `component.error`：React 渲染阶段报错。

## 需要提供的能力

### 1. 页面状态

用于判断页面是不是 ready，是否卡住，以及卡住原因。

建议字段：

```ts
type PageState = BaseState & {
  url: string;
  title?: string;
  ready: boolean;
  pendingReason?: string;
  degraded?: boolean;
};
```

对应场景：

- redirect 卡住
- loader 卡住
- 页面一直 loading
- Agent 一直等待

### 2. 路由状态

用于判断当前路径、basename、match、redirect、导航是否正常。

建议字段：

```ts
type RouteState = BaseState & {
  location: string;
  basename?: string;
  matched?: boolean;
  matchedRouteIds?: string[];
  redirecting?: boolean;
  redirectTarget?: string;
  navigationType?: 'push' | 'replace' | 'pop' | 'unknown';
};
```

对应场景：

- `useNavigate` 首次生效后续跳转空白
- nested Router
- Router inside Router
- basename mismatch
- redirect 卡住

### 3. Loader 状态

用于判断 loader 是否执行、执行到哪一步、是否 redirect、是否 pending。

建议字段：

```ts
type LoaderState = BaseState & {
  routeId?: string;
  name?: string;
  redirectTarget?: string;
  pendingReason?: string;
};
```

对应场景：

- `page.loader.ts` 没执行
- SSR redirect 没发生
- loader 还在 pending
- Agent 不知道页面为什么一直等待

### 4. 组件状态和组件树

用于判断 React 组件是否真的挂载、是否 ready、是否报错。

建议字段：

```ts
type ComponentState = {
  id: string;
  name?: string;
  framework: 'react' | 'vue' | 'unknown';
  ownerRemote?: string;
  routeId?: string;
  lifecycle: ComponentLifecycle;
  mountedAt?: number;
  readyAt?: number;
  error?: RuntimeError;
};
```

对应场景：

- remote 加载成功但页面白屏
- nested Router
- React Context Provider warning
- Invalid hook call
- 组件已 mounted 但业务未 ready

第一版可以先做关键组件注册，不必完整复刻 React DevTools。

### 5. MF 组件树关联

用于把 React 组件和 MF remote 关联起来。

建议字段：

```ts
type RemoteComponentRelation = {
  remote: string;
  expose?: string;
  componentId?: string;
  lifecycle: ComponentLifecycle;
};
```

对应场景：

- 查询当前 React tree，并结合 MF 组件判断树是否正常
- 区分 remote loaded 和 remote component ready

### 6. 入口和 provider 状态

用于判断入口文件是否加载、导出的 provider 是否存在。

建议字段：

```ts
type EntryState = BaseState & {
  entryUrl?: string;
  loaded: boolean;
  exports?: string[];
  providerFound?: boolean;
};
```

对应场景：

- Garfish provider undefined 白屏
- 提供出去的入口文件未加载
- provider 导出识别失败

### 7. Garfish 子应用状态

Garfish 场景需要单独暴露子应用加载状态。

建议字段：

```ts
type GarfishState = {
  apps: Array<{
    name: string;
    phase: Phase;
    entry?: string;
    providerLoaded?: boolean;
    mounted?: boolean;
    error?: RuntimeError;
  }>;
};
```

对应场景：

- Garfish 子应用是否加载
- provider 是否 ready
- 子应用是否 mounted

### 8. 构建运行信息

用于读取页面当前使用的关键构建信息。

建议字段：

```ts
type BuildRuntimeInfo = {
  uniqueName?: string;
  chunkLoadingGlobal?: string;
  publicPath?: string;
  runtimeChunk?: string;
  entryUrl?: string;
};
```

对应场景：

- async chunk 404
- async chunk 变成 `undefined.js`
- 多套产物 runtime 没隔离
- 需要读取 `chunkLoadingGlobal` / `uniqueName`

### 9. Shared 实际来源

用于判断 shared 看起来一致时，实际运行是不是同一份 React。

建议字段：

```ts
type SharedState = {
  name: string;
  version?: string;
  scope?: string;
  owner?: string;
  singleton?: boolean;
  instanceId?: string;
  usedBy?: string[];
  source?: DependencySource;
};
```

对应场景：

- shared 配了 React，但仍然 Invalid hook call
- shared 层显示一致，但组件库自己又打包 React
- 需要判断消费者和生产者最终是不是同一个 React 实例

### 10. 依赖来源追踪

用于定位某个依赖是从哪里进入产物的。

建议字段：

```ts
type DependencySource = {
  packageName: string;
  version?: string;
  bundled?: boolean;
  issuer?: string;
  sourceFile?: string;
  packagePath?: string;
};
```

对应场景：

- 第三方组件库把 React 打包进产物
- 需要查询编译前源码文件地址
- 需要证明 React 来源不是宿主 shared

### 11. Proxy SDK 状态

用于 Agent 验证 proxy 改造是否生效。

建议字段：

```ts
type ProxyState = {
  enabled: boolean;
  rules: Array<{
    from: string;
    to: string;
    matched: boolean;
  }>;
  lastMatchedRule?: string;
};
```

对应场景：

- proxy sdk + 状态获取
- 改造子应用后直接验证
- 判断是否仍然加载线上代码

### 12. Agent 动作能力

用于让 Agent 自己执行验证流程。

动作能力不要依赖脆弱 DOM selector，应该由页面或框架声明。

建议字段：

```ts
type ActionDescriptor = {
  id: string;
  label: string;
  kind: 'navigation' | 'click' | 'input' | 'retry' | 'custom';
  enabled: boolean;
  reason?: string | null;
  payloadSchema?: unknown;
};
```

对应场景：

- useNavigate 跳转验证
- 点击后观察 route / component 是否 ready
- Agent 自行完成复现流程

## Demo 关联

Demo 的具体测试信息放在 [Agent Runtime MF Demos](../../tests/integration/agent-runtime-mf/README.md)。这里仅保留 API 设计和 demo 之间的对应关系。

| Demo | 来源 case | 主要验证能力 |
| --- | --- | --- |
| [React 多实例检测](../../tests/integration/agent-runtime-mf/README.md#react-multi-version) | `03-zustand-react-version-check`、`13-react-multi-version-invalid-hook` | `shared`、`DependencySource`、`component.error`、`proxy` |
| [nested Router / React tree](../../tests/integration/agent-runtime-mf/README.md#nested-router-tree) | `04-volcengine-nested-router-hmr` | `route`、`components`、`RemoteComponentRelation` |
| [async chunk 404 / runtime 隔离](../../tests/integration/agent-runtime-mf/README.md#async-chunk-runtime) | `08-rivendell-async-chunk-404` | `build.uniqueName`、`build.chunkLoadingGlobal`、`build.publicPath`、`events` |
| [Garfish provider 白屏](../../tests/integration/agent-runtime-mf/README.md#garfish-provider) | `10-garfish-provider-white-screen` | `EntryState`、`GarfishState`、`component.ready` |
| [redirect / loader 卡住](../../tests/integration/agent-runtime-mf/README.md#redirect-loader) | `12-cloud-engine-redirect-stuck` | `page`、`route`、`loaders`、`pendingReason` |
| [useNavigate 跳转空白](../../tests/integration/agent-runtime-mf/README.md#usenavigate-blank) | `14-usenavigate-jump-blank` | `route`、`components`、`actions`、`events` |

## 第一阶段建议实现范围

第一阶段先做：

1. `getSnapshot()`
2. `getEvents(filter?)`
3. `waitForEvent(filter, options?)`
4. `getActions(filter?)`
5. `runAction(actionId, payload?)`

第一阶段 snapshot 先覆盖：

- `page`
- `route`
- `loaders`
- `components`
- `build`
- `shared`
- `garfish`
- `actions`
- `errors`

第一阶段 demo 先做：

1. redirect / loader 卡住
2. useNavigate 跳转空白
3. Garfish provider 白屏
4. async chunk 404
5. React 多实例检测

## 暂不做

这些暂时不放第一阶段：

- 完整复刻 React DevTools 的组件树。
- 通用 DOM selector 点击。
- 支持所有 Vue 场景。
- MF v1 专项兼容。
- 发布、构建、权限、平台流程类问题。

## 待确认

1. `getComponentTree()` 第一阶段做到什么深度：只暴露关键组件，还是尽量接近 React tree。
2. `DependencySource` 的数据来源：运行时能拿到多少，构建期需要补多少。
3. `runAction()` 第一阶段是否只服务 demo，还是设计成可被业务页面正式声明。
4. Garfish 的状态由 Garfish 自己提供，还是先由外层 Agent Runtime 兼容采集。
