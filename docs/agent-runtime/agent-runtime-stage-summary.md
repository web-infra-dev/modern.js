# OpenRuntime 阶段性总结

## 名称

建议统一使用 **OpenRuntime**。

这里的 Open 不是强调开源，而是强调“应用把自己的 Runtime 开放给 Agent 访问”。应用通过 OpenRuntime 暴露结构化的 State、Action 和 Event，让 Agent 可以读取状态、等待变化、执行声明动作并验证结果。

它可以拆成三个层次理解：

| 名称 | 含义 |
| --- | --- |
| OpenRuntime | 产品能力名称 |
| OpenRuntime SDK | 前端应用接入这套能力的 SDK |
| OpenRuntime API | Agent 实际读取状态、等待状态、执行动作时调用的 API |

不建议继续使用 “diagnostics”、“inspection spec” 或 “interaction spec” 作为主名称。这些词容易把范围说窄，或者让它听起来像一个协议文档。

OpenRuntime 更贴近当前目标：它不是普通调试工具，而是一套让应用向 Agent 开放运行时上下文的能力。

## 背景

当前 AI coding 在前端开发里经常卡在“实现后验证”这一步。

Agent 可以修改代码、启动项目、打开页面，但它对页面运行状态的理解仍然主要依赖外部现象：

- 页面 UI 是否看起来正常；
- DOM 里有没有某个元素；
- console 有没有报错；
- network 是否安静；
- 点击后页面有没有变化；
- 人是否告诉它“现在不对”。

这些方式能提供线索，但不稳定，也很依赖人的中途介入。

例如同样是页面没有按预期工作，真实原因可能分别在：

- route 没有匹配；
- loader 没有完成或 redirect 不符合预期；
- MF remote / expose / shared 加载异常；
- Garfish 子应用没有 mount 成功；
- React root 或 route component 渲染异常；
- 业务数据没有 ready；
- 页面已经 ready，但 Agent 不知道下一步可以执行什么动作。

如果 Agent 只能看页面外部现象，就很难稳定进入真正的自动循环。

## 目的

OpenRuntime 的目标不是做一个新的 WebMCP，也不是做一个通用浏览器自动化工具。

它的目标是：

> 让前端应用向 Agent 暴露结构化页面状态、运行事件、可等待条件和受控操作 API，让 Agent 在 AI coding 过程中可以自主观察页面、操作页面并验证结果，减少人的中途介入。

最终希望支持这样的 agent loop：

```txt
聊清楚目标和方案
  ↓
Agent 修改代码
  ↓
Agent 启动页面
  ↓
Agent 读取页面状态
  ↓
Agent 执行页面声明过的动作
  ↓
Agent 验证结果
  ↓
如果失败，继续修正
  ↓
输出最终结果
```

也就是说，人的角色尽量收敛到：

- 开始时确认目标；
- 关键方案需要取舍时参与；
- 最后 review 结果。

中间的运行、观察、操作、验证，尽量交给 OpenRuntime 支撑。

## 产品形态

OpenRuntime 是一套前端运行时 SDK。

它由三层组成：

```txt
采集层
Modern.js / MF / Garfish / React / 业务代码
        ↓
核心运行时
Runtime Center / Snapshot / Events / Ready / Blockers / Actions
        ↓
暴露层
Window API / Bridge Server / CLI / WebMCP / 平台原生能力
```

### 稳定的是运行时语义

OpenRuntime 应该稳定定义这些概念：

- `snapshot`：页面当前状态；
- `events`：页面历史过程；
- `ready`：某个页面、路由、组件或业务目标是否可用；
- `blockers`：当前为什么还不能认为 ready；
- `actions`：页面声明给 Agent 的安全动作；
- `evidence`：Agent 判断结果成立的证据。

这些是 OpenRuntime 的核心价值。

### 可替换的是接入原子

后续随着浏览器、Agent 平台和各大厂商能力发展，底层接入方式可以替换。

例如：

- 现在可以先用 `window.__OPEN_RUNTIME__` 暴露；
- 内部平台可以通过自己的 bridge 访问；
- 后续 Chrome WebMCP 成熟后，可以新增 WebMCP adapter；
- 移动端容器或平台原生能力也可以提供自己的 adapter。

关键原则是：

> Runtime Center 不关心自己被哪种方式访问。WebMCP、CLI、Bridge Server、Window API 都只是 transport，不是核心协议。

### 和 WebMCP 的关系

WebMCP 可以作为未来的一个重要出口，但不是 OpenRuntime 的替代品。

WebMCP 更像是：

```txt
Agent 如何发现和调用页面能力
```

OpenRuntime 要解决的是：

```txt
前端应用如何产出 Agent 需要的页面状态、运行事件、ready 条件、blockers 和 actions
```

所以更合理的关系是：

```txt
Modern.js / MF / Garfish / 业务代码
        ↓
OpenRuntime
        ↓
WebMCP adapter / CLI / Bridge / Window API
        ↓
Agent
```

后续如果 WebMCP 成熟，可以把 OpenRuntime 的能力注册成 WebMCP tools，例如：

- `openRuntime.getSnapshot`
- `openRuntime.getEvents`
- `openRuntime.getActions`
- `openRuntime.waitFor`
- `openRuntime.runAction`

这样不是被 WebMCP 替代，而是把 WebMCP 作为标准出口。

## 接入和访问方式

OpenRuntime 的接入和访问需要分开看：

```txt
页面如何接入 OpenRuntime
页面外的 Agent 如何访问 OpenRuntime
```

页面内接入依赖 SDK。页面外访问依赖 Window API、HTTP Bridge、CLI 或未来的 WebMCP adapter。

### 基础 SDK

第一版只提供一个基础包：

```txt
@open-runtime/core
```

Modern.js、MF 和业务代码都依赖这个包：

```txt
Modern.js 内置接入 -> @open-runtime/core
MF 内置接入        -> @open-runtime/core
业务手动接入      -> @open-runtime/core
```

第一期不单独提供：

```txt
@open-runtime/modern-js
@open-runtime/module-federation
@open-runtime/react
```

原因是：

- Modern.js 和 MF 可以直接在各自实现里内置 OpenRuntime；
- React tree 暂时不是判断业务 ready 的核心依据；
- 过早拆包会增加理解成本和维护成本。

### Window API

Window API 是最小访问出口：

```ts
window.__OPEN_RUNTIME__
```

它适合：

- 本地调试；
- Agent 通过浏览器上下文直接读取；
- 没有 HTTP Bridge 时作为兜底；
- 验证 SDK 是否正常工作。

Window API 不负责跨进程通信。页面外的 Agent 如果要稳定访问页面运行态，仍然需要 HTTP Bridge。

### HTTP Bridge

HTTP Bridge 是本地服务，不是 SDK 本体。它负责把页面里的 OpenRuntime 暴露给页面外的 Agent、CLI 或平台。

核心链路：

```txt
页面 OpenRuntime
        ↓ WebSocket 主动连接
本地 HTTP Bridge
        ↑ HTTP API
Agent / CLI / 平台
```

页面需要主动连接 Bridge，因为浏览器页面不能自己启动 HTTP 服务，页面外的 Agent 也不能直接请求某个页面实例。

第一版 HTTP Bridge 可以提供：

```txt
GET  /runtimes
GET  /runtimes/:runtimeId/targets
GET  /runtimes/:runtimeId/snapshot
GET  /runtimes/:runtimeId/events
GET  /runtimes/:runtimeId/actions
GET  /runtimes/:runtimeId/actions/:name/options
POST /runtimes/:runtimeId/actions/:name/run
POST /runtimes/:runtimeId/wait-for
GET  /runtimes/:runtimeId/events/stream
```

其中：

- `runtimes` 表示当前连接到 Bridge 的页面 Runtime 实例；
- `targets` 表示某个 Runtime 里可以被 Agent 引用或等待的目标；
- `snapshot` 表示页面当前状态；
- `events` 表示页面历史变化；
- `actions` 表示页面声明的可执行动作；
- `options` 表示动态参数选项；
- `run` 表示执行页面声明过的 action；
- `wait-for` 表示等待页面状态变化；
- `events/stream` 表示持续监听事件。

页面里的 OpenRuntime 仍然是事实来源。Bridge 可以缓存最近的 snapshot 和 events，但不能成为主状态源。页面断开后，Bridge 可以返回最后一次看到的状态，但必须标记为 disconnected。

Bridge 接受页面 Runtime 连接后自动生成 `runtimeId`。`runtimeId` 表示这一次连接实例，不由页面自定义，也不跨刷新复用。

```ts
type ConnectedRuntime = {
  runtimeId: string;
  url: string;
  appName?: string;
  runtimeVersion: string;
  status: 'connected' | 'disconnected';
  connectedAt: number;
  lastSeenAt: number;
  disconnectedAt?: number;
};
```

`url` 来自页面当前地址。`appName` 可以由框架配置带上，`runtimeVersion` 由 SDK 自动带上。

同一个 URL 可能有多个 Runtime 连接，例如同一个页面开了多个 tab、页面刷新时新旧连接短暂共存、或者 Agent 和人同时打开了同一个 URL。因此 Bridge 必须用 `runtimeId` 区分连接实例。

### Bridge 开启方式

Bridge 连接需要三层控制：

```txt
构建期注入：决定页面代码里有没有 bridge client
运行期配置：决定这次页面要不要连接 bridge
Bridge 鉴权：决定连上来的页面能不能被接受
```

Modern.js 可以提供这样的配置：

```ts
export default defineConfig({
  openRuntime: {
    enabled: true,
    bridge: {
      enabled: 'dev',
    },
  },
});
```

`bridge.enabled` 的第一版类型可以是：

```ts
type BridgeEnabled = boolean | 'dev' | 'manual';
```

含义：

| 值 | 含义 |
| --- | --- |
| `true` | 总是尝试连接 Bridge |
| `false` | 不连接 Bridge |
| `'dev'` | 仅 dev 环境自动连接 |
| `'manual'` | 注入 bridge client，但只有 query、localStorage 或服务端配置显式打开时才连接 |

推荐默认策略：

| 场景 | 策略 |
| --- | --- |
| 本地 dev | `bridge.enabled = 'dev'` |
| staging / oncall | `bridge.enabled = 'manual'` |
| production | `bridge.enabled = false` |

Bridge Server 还需要校验 origin、app name 和 runtime version。页面允许连接不代表 Bridge 一定接受。token 鉴权后续再扩展，第一版不放进 `connectBridge` 参数。

页面侧连接 Bridge 的第一版 API：

```ts
runtime.connectBridge(options?: BridgeConnectOptions);

type BridgeConnectOptions = {
  port?: number;
  autoReconnect?: boolean;
};
```

第一版不提供 `bridgeUrl`、`token`、`name` 或 `disconnectBridge()`。`host` 固定为 `localhost`，`port` 默认可以是 `17321`。prefix、host 和鉴权能力后续再扩展。

`autoReconnect` 默认是 `true`。连接断开后自动尝试重连，退避间隔为：

```txt
1s -> 2s -> 4s -> 8s -> 10s -> 10s ...
```

页面卸载时停止重连。页面关闭、刷新或连接断开后，Bridge 能通过连接断开事件感知到这个 Runtime 已断开，并把它标记为 `disconnected`。Bridge 可以保留最后一次 snapshot 和 events 一小段时间，例如 60s，之后再清理。页面重新连接时分配新的 `runtimeId`，不复用旧连接的 `runtimeId`。

### 构建插件

通用 Rspack / Webpack 构建插件应该和 HTTP Bridge 一起提供基础版本，但它不是 Modern.js 用户的主入口。

更合理的定位是：

```txt
@open-runtime/core
Modern.js 内置接入
通用 Rspack / Webpack 构建插件
```

Modern.js 用户不应该手动配置 `OpenRuntimeWebpackPlugin` 或 `OpenRuntimeRspackPlugin`。Modern.js 只暴露框架配置，内部复用通用注入逻辑。

通用构建插件主要服务两个场景：

- 非 Modern.js 项目接入 OpenRuntime；
- Modern.js 内部复用同一套初始化和 bridge client 注入逻辑。

### CLI

CLI 主要配合 HTTP Bridge 使用。

没有 HTTP Bridge 时，CLI 只能做辅助能力：

- 启动 Bridge；
- 检查 Bridge 状态；
- 打印接入配置；
- 打开页面；
- 读取项目里的静态配置。

它不能稳定完成核心运行态能力：

- 读取页面 runtime 状态；
- 获取 actions；
- 执行 action；
- 等待 ready；
- 读取 runtime events。

因此第一版 CLI 的定位是：

```txt
CLI = Bridge Server 管理器 + Bridge HTTP API 客户端 + 接入辅助工具
```

CLI 可以提供：

```bash
open-runtime bridge start --port 17321
open-runtime bridge status
open-runtime runtimes
open-runtime targets [runtime selector] [query options]
open-runtime snapshot [runtime selector] [query options]
open-runtime events [runtime selector] [query options]
open-runtime actions [runtime selector] [query options]
open-runtime input-options [runtime selector] --action <action-name> --input <input-name>
open-runtime run-action [runtime selector] <action-name>
open-runtime wait-for [runtime selector] <target-id> <status>
```

这里的 runtime selector 用于选择 Bridge 里已经连接的页面 Runtime 实例：

```bash
--url <url>
--runtime <runtime-id>
```

`--url` 是日常主入口。CLI 会用它匹配 Bridge 当前连接的 Runtime URL；如果同一个 URL 匹配到多个 Runtime，默认选择 `lastSeenAt` 最新的。`--runtime` 是精确兜底参数，值来自：

```bash
open-runtime runtimes
```

如果没有传 `--url` 或 `--runtime`，CLI 默认使用最新活跃的 Runtime，并在输出中显示本次选中的 url 和 runtime id。如果 Bridge 当前没有连接 Runtime，则命令失败。如果需要避免误选，可以显式传 `--url` 或 `--runtime`。

CLI 命令和 Runtime API 的对应关系：

| CLI | 参数 | 对应 API |
| --- | --- | --- |
| `open-runtime runtimes` | 无 | Bridge 的 runtime 列表，不对应页面 Runtime API |
| `open-runtime targets` | `--type`、`--source`、`--id`、`--status`、`--query` | `getTargets(query)` |
| `open-runtime snapshot` | `--id`、`--type`、`--source`、`--status`、`--query` | `getSnapshot(query)` |
| `open-runtime events` | `--since`、`--target-id`、`--action`、`--type`、`--source`、`--status`、`--limit` | `getEvents(query)` |
| `open-runtime actions` | `--name`、`--source`、`--risk`、`--enabled`、`--query` | `getActions(query)` |
| `open-runtime input-options` | `--action`、`--input`、`--payload`、`--timeout` | `getInputOptions(actionName, inputName, currentPayload)` |
| `open-runtime run-action` | `<action-name>`、`--payload` | `runAction(actionName, payload)` |
| `open-runtime wait-for` | `<target-id>`、`<status>`、`--timeout` | `waitFor({ id, status }, { timeout })` |

示例：

```bash
open-runtime targets --url http://localhost:8080/route-a --type route

open-runtime snapshot --url http://localhost:8080/route-a --id route:/route-a

open-runtime events --url http://localhost:8080/route-a \
  --since 42 \
  --target-id route:/route-a \
  --limit 100

open-runtime actions --url http://localhost:8080/route-a \
  --enabled true \
  --risk safe

open-runtime input-options --url http://localhost:8080/route-a \
  --action selectRegion \
  --input city \
  --payload '{"province":"zhejiang"}' \
  --timeout 5000

open-runtime run-action --url http://localhost:8080/route-a selectRegion \
  --payload '{"province":"zhejiang","city":"hangzhou"}'

open-runtime wait-for --url http://localhost:8080/route-a route:/route-a ready \
  --timeout 10000
```

### Agent 使用方式

Agent 真正知道如何使用 OpenRuntime，主要依赖 Skill 或平台工具说明。

推荐链路：

```txt
Agent Skill
  ↓
CLI 或 HTTP API
  ↓
HTTP Bridge
  ↓
页面 OpenRuntime
```

Skill 负责告诉 Agent：

- 优先检查是否存在 OpenRuntime；
- 如何连接 Bridge；
- 如何读取 snapshot、events 和 actions；
- 如何执行 action；
- 如何等待目标状态；
- 如何用结果验证问题；
- 没有 OpenRuntime 时再 fallback 到 UI、console、network。

这部分的职责边界是：

```txt
OpenRuntime SDK：页面提供能力
Window API：页面内最小出口
HTTP Bridge：页面外访问通道
CLI：Bridge 的命令行客户端和辅助工具
Skill：教 Agent 在任务里使用这些能力
```

## 核心设计

### 页面级 Runtime Center

一个页面内应该有一个主 Runtime Center，负责聚合：

- 当前 snapshot；
- 历史 events；
- ready 状态；
- blockers；
- actions；
- errors。

不建议第一期做多个 Runtime Center 的自动合并。多中心会带来 snapshot 合并、事件排序、action 冲突、ready 归并等复杂问题。

### 多来源 Runtime Client

写入方可以有多个：

- Modern.js Runtime Client；
- MF Runtime Client；
- Garfish Runtime Client；
- 业务 Runtime Client；
- 其他框架或自定义 runtime 的 Runtime Client。

这些 client 可以来自不同包、不同版本，但最终写入同一个页面级 Runtime Center。

### Snapshot 和 Events 的边界

`snapshot` 只表示当前状态，不保存完整历史。

例如页面从 `/` 跳转到 `/home` 后，再调用 `getSnapshot()`，应该看到 `/home` 的当前状态。旧的 `/` pending 状态不应该继续留在 snapshot 主体里。

历史过程通过 `getEvents()` 查询。

简单说：

```txt
snapshot = 现在是什么状态
events = 之前发生过什么
```

因此第一版不建议把 Event History 合进 Snapshot。

Snapshot 是 Agent 的默认入口，用来快速判断当前页面是否 ready、是否 blocked、是否 error，以及当前有哪些可执行 action。它应该尽量干净，只保留当前仍然有效的状态，避免把已经过去的 route、loader、action 或 error 混入当前结论。

Event History 是辅助入口，用来解释 Snapshot 背后的过程。它的价值不是让 Agent 多看一份日志，而是支持这些场景：

- 等待变化：用 event 替代固定 sleep，例如等待 route ready、loader success、component ready 或 action error；
- 解释原因：当 Snapshot 显示 blocked 或 error 时，通过相关 events 判断是 route、loader、remote、component、action 还是业务 ready 卡住；
- 提供证据：Agent 输出结论时，可以引用关键 events 说明“执行了什么动作、随后发生了什么、最终停在哪个状态”；
- 增量读取：Snapshot 带 `latestEventId`，Agent 下一次只读取这个 id 之后的新 events，避免重复扫描完整历史。

Agent 推荐读取顺序：

```txt
先读 snapshot
  ↓
如果 ready，直接用 snapshot 作为结论证据
  ↓
如果 blocked / error / pending，再围绕 blocker 或目标 id 读取相关 events
  ↓
如需操作，读取 actions 并执行声明过的 action
  ↓
执行后等待目标状态，再读取新的 snapshot 和增量 events
```

为了控制噪音，Event History 第一版只记录关键运行态变化，例如 action start / success / error、route change、loader start / success / redirect / error、remote / expose / shared 状态变化、component ready / error、business ready / blocked。它不应该默认收集完整 console、network、DOM mutation 或所有内部调试日志。

`waitFor` 超时或失败时，可以返回当前 blockers 和少量相关 events 摘要，但不应该把完整 Event History 直接塞进 Snapshot。

## 内部数据结构

OpenRuntime 内部先收敛为四类核心数据：

```txt
Target Registry
Snapshot
Event Log
Action Registry
```

其中 Target Registry 保存页面里可以被 Agent 引用或等待的目标，Snapshot 用 target id 映射表达页面当前状态，Event Log 记录状态变化过程，Action Registry 保存页面声明给 Agent 的可调用能力。

### Snapshot

Snapshot 表示页面当前仍然有效的运行态，不保存完整历史。

```ts
type RuntimeSnapshot = {
  targets: Record<string, RuntimeSnapshotTarget>;
  latestEventId: number;
  capturedAt: number;
};
```

第一版复用同一套对象类型和状态类型：

```ts
type RuntimeObjectType =
  | 'app'
  | 'route'
  | 'loader'
  | 'component'
  | 'form'
  | 'field'
  | 'remote'
  | 'expose'
  | 'shared'
  | 'sub-app'
  | 'business'
  | 'custom';

type RuntimeStatus =
  | 'idle'
  | 'loading'
  | 'pending'
  | 'success'
  | 'ready'
  | 'blocked'
  | 'error'
  | 'inactive';
```

`targets` 表示当前页面里仍然有效的运行时对象，key 是 target id。`updateSnapshot` 按 `id` upsert 当前 target，不追加历史状态。

```ts
type RuntimeSnapshotTarget = {
  id: string;
  type: RuntimeObjectType;
  status: RuntimeStatus;
  source?: string;
  description?: string;
  data?: unknown;
  error?: RuntimeError;
  updatedAt: number;

  dependsOn?: string[];
  contains?: string[];
  loads?: string[];
  renders?: string[];
  provides?: string[];
  shares?: string[];
  customRelations?: RuntimeInlineRelation[];
};
```

`type` 表示对象是什么，例如 route、loader、remote、业务 ready。`status` 表示它当前处于什么状态。

常见关系直接作为 target 上的字段表达，方向统一是“当前 target 指向相关 target”：

| type | 含义 |
| --- | --- |
| `contains` | 当前 target 包含哪些 target，例如 app contains route |
| `dependsOn` | 当前 target 依赖哪些 target，例如 route dependsOn loader |
| `loads` | 当前 target 加载哪些 target，例如 route loads MF remote |
| `renders` | 当前 target 渲染哪些 target，例如 expose renders component |
| `provides` | 当前 target 提供哪些 target，例如 remote provides expose |
| `shares` | 当前 target 共享或使用哪些 target，例如 MF shares react |
| `customRelations` | 业务自定义关系 |

`loads` 的方向是当前 target 加载了谁，不是当前 target 被谁加载。例如 `route:/home` 的 `loads: ['remote:cloudConsoleProvider']` 表示 `/home` 路由加载了这个 remote。

业务自定义关系放到 `customRelations`，例如：

```ts
type RuntimeInlineRelation = {
  type: 'custom';
  relation: string;
  to: string;
  description?: string;
  data?: unknown;
};
```

不建议第一版直接允许任意 string relation type。稳定的内置关系字段更利于 Agent 推理，业务扩展通过 `customRelations` 表达。

### Target Registry

Target Registry 表示页面里有哪些对象可以被 Agent 引用或等待。它回答的是“有什么可以等”，不是“现在是什么状态”。当前状态仍然由 Snapshot 表达。

写入方通过 `registerTarget` 提前注册 target：

```ts
type RegisterTargetInput = {
  id: string;
  type: RuntimeObjectType;
  source: string;
  label?: string;
  description?: string;
  statuses?: RuntimeStatus[];
  params?: RuntimeTargetParam[];
  matcher?: RuntimeTargetMatcher;
  data?: unknown;
};

type RuntimeTargetParam = {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  description?: string;
};

type RuntimeTargetMatcher = {
  type: 'exact' | 'path-pattern' | 'custom';
  pattern?: string;
};
```

必填字段只有 `id`、`type` 和 `source`。如果没有传 `statuses`，Runtime Center 按 `type` 自动补默认值。

第一版默认状态表：

| type | 默认 statuses |
| --- | --- |
| `app` | `loading` / `ready` / `blocked` / `error` / `inactive` |
| `route` | `loading` / `ready` / `blocked` / `error` / `inactive` |
| `component` | `loading` / `ready` / `blocked` / `error` / `inactive` |
| `sub-app` | `idle` / `loading` / `ready` / `blocked` / `error` / `inactive` |
| `business` | `pending` / `ready` / `blocked` / `error` / `inactive` |
| `loader` | `idle` / `loading` / `pending` / `success` / `blocked` / `error` / `inactive` |
| `remote` | `idle` / `loading` / `success` / `blocked` / `error` / `inactive` |
| `expose` | `idle` / `loading` / `success` / `blocked` / `error` / `inactive` |
| `shared` | `idle` / `success` / `blocked` / `error` / `inactive` |
| `form` | `idle` / `pending` / `success` / `blocked` / `error` / `inactive` |
| `field` | `idle` / `pending` / `success` / `blocked` / `error` / `inactive` |
| `custom` | 默认允许全部 `RuntimeStatus`，接入方建议显式传 `statuses` |

`ready` 只推荐用于能表达“现在可以继续使用”的对象，例如 `app`、`route`、`component`、`sub-app` 和 `business`。`loader`、`remote`、`expose`、`shared` 这类过程或依赖对象应该使用 `success` 表示完成，不建议注册 `ready`。

例如 Modern.js 在路由表生成后，可以提前注册动态路由 target：

```ts
runtime.registerTarget({
  id: 'route-pattern:/users/:id',
  type: 'route',
  source: 'modern-js',
  label: '/users/:id',
  params: [{ name: 'id', type: 'string', required: true }],
  matcher: {
    type: 'path-pattern',
    pattern: '/users/:id',
  },
});
```

当页面实际进入 `/users/123` 后，再通过 `updateSnapshot` 更新当前状态：

```ts
runtime.updateSnapshot({
  id: 'route:/users/123',
  type: 'route',
  source: 'modern-js',
  status: 'ready',
  data: {
    matchedTarget: 'route-pattern:/users/:id',
    params: { id: '123' },
  },
});
```

`unregisterTarget(targetId)` 用于目标不再可被引用或等待的场景，例如动态卸载的子应用、销毁的业务区域或失效的自定义 target。框架静态路由、固定 remote、固定 shared 这类稳定 target 通常不需要注销，只需要通过 Snapshot 更新为 `inactive`、`blocked` 或 `error`。

如果 `updateSnapshot` 更新了一个未注册过的 id，Runtime Center 可以临时创建 inferred target，避免状态丢失；但开发环境应该给出 warning，提醒框架或业务在更早时机注册。

### Event Log

Event 记录 Snapshot 的变化过程。

```ts
type RuntimeEvent = {
  id: number;
  type: string;
  source: string;
  timestamp: number;
  targetId?: string;
  actionName?: string;
  status?: RuntimeStatus;
  relation?: RuntimeRelationEvent;
  data?: unknown;
  error?: RuntimeError;
};

type RuntimeRelationEvent =
  | RuntimeBuiltInRelationEvent
  | RuntimeCustomRelationEvent;

type RuntimeBuiltInRelationEvent = {
  from: string;
  to: string;
  field:
    | 'dependsOn'
    | 'contains'
    | 'loads'
    | 'renders'
    | 'provides'
    | 'shares';
};

type RuntimeCustomRelationEvent = {
  from: string;
  type: 'custom';
  relation: string;
  to: string;
  description?: string;
  data?: unknown;
};
```

例如状态变化：

```ts
{
  id: 12,
  type: 'snapshot.updated',
  source: 'modern-js',
  targetId: 'loader:home',
  status: 'success',
}
```

例如关系变化：

```ts
{
  id: 18,
  type: 'relation.updated',
  source: 'module-federation',
  relation: {
    from: 'route:/home',
    to: 'remote:cloudConsoleProvider',
    field: 'loads',
  },
}
```

### Action Registry

Action 是页面声明给 Agent 的可调用能力。Agent 不应该随便操作 DOM，而是调用页面声明过的 action。

第一版 action 先采用纯 action 声明，不做 DOM 自动识别、UI steps 或通用表单自动填写。

```ts
type RegisterActionInput = {
  name: string;
  description?: string;
  source?: string;
  risk?: RuntimeActionRisk;
  availableWhen?: RuntimeCondition | RuntimeCondition[];
  inputSchema?: RuntimeJsonSchema;
  getInputOptions?: RuntimeInputOptionsProvider;
  handler: RuntimeActionHandler;
};

type RuntimeActionRisk =
  | 'safe'
  | 'state-changing'
  | 'destructive'
  | 'sensitive';
```

`name` 和 `handler` 是核心。`name` 是 Agent 调用 action 时使用的公开名称，例如 `route-a.click-submit`。Runtime 内部如需稳定 id，可以自己生成，不要求使用方传入。

`source` 不是必填字段。Runtime Client 可以自动补默认 source，例如业务侧默认 `business`，Modern.js / MF / Garfish adapter 使用自己的 source。

`description` 用于解释 action 的用途，不再额外提供 `label`。`risk` 用于表达动作风险，默认值是 `state-changing`，不能默认当成 `safe`。`safe` 只用于确认不会改变持久状态或敏感状态的动作。

`availableWhen` 表示 action 什么时候可以执行。第一版不单独提供 `blockedBy`，因为它和 `availableWhen` 容易重复。`getActions()` 返回给 Agent 时，可以根据 `availableWhen` 和当前 Snapshot 计算 `enabled` 和 `reason`。

`inputSchema` 描述 action 的输入结构。第一版使用可序列化的 JSON Schema 子集，不直接依赖 zod。业务如果希望用 zod，可以通过 helper 转成 JSON Schema 后注册。

```ts
type RuntimeJsonSchema = {
  type: 'object';
  properties?: Record<string, RuntimeJsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
};

type RuntimeJsonSchemaProperty = {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: Array<string | number | boolean>;
  items?: RuntimeJsonSchemaProperty;
  properties?: Record<string, RuntimeJsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
};
```

`getInputOptions` 是注册在 action 上的动态选项 provider，用于普通 select、checkbox group、省市区级联、权限相关选项等场景。它和 Agent 读取侧的 `runtime.getInputOptions(actionName, inputName, currentPayload?)` 不是同一个类型；读取侧 API 会先通过 `actionName` 找到 action，再调用这里注册的 provider。

```ts
type RuntimeInputOptionsProvider = (
  inputName: string,
  currentPayload?: Record<string, unknown>,
  context?: RuntimeActionContext,
) => Promise<RuntimeInputOption[]> | RuntimeInputOption[];

type RuntimeInputOption = {
  value: string | number | boolean;
  description?: string;
};
```

`value` 是真正传给 action 的值。`description` 是给 Agent 或人看的解释。第一版不提供 `label`、`disabled` 或 `reason`。业务侧只返回当前可用选项，CLI 可以用 `String(value)` 作为短展示。

`availableWhen` 使用 `RuntimeCondition` 表达执行前置条件：

```ts
type RuntimeCondition = {
  id: string;
  status: RuntimeStatus;
};
```

`handler` 只在页面内执行，不暴露给 Agent。第一版不要求 handler 返回明确结果；正常执行完成即视为 action success，throw 则记录 action error。`runAction` 只等待 handler 执行完成，不自动更新 Snapshot，也不自动等待 Snapshot 状态变化。业务状态变化必须由 handler 或对应框架 / adapter 调用 `updateSnapshot`。Agent 如果需要确认后置状态，应显式继续调用 `waitFor`。

```ts
type RuntimeActionHandler = (
  payload: unknown,
  context: RuntimeActionContext,
) => Promise<unknown> | unknown;

type RuntimeActionContext = {
  actionName: string;
  getSnapshot: () => RuntimeSnapshot;
  updateSnapshot: (input: UpdateSnapshotInput) => void;
  waitFor: (
    condition: RuntimeCondition,
    options?: RuntimeWaitOptions,
  ) => Promise<RuntimeWaitResult>;
};

type RuntimeWaitOptions = {
  timeout?: number;
};

type RuntimeWaitResult = {
  success: boolean;
  condition: RuntimeCondition;
  snapshot: RuntimeSnapshot;
  target?: RuntimeSnapshotTarget;
  reason?: string;
};
```

示例：

```ts
registerAction({
  name: 'selectRegion',
  description: 'Select province, city and street.',
  risk: 'state-changing',
  availableWhen: {
    id: 'business:region-form',
    status: 'ready',
  },
  inputSchema: {
    type: 'object',
    properties: {
      province: { type: 'string', description: 'Province value.' },
      city: { type: 'string', description: 'City value.' },
      street: { type: 'string', description: 'Street value.' },
    },
    required: ['province', 'city', 'street'],
    additionalProperties: false,
  },
  getInputOptions: async (inputName, payload) => {
    if (inputName === 'province') {
      return getProvinces();
    }
    if (inputName === 'city') {
      return getCities(payload?.province);
    }
    if (inputName === 'street') {
      return getStreets(payload?.city);
    }
    return [];
  },
  handler: async (payload, ctx) => {
    await selectRegion(payload);
    ctx.updateSnapshot({
      id: 'business:region-selection',
      type: 'business',
      status: 'ready',
    });
  },
});
```

### 第一版公开 API

公开 API 分成写入侧和 Agent 读取 / 执行侧。

写入侧只保留少量 API：

```ts
runtime.registerTarget(target);
runtime.unregisterTarget(targetId);
runtime.updateSnapshot(input);
runtime.registerAction(action);
runtime.unregisterAction(actionName);
runtime.runAction(actionName, payload?);
```

其中：

- `registerTarget` 提前注册页面里可以被 Agent 引用或等待的目标；
- `unregisterTarget` 注销不再可引用或等待的目标；
- `updateSnapshot` 更新当前页面状态；
- `registerAction` 注册页面声明给 Agent 的可调用能力；
- `unregisterAction` 通过 action `name` 注销 action；
- `runAction` 执行 action，既可以给 Agent 用，也可以给本地自测用。

Action 对外统一使用 `name` 作为稳定标识。`runAction(actionName)`、`getInputOptions(actionName, inputName, currentPayload?)` 和 `unregisterAction(actionName)` 都使用同一个 action `name`。如果 Runtime 内部需要生成 id，只作为内部实现细节，不暴露给使用方或 Agent。

`runAction` 的第一版形态保持简单：

```ts
runAction(actionName: string, payload?: Record<string, unknown>);
```

`payload` 必须符合 action 注册时的 `inputSchema`。如果 `payload` 不符合 `inputSchema`，或者 `availableWhen` 不满足，Runtime 直接返回失败，不调用 handler。

`runAction` 不会自动更新 Snapshot。它只会自动记录 `action.started`、`action.success` 或 `action.error`。如果 action 执行后业务状态发生变化，需要 handler 调用 `ctx.updateSnapshot(...)`，或者由框架 / adapter 自动捕获并调用 `updateSnapshot`。

`runAction` 不提供 `expect` 或 `waitForExpect`。如果 Agent 要验证执行后的页面状态，应拆成两步：

```ts
await runtime.runAction('selectRegion', {
  province: 'zhejiang',
  city: 'hangzhou',
  street: 'xihu',
});

await runtime.waitFor({
  id: 'business:region-selection',
  status: 'ready',
});
```

公开 API 不提供 `emit`。事件由 Runtime Center 自动记录：

- 调用 `updateSnapshot` 后自动记录 snapshot 变更事件；
- 调用 `registerTarget` 后自动记录 `target.registered`；
- 调用 `unregisterTarget` 后自动记录 `target.unregistered`；
- 调用 `registerAction` 后自动记录 `action.registered`；
- 调用 `unregisterAction` 后自动记录 `action.unregistered`；
- 调用 `runAction` 后自动记录 `action.started`、`action.success` 或 `action.error`。

这样使用方不需要同时维护 snapshot 和 events，避免双写不一致。

`registerTarget` 的第一版形态：

```ts
type RegisterTargetInput = {
  id: string;
  type: RuntimeObjectType;
  source: string;
  label?: string;
  description?: string;
  statuses?: RuntimeStatus[];
  params?: RuntimeTargetParam[];
  matcher?: RuntimeTargetMatcher;
  data?: unknown;
};
```

`id`、`type` 和 `source` 是必填字段。`statuses` 不传时，Runtime Center 根据 `type` 使用默认状态表补齐。

`updateSnapshot` 的第一版形态：

```ts
type UpdateSnapshotInput = {
  id: string;
  status: RuntimeStatus;
  type?: RuntimeObjectType;
  source?: string;
  description?: string;
  data?: unknown;
  error?: RuntimeError;
  dependsOn?: string[];
  contains?: string[];
  loads?: string[];
  renders?: string[];
  provides?: string[];
  shares?: string[];
  customRelations?: RuntimeInlineRelation[];
};
```

内置关系直接写在 `updateSnapshot` 顶层，例如 `dependsOn`、`loads`、`provides`。业务自定义关系写到 `customRelations`。

必填字段只有 `id` 和 `status`。`type` 默认是 `business`，`source` 默认是 `business`。因此业务用户可以直接写：

```ts
runtime.updateSnapshot({
  id: 'user-profile',
  status: 'ready',
});
```

框架和 MF 这类接入方建议显式传 `type` 和 `source`：

```ts
runtime.updateSnapshot({
  id: 'route:/home',
  type: 'route',
  source: 'modern-js',
  status: 'ready',
});
```

`updateSnapshot` 必须符合 target 声明的状态范围：

- `updateSnapshot` 按 `id` upsert `snapshot.targets[id]`。同一个 `id` 再次更新时只替换当前状态和相关字段，不追加历史 item；历史变化由 events 记录；
- 如果 `id` 已经通过 `registerTarget` 注册，`status` 必须在该 target 的 `statuses` 中；
- 如果 `id` 还没有注册，Runtime Center 可以临时创建 inferred target，并使用 `type` 对应的默认 statuses 校验；
- 如果 `status` 不在允许范围内，本次更新被拒绝，Snapshot 不变；
- 被拒绝的更新需要记录 `snapshot.update.rejected` event，说明 `id`、`type`、`status` 和拒绝原因；
- 开发环境可以额外输出 console warning；
- 第一版不引入 strict mode，也不因为校验失败 throw，避免影响页面正常运行。

例如 `remote` 默认不支持 `ready`。下面的更新应该被拒绝：

```ts
runtime.updateSnapshot({
  id: 'remote:cloudConsoleProvider',
  type: 'remote',
  source: 'module-federation',
  status: 'ready',
});
```

正确写法是：

```ts
runtime.updateSnapshot({
  id: 'remote:cloudConsoleProvider',
  type: 'remote',
  source: 'module-federation',
  status: 'success',
});
```

`getSnapshot` 返回当前状态，使用 `targets` 对象表达当前 target 状态和关系：

```ts
type RuntimeSnapshot = {
  targets: Record<string, RuntimeSnapshotTarget>;
  latestEventId: number;
  capturedAt: number;
};
```

其中：

```ts
type RuntimeSnapshotTarget = {
  id: string;
  type: RuntimeObjectType;
  status: RuntimeStatus;
  source?: string;
  description?: string;
  data?: unknown;
  error?: RuntimeError;
  updatedAt: number;

  dependsOn?: string[];
  contains?: string[];
  loads?: string[];
  renders?: string[];
  provides?: string[];
  shares?: string[];
  customRelations?: RuntimeInlineRelation[];
};
```

`getSnapshot` 的第一版形态：

```ts
type GetSnapshotQuery = {
  id?: string | string[];
  type?: RuntimeObjectType | RuntimeObjectType[];
  source?: string | string[];
  status?: RuntimeStatus | RuntimeStatus[];
  query?: string;
};

getSnapshot(query?: GetSnapshotQuery): RuntimeSnapshot;
```

不传参数时，`getSnapshot()` 返回当前页面完整 Snapshot。传入 `query` 时，只过滤当前 Snapshot 里已经存在的 target。

如果某个 target 只是通过 `registerTarget` 声明过，但还没有任何当前状态，它不会出现在 `snapshot.targets` 里。要发现“有哪些 target 可以被引用或等待”，应该使用 `getTargets()`。

`GetSnapshotQuery.query` 是轻量文本查询，第一版只匹配 target 的 `id` 和 `description`，不匹配 `data`，避免把业务数据纳入搜索。

`latestEventId` 表示这份 Snapshot 截止到哪个 event，方便 Agent 后续通过 `getEvents({ since: latestEventId })` 读取增量事件。`capturedAt` 表示这份 Snapshot 生成的时间，Bridge 返回断开页面的最后状态时也可以让 Agent 判断这份状态是否过期。

Agent 读取 / 执行侧 API：

```ts
getTargets(query?);
getSnapshot(query?);
getEvents(query?);
getActions();
getInputOptions(actionName, inputName, currentPayload?);
runAction(actionName, payload?);
waitFor(condition, options?);
```

其中：

- `getTargets` 读取页面声明过、可以被 Agent 引用或等待的目标；
- `getSnapshot` 读取当前状态，可以按 query 过滤；
- `getEvents` 读取历史变化；
- `getActions` 读取页面声明过的动作；
- `getInputOptions` 读取动态参数选项；
- `runAction` 执行动作；
- `waitFor` 等待目标状态。

`getTargets` 的第一版形态：

```ts
type GetTargetsQuery = {
  type?: RuntimeObjectType | RuntimeObjectType[];
  source?: string | string[];
  id?: string | string[];
  status?: RuntimeStatus | RuntimeStatus[];
  query?: string;
};

type RuntimeTargetDescriptor = {
  id: string;
  type: RuntimeObjectType;
  source: string;
  label?: string;
  description?: string;
  statuses: RuntimeStatus[];
  params?: RuntimeTargetParam[];
  matcher?: RuntimeTargetMatcher;
  data?: unknown;
  inferred?: boolean;
  registeredAt: number;
  updatedAt: number;
};
```

`getTargets(query?)` 返回的是 Target Registry 里的可发现目标，不是当前状态。它告诉 Agent “有哪些 target 可以被引用或等待”。当前状态仍然通过 `getSnapshot(query?)` 或 `waitFor()` 判断。

`GetTargetsQuery` 是可序列化查询条件，不是 JS 函数。这样 CLI、HTTP Bridge 和 Agent 都可以稳定传参，例如：

```bash
open-runtime targets --type route --query users
```

对应：

```ts
runtime.getTargets({ type: 'route', query: 'users' });
```

`query` 字段是轻量文本查询，第一版只匹配 target 的 `id`、`label` 和 `description`：

- 大小写不敏感；
- 使用 `includes` 匹配；
- 不做正则、分词、拼音或模糊评分；
- 不匹配 `data`，避免把业务数据也纳入搜索。

`getEvents` 的第一版形态：

```ts
type GetEventsQuery = {
  since?: number;
  targetId?: string | string[];
  actionName?: string | string[];
  type?: string | string[];
  source?: string | string[];
  status?: RuntimeStatus | RuntimeStatus[];
  limit?: number;
};

type GetEventsResult = {
  events: RuntimeEvent[];
  latestEventId: number;
  truncated: boolean;
};

getEvents(query?: GetEventsQuery): GetEventsResult;
```

`since` 表示只读取 `id > since` 的事件。`targetId` 会匹配普通事件里的 `targetId`，也会匹配关系事件里的 `from` 和 `to`。

默认按事件发生顺序返回。如果没有传 `since`，默认只取最近一批事件，第一版默认 `limit` 可以是 100，避免 Agent 一次拿到太多历史。`truncated: true` 表示结果被截断，Agent 应该缩小查询条件或继续增量读取。

`latestEventId` 表示当前 Event Log 最新 event id。即使本次查询没有返回事件，也可以用它作为下一次增量读取的起点。

`getEvents` 不做全文搜索，也不匹配 `data`。它只用于读取关键运行态变化，避免把业务数据、调试日志或底层噪音混进 Agent 默认上下文。

示例：

```ts
const snapshot = await runtime.getSnapshot();

await runtime.runAction('selectRegion', {
  province: 'zhejiang',
  city: 'hangzhou',
  street: 'xihu',
});

await runtime.waitFor({
  id: 'business:region-selection',
  status: 'ready',
});

const result = await runtime.getEvents({
  since: snapshot.latestEventId,
  targetId: 'business:region-selection',
});
```

`getActions` 的第一版形态：

```ts
type GetActionsQuery = {
  name?: string | string[];
  source?: string | string[];
  risk?: RuntimeActionRisk | RuntimeActionRisk[];
  enabled?: boolean;
  query?: string;
};

type RuntimeActionDescriptor = {
  name: string;
  description?: string;
  source: string;
  risk: RuntimeActionRisk;
  availableWhen?: RuntimeCondition | RuntimeCondition[];
  inputSchema?: RuntimeJsonSchema;
  hasInputOptions: boolean;
  enabled: boolean;
  reason?: string;
  registeredAt: number;
  updatedAt: number;
};

getActions(query?: GetActionsQuery): RuntimeActionDescriptor[];
```

`getActions` 返回给 Agent 的是 action 描述，不包含 `handler`，也不包含 `getInputOptions` 函数。Agent 如果需要读取动态选项，应继续调用 `getInputOptions(actionName, inputName, currentPayload?)`。

`risk` 没有显式注册时返回默认值 `state-changing`。`source` 没有显式注册时返回 Runtime Client 补齐后的默认 source。

`enabled` 根据当前 Snapshot 和 `availableWhen` 计算。`reason` 只在 `enabled: false` 时返回，用于说明为什么当前不能执行。

`GetActionsQuery.query` 第一版只匹配 action 的 `name` 和 `description`，不匹配业务数据。

示例：

```ts
const actions = await runtime.getActions({
  enabled: true,
  risk: 'safe',
});
```

返回示例：

```ts
[
  {
    name: 'retryOrderDetail',
    description: 'Retry order detail request.',
    source: 'business',
    risk: 'safe',
    hasInputOptions: false,
    enabled: true,
    registeredAt: 1710000000000,
    updatedAt: 1710000000000,
  },
];
```

`getInputOptions` 的第一版形态：

```ts
getInputOptions(
  actionName: string,
  inputName: string,
  currentPayload?: Record<string, unknown>,
): Promise<RuntimeInputOption[]> | RuntimeInputOption[];
```

`actionName` 是 action 的 `name`。`inputName` 是 `inputSchema.properties` 里的字段名。`currentPayload` 表示 Agent 当前已经填好的参数，主要用于级联选项，例如先选 province，再读取 city。

如果 action 没有注册 `getInputOptions`，返回空数组。如果 `inputName` 不在 `inputSchema.properties` 里，也返回空数组，并可以记录 warning 或 rejected event。

`getInputOptions` 只返回当前可用选项，不返回不可选项，也不返回禁用原因。业务侧负责决定哪些选项当前可用。

`getInputOptions` 支持异步 provider。HTTP Bridge 和 CLI 调用时必须等待 provider 完成后再返回最终 options。CLI 默认可以给这次等待设置 5s 超时；超时后返回失败，不返回半成品。CLI 可以通过 `--timeout` 覆盖这次等待时间。

示例：

```ts
const cities = await runtime.getInputOptions(
  'selectRegion',
  'city',
  { province: 'zhejiang' },
);
```

返回示例：

```ts
[
  {
    value: 'hangzhou',
    description: 'Hangzhou city.',
  },
  {
    value: 'ningbo',
    description: 'Ningbo city.',
  },
];
```

`waitFor` 的第一版形态：

```ts
waitFor(
  condition: RuntimeCondition,
  options?: RuntimeWaitOptions,
): Promise<RuntimeWaitResult>;

type RuntimeWaitOptions = {
  timeout?: number;
};

type RuntimeWaitResult = {
  success: boolean;
  condition: RuntimeCondition;
  snapshot: RuntimeSnapshot;
  target?: RuntimeSnapshotTarget;
  reason?: string;
};
```

`waitFor` 只等待某个 target 到达某个状态，不返回 events，也不解释完整过程。Agent 如果需要失败原因，应在 `waitFor` 失败后继续调用 `getEvents`。

实现规则：

- 调用时先检查当前 Snapshot。如果 `snapshot.targets[id]?.status === status`，立即返回成功；
- 如果 target 当前不在 Snapshot，但已经存在于 Target Registry，说明它只是还没进入当前状态，可以继续等待；
- 如果 target 在 Snapshot 和 Target Registry 里都不存在，直接返回失败，避免 target id 写错后一直等到超时；
- Runtime Center 维护等待任务列表，每个任务记录 `id`、`status`、`timeout` 和对应的 resolve；
- 每次 `updateSnapshot` 后，只检查等待这个 target 的任务；状态匹配时返回成功；
- 超时不 throw，返回 `success: false`，并带上当前 Snapshot 和失败原因；
- 如果 target 被 `unregisterTarget` 注销，相关等待任务直接返回失败。

示例：

```ts
const result = await runtime.waitFor(
  { id: 'route:/route-a', status: 'ready' },
  { timeout: 10000 },
);

if (!result.success) {
  const events = await runtime.getEvents({
    targetId: 'route:/route-a',
  });
}
```

第一版不做：

- DOM 自动识别；
- UI steps；
- 通用表单自动填写；
- workflow engine；
- 多 Runtime Center 聚合；
- 从 DOM 自动推断 `inputSchema` 或输入参数。

## 如何使用

### 框架接入方

Modern.js 这类框架应该自动写入自己能确定的信息：

- app root 生命周期；
- route location；
- route match；
- basename；
- navigation；
- loader start / success / redirect / error；
- SSR 初始状态；
- hydration 状态；
- route component mounted / error。

框架还应该在真实 navigation、loader 和组件挂载开始前，提前注册自己已经知道的 target。例如 Modern.js 在路由表生成并完成 `modifyRoutes` 后，可以注册 route target、loader target 和 route component target；后续运行时再通过 `updateSnapshot` 更新这些 target 的当前状态。

框架负责提供框架层 ready，但不负责猜业务是否成功。

### MF 接入方

MF 应该自动写入模块加载相关信息：

- consumer name / role；
- instance name；
- remote name；
- manifest / remoteEntry；
- expose；
- shared dependency；
- uniqueName；
- build id；
- runtime error。

MF Adapter 应该在 MF instance 初始化和 remotes 配置可用后，提前注册 consumer、remote、expose 和 shared target；随后把 manifest、remoteEntry、expose、shared 的加载过程更新到 snapshot 和 events。

MF 负责说明 remote / expose / shared 是否正常，不判断业务组件是否真正 ready。

MF 自身状态优先复用 MF Observability Plugin。OpenRuntime 不重复实现一套 MF 加载追踪，而是在 MF 侧提供一个 OpenRuntime MF Adapter：

```txt
MF Observability Plugin
        ↓
OpenRuntime MF Adapter
        ↓
OpenRuntime
```

这个 Adapter 负责把 MF hooks 和 Observability report 转成 OpenRuntime 的 snapshot target 状态、target 关系字段和 events。

第一版接入方式分三类：

- 使用 MF 构建插件时，由构建插件自动注入 OpenRuntime MF Adapter，并自动标注当前应用是哪个 MF consumer；
- 使用 MF runtime API 时，用户注册 `openRuntimeMFPlugin()`，由 runtime plugin 从 MF instance 里读取 consumer、remotes、shared 和加载过程；
- 非标准封装场景，提供 `registerMFConsumer()` helper，让用户显式声明当前 consumer。

`registerMFConsumer()` 不是新的底层核心 API，只是 MF Adapter 的便捷入口。它内部仍然写入 OpenRuntime snapshot。

### 业务接入方

业务只补充框架无法判断的信息。

业务不需要直接手写复杂 target。业务侧可以通过 `useAgentReady`、`AgentReady` 或更轻量的 helper 自动注册 `business` target，并在业务状态变化时更新 snapshot。只有特殊业务对象才需要直接调用 `registerTarget`。

例如业务用户可以用默认 `business` 类型直接声明状态：

```ts
runtime.updateSnapshot({
  id: 'order-detail-page',
  status: Boolean(order) ? 'ready' : 'pending',
});
```

也可以注册安全动作：

```ts
runtime.registerAction({
  name: 'retryOrderLoader',
  description: 'Retry order loader.',
  risk: 'safe',
  handler: () => refetch(),
});
```

业务不应该需要理解 Runtime Center 内部结构。

### 三类接入方视角

下面示例说明不同接入方如何使用第一版 API。具体实现时还需要继续补充类型细节和边界，但函数职责先按本节收敛。

#### Modern.js：自动注册框架运行状态

Modern.js 负责把框架自己已经知道的信息写入 OpenRuntime。业务用户不应该为了基础路由状态手动埋点。

Modern.js runtime 初始化时创建或获取页面级 Runtime Center：

```ts
const runtime = getOrCreateOpenRuntime({
  app: appConfig.name,
  framework: 'modern-js',
});
```

应用启动时注册 app root 状态：

```ts
runtime.updateSnapshot({
  id: `app:${appConfig.name}`,
  type: 'app',
  source: 'modern-js',
  status: 'ready',
  data: {
    framework: 'modern-js',
  },
});
```

路由跳转时写入当前 route 状态：

```ts
router.subscribe(state => {
  runtime.updateSnapshot({
    id: `route:${state.location.pathname}`,
    type: 'route',
    source: 'modern-js',
    status: state.navigation.state === 'idle' ? 'ready' : 'loading',
    data: {
      location: state.location.pathname,
      matches: state.matches.map(match => match.route.id),
    },
  });
});
```

loader 由框架包装已有 loader，不自动创建新的 loader：

```ts
function wrapLoader(routeId: string, loader: LoaderFunction) {
  return async args => {
    runtime.updateSnapshot({
      id: `loader:${routeId}`,
      type: 'loader',
      source: 'modern-js',
      status: 'loading',
    });

    try {
      const result = await loader(args);

      runtime.updateSnapshot({
        id: `loader:${routeId}`,
        type: 'loader',
        source: 'modern-js',
        status: 'success',
        data: isRedirect(result) ? { redirect: true } : undefined,
      });

      return result;
    } catch (error) {
      runtime.updateSnapshot({
        id: `loader:${routeId}`,
        type: 'loader',
        source: 'modern-js',
        status: 'error',
        error,
      });
      throw error;
    }
  };
}
```

route component 挂载时，框架可以记录组件生命周期：

```tsx
function AgentRouteBoundary({ routeId, children }) {
  useEffect(() => {
    runtime.updateSnapshot({
      id: `component:route:${routeId}`,
      type: 'component',
      source: 'modern-js',
      status: 'ready',
      data: {
        routeId,
      },
    });

    return () => {
      runtime.updateSnapshot({
        id: `component:route:${routeId}`,
        type: 'component',
        source: 'modern-js',
        status: 'inactive',
      });
    };
  }, [routeId]);

  return children;
}
```

Modern.js 产出的结果是：Agent 可以直接知道当前 route、matched routes、navigation、loader、root mounted、hydration 等框架状态。

#### MF：自动注册模块加载状态

MF 负责把模块联邦运行时已经知道的信息写入 OpenRuntime。这里不要求业务用户直接调用 `updateSnapshot`，而是通过 MF Adapter 自动转换。

构建插件接入时，消费者身份可以从 MF 配置自动获得：

```ts
pluginModuleFederation({
  name: 'federation_consumer',
  remotes: {
    cloudConsoleProvider:
      'cloudConsoleProvider@http://localhost:4351/mf-manifest.json',
  },
  runtimePlugins: [
    openRuntimeMFPlugin(),
    observabilityPlugin(),
  ],
});
```

MF Adapter 在初始化阶段写入当前消费者：

```ts
runtime.updateSnapshot({
  id: 'app:federation_consumer',
  type: 'app',
  source: 'module-federation',
  status: 'ready',
  data: {
    role: 'consumer',
    name: 'federation_consumer',
    integration: 'build-plugin',
  },
});
```

并把 consumer 和 remote 建立关系：

```ts
runtime.updateSnapshot({
  id: 'app:federation_consumer',
  type: 'app',
  source: 'module-federation',
  status: 'ready',
  loads: ['remote:cloudConsoleProvider'],
});
```

如果用户直接使用 MF runtime API，则注册 runtime plugin：

```ts
createInstance({
  name: 'federation_consumer',
  remotes: [
    {
      name: 'cloudConsoleProvider',
      entry: 'http://localhost:4351/mf-manifest.json',
    },
  ],
  plugins: [
    observabilityPlugin(),
    openRuntimeMFPlugin(),
  ],
});
```

特殊封装场景下，可以使用 helper 显式声明消费者：

```ts
registerMFConsumer({
  name: 'federation_consumer',
  remotes: [
    {
      name: 'cloudConsoleProvider',
      entry: 'http://localhost:4351/mf-manifest.json',
    },
  ],
});
```

MF runtime 初始化时也可以更新当前 consumer instance 的细节：

```ts
runtime.updateSnapshot({
  id: `app:${instance.name}`,
  type: 'app',
  source: 'module-federation',
  status: 'ready',
  data: {
    role: 'consumer',
    version: instance.version,
    buildId: instance.buildId,
  },
});
```

remote 开始加载时写入状态：

```ts
runtime.updateSnapshot({
  id: 'remote:cloudConsoleProvider',
  type: 'remote',
  source: 'module-federation',
  status: 'loading',
  data: {
    manifestUrl: 'http://localhost:4351/mf-manifest.json',
  },
});
```

remote 加载成功后写入 snapshot：

```ts
runtime.updateSnapshot({
  id: 'remote:cloudConsoleProvider',
  type: 'remote',
  source: 'module-federation',
  status: 'success',
  data: {
    manifestUrl,
    remoteEntryUrl,
    exposes: ['./RemotePanel'],
  },
  provides: ['expose:cloudConsoleProvider/RemotePanel'],
});
```

expose 解析失败时写入错误：

```ts
runtime.updateSnapshot({
  id: 'expose:cloudConsoleProvider/RemotePanel',
  type: 'expose',
  source: 'module-federation',
  status: 'error',
  error,
});
```

shared 依赖解析时记录来源：

```ts
runtime.updateSnapshot({
  id: 'shared:react',
  type: 'shared',
  source: 'module-federation',
  status: 'success',
  data: {
    version: '19.2.6',
    from: 'host',
    singleton: true,
  },
});
```

Observability report 到 OpenRuntime 的转换规则可以先按下面收敛：

| MF 信息 | OpenRuntime 表达 |
| --- | --- |
| consumer / instance | consumer 写成 `type: 'app'`，instance 细节写入 `data` |
| remote loading / success / pending | `type: 'remote'` + 对应 `status` |
| remote failed | `type: 'remote'` + `status: 'error'` |
| remote recovered | `type: 'remote'` + `status: 'success'`，并在 `data` 里记录 recovered |
| expose loaded / failed | `type: 'expose'` + `status: 'success'` 或 `status: 'error'`，remote 通过 `provides` 字段关联 expose |
| shared provider / selected version / available versions | `type: 'shared'`，consumer 或 remote 通过 `shares` 字段关联 shared |
| manifest / remoteEntry / assets | 写入 `data` |
| loading trace events | 自动进入 `events` |
| loadedBefore / reused | 写入 `data`，用于判断是否复用了其他 consumer 的加载结果 |

MF 产出的结果是：Agent 可以知道当前应用是哪一个 consumer、它加载了哪些生产者、remote 是否加载、expose 是否解析、shared 依赖从哪里来、是否存在 React 多实例或 shared 冲突。

#### Modern.js 应用结合 MF：描述当前页面加载了哪些生产者

Modern.js 应用中，route 状态和 MF 状态需要组合起来看。

例如当前页面是 `/home`，它加载了 `cloudConsoleProvider/RemotePanel`：

```ts
runtime.updateSnapshot({
  id: 'route:/home',
  type: 'route',
  source: 'modern-js',
  status: 'ready',
  data: {
    matches: ['root', 'home'],
  },
  dependsOn: ['loader:home'],
  loads: ['remote:cloudConsoleProvider'],
  contains: ['business:cloud-console.dashboard'],
});
```

这样 Agent 读 snapshot 时，不只知道“当前路由是 `/home`”，还知道：

- 当前 route 依赖哪个 MF 生产者；
- 使用了哪个 expose；
- remote / expose / shared 是否成功；
- 如果页面没 ready，问题是在 route、loader、MF 加载，还是业务 ready。

一个更接近 Agent 读取结果的 snapshot 可以是：

```json
{
  "targets": {
    "route:/home": {
      "id": "route:/home",
      "type": "route",
      "status": "ready",
      "dependsOn": ["loader:home"],
      "loads": ["remote:cloudConsoleProvider"],
      "contains": ["business:cloud-console.dashboard"]
    },
    "loader:home": {
      "id": "loader:home",
      "type": "loader",
      "status": "success"
    },
    "remote:cloudConsoleProvider": {
      "id": "remote:cloudConsoleProvider",
      "type": "remote",
      "status": "success",
      "provides": ["expose:cloudConsoleProvider/RemotePanel"]
    },
    "business:cloud-console.dashboard": {
      "id": "business:cloud-console.dashboard",
      "type": "business",
      "status": "ready"
    }
  },
  "latestEventId": 42,
  "capturedAt": 1710000000000
}
```

#### 用户：标记业务组件和声明安全动作

用户只需要在框架无法自动判断的地方补充信息。

例如业务组件加载完关键数据后，声明状态：

```tsx
export function OrderDetailPage() {
  const { data, loading, error } = useOrderDetail();

  runtime.updateSnapshot({
    id: 'order-detail-page',
    status: error ? 'error' : !loading && data ? 'ready' : 'pending',
    data: {
      orderId: data?.id,
    },
    error,
  });

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorView error={error} />;
  }

  return <OrderDetail data={data} />;
}
```

用户也可以声明 Agent 能安全执行的动作：

```tsx
export function OrderDetailPage() {
  const { refetch } = useOrderDetail();

  runtime.registerAction({
    name: 'retryOrderDetail',
    description: 'Retry order detail request.',
    risk: 'safe',
    handler: () => refetch(),
  });

  return <OrderDetail />;
}
```

这样 Agent 不需要猜页面上哪个按钮可以点，而是先读取 actions：

```ts
const actions = await openRuntime.getActions();
```

然后执行页面声明过的安全动作：

```ts
await openRuntime.runAction('retryOrderDetail');
```

执行后再读取 snapshot 和 events 验证结果：

```ts
const snapshot = await openRuntime.getSnapshot();
const events = await openRuntime.getEvents();
```

用户侧的目标不是“多写埋点”，而是只在业务成功标准和安全动作上补充框架无法自动知道的信息。

### Agent 使用方

Agent 打开页面后，优先读取 OpenRuntime：

```ts
const snapshot = await openRuntime.getSnapshot();
const events = await openRuntime.getEvents();
const actions = await openRuntime.getActions();
```

如果页面声明了安全动作，Agent 可以执行：

```ts
await openRuntime.runAction('cloud-console.run-client-fallback');
```

执行后再读取：

```ts
const nextSnapshot = await openRuntime.getSnapshot();
const nextEvents = await openRuntime.getEvents({ since: snapshot.latestEventId });
```

Agent 应该用前后状态和事件作为验证证据，而不是只说“页面看起来正常”。

### 第一期验证方式

第一期可以先用 `cloud-console` 这类 demo 验证：

1. 页面初始停在 `/`；
2. OpenRuntime snapshot 显示 route pending、loader pending、business pending；
3. Agent 读取 actions，发现可执行 fallback action；
4. Agent 执行 action；
5. 页面进入 `/home`；
6. snapshot 更新为 route success、loader success、business ready；
7. events 记录完整变化过程。

这能验证 OpenRuntime 是否真的帮助 Agent 完成：

```txt
观察 → 操作 → 验证
```

## 阶段规划

整体规划收敛为三期。

### 第一期：OpenRuntime 最小可用闭环

目标：

> Agent 能在 demo 和本地开发场景里，通过 OpenRuntime 读取状态、执行动作、等待结果，并输出有证据的判断。

第一期需要提供：

| 方向 | 能力 |
| --- | --- |
| Core SDK | `connectBridge`、`updateSnapshot`、`registerAction`、`unregisterAction`、`runAction`、`waitFor`、`getInputOptions`、`getSnapshot`、`getEvents`、`getActions` |
| Window API | `window.__OPEN_RUNTIME__` |
| HTTP Bridge | 页面主动连接 Bridge；提供 runtimes、targets、snapshot、events、actions、run-action、wait-for |
| CLI | 启动 Bridge、查看 runtimes / targets、读取 snapshot / events / actions、执行 action、等待状态 |
| Skill | 告诉 Agent 优先读取 OpenRuntime，没有 runtime 时再 fallback 到 UI、console、network |
| 构建插件 | 提供 Rspack / Webpack 基础版本，用于注入 runtime 初始化和 bridge client；Modern.js 内部可以复用 |
| Modern.js | app/root、route location、basename、match、navigation、redirect、loader、route component、hydration、render error |
| MF | 基于 Observability Plugin 记录 consumer、remote、expose、shared、manifest、remoteEntry、uniqueName、build id、chunk / asset trace、loadedBefore / reused |
| Goofy | app、env、release、commit、branch、artifact、asset base、sourcemap 是否存在 |

第一期对应 demo 能解决的问题：

| 问题类型 | 对应 demo | OpenRuntime 帮助 |
| --- | --- | --- |
| 路由路径或 basename 错误 | `account-flow` | 直接看到 location、basename、matched routes、route component 状态 |
| Router 嵌套或渲染异常 | `workspace-shell` | 看到 route 已匹配，但 route component 或 render error 异常 |
| loader / redirect 状态不清楚 | `cloud-console` | 看到 loader start / success / error / redirect，以及最终 route 状态 |
| MF shared 冲突 | `order-adapter` | 看到 React shared 的 provider、version、singleton、来源 |
| MF remote / expose 加载失败 | `creative-hub` | 看到 consumer、remote、manifest、expose、shared 的加载状态 |
| async chunk / uniqueName / 资源复用问题 | `rivendell-workbench` | 看到 chunk / asset trace、uniqueName、build id、loadedBefore / reused |
| Garfish 子应用 mount 失败 | `creative-hub`、`rivendell-workbench` | 看到 sub-app load / mount / error 状态，并能区分 MF、Garfish 和业务 ready |
| 部署版本错配 | MF / chunk 类 demo | 通过 Goofy 看到 release、commit、artifact、asset base，并关联 consumer / producer 版本 |

第一期完成后，Agent 至少能把问题归因到：

```txt
route / loader / render / MF remote / MF shared / Garfish mount / chunk asset / deployment version
```

### 第二期：编译产物到源码定位

目标：

> Agent 只看到线上或构建后页面，也能结合 Goofy、sourcemap 和 MF 信息，定位到源码文件和行号。

第二期需要打通：

- 根据页面 URL / asset URL 找到 Goofy release；
- 根据 chunk 找到 artifact；
- 根据 artifact 找到 sourcemap；
- 根据 sourcemap 还原源码位置；
- 结合 MF 信息判断问题属于 consumer 还是 producer；
- 结合 expose / shared / chunk trace 定位具体模块。

第二期希望 Agent 输出完整证据链：

```txt
哪个应用
哪个 release
哪个 chunk
哪个 sourcemap
哪个源码文件
哪一行代码
为什么判断是这里
```

这期主要解决：

- 编译后代码报错，但不知道源码在哪里；
- MF producer 报错，但 consumer 页面只看到 runtime error；
- chunk 404、shared 冲突、expose error 无法快速关联源码；
- oncall 里需要人手动查发布、产物、sourcemap、源码行号。

### 第三期：生产可用和平台化

目标：

> 让这套能力能安全地用于 staging / oncall / 平台任务，而不只是本地 demo。

第三期需要补齐：

- Bridge 登录态场景打磨；
- token / origin / app / runtime version 校验；
- action 权限控制；
- sensitive / destructive action 默认禁止；
- staging / oncall 手动开启模式；
- 多 target 管理；
- 平台模板集成；
- 标准评测集；
- 效果数据统计；
- WebMCP adapter 或平台原生工具出口。

这期主要解决：

- 能不能在真实登录态页面用；
- 能不能放心让 Agent 操作；
- 能不能在内部平台批量跑；
- 能不能长期评估效果；
- 能不能接未来标准出口。

三期关系可以概括为：

| 阶段 | 重点 |
| --- | --- |
| 第一期 | 最小可用闭环：Core API + Modern.js + MF + Goofy 基础上下文 + Bridge + CLI + Skill + 构建插件 |
| 第二期 | 源码定位：Goofy + sourcemap + MF 信息定位到源码文件和行号 |
| 第三期 | 生产可用：登录态、权限、安全、平台化、评测、标准出口 |

## 边界

OpenRuntime 不做：

- 不做 WebMCP 的竞争协议；
- 不做通用浏览器自动化框架；
- 不做任意 DOM 操作系统；
- 不做生产监控或 APM；
- 不自动猜业务成功标准；
- 不让 Agent 执行未声明的危险动作；
- 第一期不做跨 tab、跨 iframe、跨 worker、多 Runtime Center 聚合；
- 不要求所有生产者强依赖同一个 SDK 包版本。

OpenRuntime 要做的是：

> 让前端应用具备对 Agent 友好的运行时能力，使 Agent 能够读取状态、等待变化、执行声明动作并验证结果。

## 当前结论

阶段性结论：

- 名称使用 **OpenRuntime**。
- 它是一套让应用向 Agent 开放 State、Action 和 Event 的前端运行时能力。
- 核心目标是减少 AI coding 过程中的人工介入，支撑真正的 agent loop。
- 稳定的是页面状态、事件、ready、blockers、actions 这些运行时语义。
- 可替换的是 WebMCP、CLI、Bridge、Window API、平台原生能力等暴露方式。
- Modern.js 和 MF 是首批内置接入方。
- 业务只需要补充框架无法自动判断的 ready 和 action。
