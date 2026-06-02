# RFC: 通用 Agent Runtime SDK

## 状态

Draft

## 摘要

本文定义一套框架无关的 Agent Runtime SDK，用于让 AI Agent 读取页面运行态、订阅运行事件、等待页面 ready，并执行页面声明过的安全动作。

这套 SDK 不绑定 Modern.js。Modern.js、MF、Garfish 和业务代码都可以作为接入方，把各自掌握的运行态信息写入同一个页面级 Runtime Center。Agent 再通过统一的 snapshot、events、wait 和 actions API 读取这些信息。

核心设计：

- 一个浏览器页面内只有一个主 Runtime Center。
- Modern.js、MF、Garfish 和业务代码通过 Runtime Client 写入状态。
- SDK 包允许多版本共存，但运行时状态要收敛到同一个页面级 Runtime Center。
- snapshot 只表示当前状态，events 记录历史过程。
- 框架和运行时负责自动采集，业务只补充框架无法判断的 ready 条件和安全动作。
- 页面内 runtime 不启动 server；CLI / HTTP / SSE 由页面外 Bridge Server 提供。

目标是让 Agent 从“看 UI、查 DOM、等请求、猜问题”，升级为“读取结构化运行态、按声明能力调试页面”。

## 背景

Agent 调试前端页面时，通常只能依赖外部现象：

- 页面是否白屏；
- DOM 元素是否出现；
- 请求是否安静；
- console 是否报错；
- 点击后页面是否继续变化。

这些信号能帮助定位问题，但无法稳定说明页面卡在哪一层。类似的页面异常，根因可能来自完全不同的运行层：

| 场景 | 外部现象 | 真正需要知道的信息 |
| --- | --- | --- |
| 路由没有匹配 | 页面空白或停在旧页面 | 当前 location、basename、matched routes |
| loader 卡住或 redirect 异常 | 页面一直 pending 或跳转不符合预期 | loader started / success / redirect / error |
| MF remote 加载失败 | 远程组件不可用 | manifest、remoteEntry、expose、shared 依赖状态 |
| React 渲染异常 | 页面报错或局部不可用 | root mounted、route component mounted、render error |
| Garfish 子应用挂载失败 | 子应用白屏 | entry loaded、provider resolved、mount success / error |
| 业务数据没 ready | UI 看起来有内容但流程不可用 | 业务声明的 ready marker |

如果只在 Modern.js 内实现这套能力，后续其他框架、MF runtime、Garfish 或业务自定义 runtime 接入时会受限。因此需要先定义一个通用 Agent Runtime SDK，再让 Modern.js 和 MF 内置接入，形成更完整的组合体验。

## 目标

- 定义框架无关的 Runtime Center、Runtime Client 和 AgentRuntime API。
- 明确页面级单例 Runtime Center、多来源 Runtime Client 的运行模型。
- 支持 SDK 多版本共存，但通过稳定协议连接到同一个页面级中心。
- 明确 snapshot、events、wait、actions 的职责边界。
- 支持 Modern.js 自动写入 route、loader、render、SSR、hydration 等框架状态。
- 支持 MF 自动写入 remote、manifest、expose、shared、runtime error 等模块加载状态。
- 支持业务用轻量 API 声明 ready 条件和安全动作。
- 为 CLI / HTTP / SSE / DevTools / Agent 提供统一访问入口。

## 设计原则

### 页面级单例 Runtime Center

一个浏览器页面内应该只有一个主 Runtime Center。它负责聚合当前 snapshot、历史 events、ready、blockers 和 actions。

不建议让每个框架、每个 remote、每个子应用都维护自己的独立中心。纯多中心会带来几个问题：

- Agent 需要发现多个中心；
- snapshot 需要跨中心合并；
- events 需要跨中心排序；
- ready 和 blockers 需要跨中心归并；
- action id 可能冲突；
- 页面当前状态会变得不稳定。

第一版不做真正的多中心合并。

### 多来源 Runtime Client

虽然 Runtime Center 是页面级单例，但写入方可以有多个：

- Modern.js Runtime Client；
- MF Runtime Client；
- Garfish Runtime Client；
- 业务 Runtime Client；
- 其他框架或自定义 runtime 的 Runtime Client。

这些 client 可以来自不同包、不同版本、不同子应用，但最终都写入同一个页面级 Runtime Center。

### 通过协议共享，不通过实例共享

SDK 不应该要求所有接入方 import 同一个包实例，也不应该依赖 `instanceof RuntimeCenter` 这类判断。

不同版本的 Runtime Client 应该通过稳定协议发现并连接页面级 Runtime Center。

示例：

```ts
const RUNTIME_CENTER_KEY = Symbol.for('agent-runtime.center');

const center = globalThis[RUNTIME_CENTER_KEY];
```

中心需要暴露：

- `protocolVersion`；
- `capabilities`；
- `emit`；
- `updateState`；
- `markReady`；
- `registerAction`；
- `getSnapshot`；
- `getEvents`；
- `waitFor`；
- `runAction`。

client 连接中心时必须先做能力判断：

- 老 client 连接新 center：使用共同能力；
- 新 client 连接老 center：缺失能力降级；
- center 不存在：进入 no-op 或 standalone 模式。

### Snapshot 是当前态

snapshot 只表示页面当前仍然 active 的状态，不是历史日志。

例如页面从 `/orders` 跳转到 `/orders/123` 后，再调用 `getSnapshot()`，应该返回 `/orders/123` 的当前状态。旧的 `/orders` route、loader、component ready 不应该继续留在当前 snapshot 主体里。

历史过程应该通过 events 查询。

snapshot 可以保留少量辅助上下文，例如：

- latestEventId；
- previous location；
- active scopes；
- 最近 fatal error。

但它不能长期保留已经失效的 route、loader、component ready，否则 Agent 会误判当前页面状态。

### Events 是历史过程

events 记录运行过程中已经发生过的事实，例如：

- `route.navigation.start`；
- `route.matched`；
- `loader.success`；
- `mf.remote.load.error`；
- `component.mounted`；
- `business.ready`。

Agent 想知道“之前发生了什么”，应该读 events，而不是让 snapshot 承担历史职责。

### Actions 和 Events 分开

event 只能观察，不能触发页面行为。

action 才表示页面允许 Agent 执行的动作。Agent 只能执行页面、框架或业务明确注册过的 action。

## 总体架构

```txt
Modern.js / MF / Garfish / 业务代码 / 其他框架
        ↓
多个 Runtime Client
        ↓
一个页面级 Runtime Center
        ↓
AgentRuntime API
        ↓
Bridge Server
        ↓
CLI / HTTP / SSE / DevTools / Agent
```

三个核心对象：

| 对象 | 使用方 | 职责 |
| --- | --- | --- |
| Runtime Center | 页面内 runtime | 维护 snapshot、events、ready、blockers、actions |
| Runtime Client | 框架、MF、Garfish、业务代码 | 写入状态、事件、ready、action |
| AgentRuntime API | Bridge Server、CLI、DevTools、Agent | 读取状态、订阅事件、等待 ready、执行 action |

Runtime Center 是页面内实现细节，不是对业务暴露的主要 API。业务更常用的是 `useAgentReady`、`AgentReady`、`registerAgentAction` 这类轻量 API。

## Runtime Center

Runtime Center 是页面内唯一的主状态中心。

### 创建时机

主 Runtime Center 应该由宿主应用或框架创建。

在 Modern.js 场景中，推荐由 Modern.js runtime 初始化阶段创建，并挂到两个位置：

```ts
internalRuntimeContext.agentRuntime = runtimeCenter;
globalThis[Symbol.for('agent-runtime.center')] = runtimeCenter.api;
```

- `internalRuntimeContext.agentRuntime` 给框架内部、MF adapter、Garfish adapter 写入。
- `globalThis[Symbol.for('agent-runtime.center')]` 给不同版本的 Runtime Client 和 Bridge Server 发现。

window / globalThis 上只暴露受控 API，不暴露完整内部实现。

### Center 冲突处理

第一版规则：

- 宿主框架创建的 center 优先级最高。
- Runtime Client 默认只连接已有 center，不主动创建主 center。
- 独立运行的应用可以由自己的框架 adapter 创建 standalone center。
- 如果没有 center，薄 client 默认 no-op，避免因为宿主未接入而影响业务运行。

暂不支持多个主 center 自动合并。

### 存储内容

Runtime Center 至少维护：

- Snapshot Store；
- Event History；
- Subscription Registry；
- Action Registry；
- Ready / Blocker Evaluator；
- Capability Registry。

event history 应该有上限，例如 ring buffer，避免无限增长。snapshot 中记录 `latestEventId`，方便 Agent 增量读取 events。

## Runtime Client

Runtime Client 是写入侧 API。

框架、MF、Garfish 和业务代码都通过 Runtime Client 写入状态，但不直接操作 Runtime Center 内部 store。

建议基础 API：

```ts
type RuntimeClient = {
  updateState(patch: RuntimeStatePatch): void;
  emit(event: RuntimeEventInput): RuntimeEvent | void;
  markReady(target: string, ready: boolean, details?: unknown): void;
  registerAction(action: ActionDescriptor, handler: ActionHandler): void;
  reportError(error: RuntimeError): void;
};
```

写入顺序建议：

1. 先更新 snapshot；
2. 再发 event。

这样 Agent 收到 event 后，能马上读到最新 snapshot。

## AgentRuntime API

AgentRuntime API 是读取侧和受控操作 API。

Agent 通常不直接在页面 JS 里调用它，而是通过 CLI、HTTP、SSE、DevTools 或其他 Agent 工具访问。Bridge Server 再连接目标浏览器 tab，调用页面内 AgentRuntime API。

建议 API：

```ts
type AgentRuntime = {
  getSnapshot(filter?: SnapshotFilter): Promise<RuntimeSnapshot>;
  getEvents(filter?: EventFilter): Promise<RuntimeEvent[]>;
  subscribeEvents(
    filter: EventFilter,
    listener: (event: RuntimeEvent) => void,
  ): () => void;
  waitFor(
    condition: WaitCondition,
    options?: WaitOptions,
  ): Promise<ReadyResult | RuntimeEvent>;
  getActions(filter?: ActionFilter): Promise<ActionDescriptor[]>;
  runAction(actionId: string, payload?: unknown): Promise<ActionResult>;
};
```

## 数据模型

### Snapshot

```ts
type RuntimeSnapshot = {
  page: PageState;
  route?: RouteState;
  loaders?: LoaderState[];
  components?: ComponentState[];
  mf?: MFState;
  garfish?: GarfishState;
  business?: BusinessState;
  actions?: ActionDescriptor[];
  errors?: RuntimeError[];
  latestEventId: number;
};
```

snapshot 中只保留当前 active 的状态。

跨路由仍然 active 的对象可以继续保留，例如：

- app root；
- layout route；
- shell remote；
- 当前仍在使用的 MF shared dependency；
- 当前仍 mounted 的 Garfish 子应用；
- 当前页面仍有效的 business ready marker。

已失效的 route、loader、component ready 需要从 snapshot 主体移除，历史信息进入 events。

### Event

```ts
type RuntimeEvent = {
  id: number;
  type: string;
  source: 'framework' | 'mf' | 'garfish' | 'business' | 'agent' | 'bridge';
  scope?: RuntimeScope;
  target?: string;
  phase?: string;
  timestamp: number;
  evidence?: string[];
  details?: unknown;
  error?: RuntimeError;
};
```

event 是已经发生的事实。event 不执行动作。

### Scope

scope 用于判断状态是否仍然 active。

```ts
type RuntimeScope = {
  kind: 'page' | 'router' | 'route' | 'loader' | 'component' | 'mf' | 'garfish' | 'business';
  id: string;
  parentId?: string;
  active?: boolean;
};
```

路由跳转后，旧 route scope 可以变成 inactive。Runtime Center 根据 active scopes 清理 snapshot 主体。

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

Action 必须显式注册。Agent 不能执行未注册动作。

### Ready Result

```ts
type ReadyResult = {
  ready: boolean;
  level: 'document' | 'framework' | 'view' | 'business';
  phase: 'pending' | 'success' | 'error' | 'blocked' | 'unknown';
  evidence: string[];
  blockers: string[];
};
```

ready 结果由 Runtime Center 根据当前 snapshot 和 active scopes 计算。

## Modern.js 接入

Modern.js adapter 负责自动写入框架能够确定的状态。

### App 和 React Root

记录：

- document ready；
- app runtime initialized；
- root render start；
- root mounted；
- hydration start / success / error；
- fatal error。

### Router

Modern.js 应基于当前框架路由接入，不另起一套路由监听。

建议采集：

- current location；
- previous location；
- basename；
- matched routes；
- route id / path / handle；
- navigation state；
- route error；
- route component mounted / unmounted / error。

建议事件：

| 框架生命周期 | Runtime event |
| --- | --- |
| 开始跳转 | `route.navigation.start` |
| 路由匹配完成 | `route.matched` |
| 路由不匹配 | `route.unmatched` |
| 路由错误 | `route.error` |
| route component mounted | `route.component.mounted` |
| 框架层 route ready | `route.ready` |

`route.ready` 只表示框架层 ready，不代表业务 ready。

### Loader

Modern.js 约定式 data loader 和 router loader 都归入 route data loader。

建议事件：

| 状态 | Runtime event |
| --- | --- |
| 开始执行 | `loader.start` |
| 成功返回 | `loader.success` |
| redirect | `loader.redirect` |
| 失败 | `loader.error` |
| 被跳转取消或失效 | `loader.inactive` |

没有 loader 的 route 不需要自动创建 loader。路由状态由 router state 和 route component lifecycle 判断。

### SSR

SSR 场景不能使用服务端全局 singleton。

每个 request 创建 request-scoped runtime store，记录服务端初始状态：

- matched routes；
- loader started / success / redirect / error；
- loaderData；
- route error；
- SSR fallback 或降级信息。

HTML 中只下发初始 runtime data：

```html
<script>
  window.__AGENT_RUNTIME_INITIAL_DATA__ = {};
</script>
```

客户端 Runtime Center 初始化时读取这份数据，再接管后续事件。

## MF 接入

MF adapter 负责自动写入模块联邦运行时信息。

建议采集：

- MF instance name；
- remote name；
- remote type；
- manifest URL；
- remoteEntry URL；
- expose name；
- shared dependency name / version / from / strategy；
- uniqueName；
- build id；
- runtime error。

建议事件：

| 状态 | Runtime event |
| --- | --- |
| remote 开始加载 | `mf.remote.load.start` |
| remote 加载成功 | `mf.remote.load.success` |
| remote 加载失败 | `mf.remote.load.error` |
| expose 开始解析 | `mf.expose.resolve.start` |
| expose 解析成功 | `mf.expose.resolve.success` |
| expose 解析失败 | `mf.expose.resolve.error` |
| shared 解析成功 | `mf.shared.resolve.success` |
| shared 解析失败 | `mf.shared.resolve.error` |

MF 可以说明 remote / expose / shared 是否正常，但不判断业务组件是否 ready。

生产者不需要为了加载层观测主动引用 SDK。宿主侧 MF adapter 可以采集加载层信息。

如果生产者或远程业务组件想声明业务 ready，可以引用薄业务 API，例如：

```tsx
useAgentReady('order-detail-page', ready);
```

这个 API 应该满足：

- 有 Runtime Center 就写入；
- 没有 Runtime Center 就 no-op；
- 不影响业务正常运行；
- 通过能力判断适配不同协议版本。

## 业务拓展 API

业务只补充框架无法自动判断的信息。

建议 API：

```tsx
useAgentReady('user-profile', !loading && Boolean(data));
```

```tsx
<AgentReady id="order-detail-page" ready={Boolean(order)} />
```

```ts
registerAgentAction({
  id: 'retry-order-loader',
  label: 'Retry order loader',
  kind: 'retry',
  risk: 'safe',
  handler: () => refetch(),
});
```

业务 API 不应该要求业务理解 Runtime Center 的内部结构。

## Bridge Server 和 Agent 访问

页面内 Runtime Center 不启动 HTTP server。

CLI / HTTP / SSE / DevTools / Agent 通过页面外 Bridge Server 访问页面能力。

推荐路径：

```txt
Agent / CLI
  ↓
Bridge Server
  ↓
Browser Connector
  ↓
目标浏览器 tab
  ↓
页面内 AgentRuntime API
```

第一版 Browser Connector 可以优先使用 CDP。后续可以扩展到浏览器插件、WebSocket 或其他连接方式。

## Page Ready 组合规则

Runtime Center 需要基于当前 active snapshot 计算 page ready。

建议分层：

| Level | 含义 |
| --- | --- |
| document | HTML / document 基础可用 |
| framework | 框架 runtime、router、root render 基础可用 |
| view | 当前 route、loader、remote、sub app、component mounted 可用 |
| business | 业务声明的 ready marker 已满足 |

Agent 等待页面时，可以选择不同 level：

```ts
await agentRuntime.waitFor({
  type: 'page.ready',
  level: 'business',
  timeout: 10000,
});
```

如果超时，返回 blockers：

```json
{
  "ready": false,
  "level": "business",
  "phase": "blocked",
  "blockers": [
    "loader pending: order-detail-loader",
    "business ready not received: order-detail-page"
  ]
}
```

## 版本和兼容策略

SDK 需要把协议版本和包版本分开。

- 包版本：npm package version。
- 协议版本：Runtime Client 和 Runtime Center 通信能力版本。

Runtime Center 暴露：

```ts
type RuntimeProtocolInfo = {
  protocolVersion: string;
  capabilities: string[];
};
```

Runtime Client 连接时：

1. 读取 `protocolVersion`；
2. 判断 `capabilities`；
3. 只使用双方都支持的能力；
4. 缺失能力降级；
5. 不因为观测能力缺失影响业务运行。

## 实现阶段

### 阶段一：通用 SDK 基础

- 定义协议、数据结构和事件命名。
- 实现页面级 Runtime Center。
- 实现 Runtime Client。
- 实现 `getSnapshot`、`getEvents`、`waitFor`、`getActions`、`runAction`。
- 明确 snapshot 当前态和 events 历史过程的边界。

### 阶段二：Modern.js 内置接入

- 接入 app root 生命周期。
- 接入 router state。
- 接入 loader。
- 接入 route component mounted / error。
- 接入 SSR 初始状态和 hydration。

### 阶段三：MF 内置接入

- 接入 remote / manifest / remoteEntry。
- 接入 expose resolve。
- 接入 shared dependency resolve。
- 接入 runtime error。
- 和现有 MF observability 能力对齐字段。

### 阶段四：业务拓展 API

- 提供 `useAgentReady` / `AgentReady`。
- 提供 `registerAgentAction`。
- 定义业务 ready marker 的 scope 和清理规则。

### 阶段五：Agent 访问层

- 提供 Bridge Server。
- 提供 CLI。
- 提供 HTTP snapshot API。
- 提供 SSE / stream events API。
- 支持连接已有浏览器 tab。

### 阶段六：验证和评测

- 用已有 MF / Modern.js case 验证问题分层。
- 对比无 SDK 和有 SDK 时的定位耗时。
- 记录 fixed / unresolved / not_reproduced / blocked。
- 验证登录态页面、本地 demo、MF remote、Garfish 子应用场景。

## 待确认问题

- SDK 包名和对外定位。
- `globalThis` key 是否使用 `Symbol.for('agent-runtime.center')`。
- Runtime Client 默认无 center 时是 no-op，还是是否需要短暂 buffer。
- Modern.js 内置接入默认是否只在 dev / debug 模式启用。
- MF 接入放在 runtime 内部，还是作为 observability plugin 的扩展。
- 第一版是否需要支持 iframe / worker / 跨 tab 的多中心聚合。
- business ready marker 是否需要默认随 route scope 自动清理。
