# Agent Runtime 阶段性总结

## 名称

建议统一使用 **Agent Runtime**。

它可以拆成三个层次理解：

| 名称 | 含义 |
| --- | --- |
| Agent Runtime | 产品能力名称 |
| Agent Runtime SDK | 前端应用接入这套能力的 SDK |
| Agent Runtime API | Agent 实际读取状态、等待状态、执行动作时调用的 API |

不建议继续使用 “diagnostics”、“inspection spec” 或 “interaction spec” 作为主名称。这些词容易把范围说窄，或者让它听起来像一个协议文档。

Agent Runtime 更贴近当前目标：它是一套给 Agent 使用的前端运行时能力。

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

Agent Runtime 的目标不是做一个新的 WebMCP，也不是做一个通用浏览器自动化工具。

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

中间的运行、观察、操作、验证，尽量交给 Agent Runtime 支撑。

## 产品形态

Agent Runtime 是一套前端运行时 SDK。

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

Agent Runtime 应该稳定定义这些概念：

- `snapshot`：页面当前状态；
- `events`：页面历史过程；
- `ready`：某个页面、路由、组件或业务目标是否可用；
- `blockers`：当前为什么还不能认为 ready；
- `actions`：页面声明给 Agent 的安全动作；
- `evidence`：Agent 判断结果成立的证据。

这些是 Agent Runtime 的核心价值。

### 可替换的是接入原子

后续随着浏览器、Agent 平台和各大厂商能力发展，底层接入方式可以替换。

例如：

- 现在可以先用 `window.__AGENT_RUNTIME__` 暴露；
- 内部平台可以通过自己的 bridge 访问；
- 后续 Chrome WebMCP 成熟后，可以新增 WebMCP adapter；
- 移动端容器或平台原生能力也可以提供自己的 adapter。

关键原则是：

> Runtime Center 不关心自己被哪种方式访问。WebMCP、CLI、Bridge Server、Window API 都只是 transport，不是核心协议。

### 和 WebMCP 的关系

WebMCP 可以作为未来的一个重要出口，但不是 Agent Runtime 的替代品。

WebMCP 更像是：

```txt
Agent 如何发现和调用页面能力
```

Agent Runtime 要解决的是：

```txt
前端应用如何产出 Agent 需要的页面状态、运行事件、ready 条件、blockers 和 actions
```

所以更合理的关系是：

```txt
Modern.js / MF / Garfish / 业务代码
        ↓
Agent Runtime
        ↓
WebMCP adapter / CLI / Bridge / Window API
        ↓
Agent
```

后续如果 WebMCP 成熟，可以把 Agent Runtime 的能力注册成 WebMCP tools，例如：

- `agentRuntime.getSnapshot`
- `agentRuntime.getEvents`
- `agentRuntime.getActions`
- `agentRuntime.waitFor`
- `agentRuntime.runAction`

这样不是被 WebMCP 替代，而是把 WebMCP 作为标准出口。

## 接入和访问方式

Agent Runtime 的接入和访问需要分开看：

```txt
页面如何接入 Agent Runtime
页面外的 Agent 如何访问 Agent Runtime
```

页面内接入依赖 SDK。页面外访问依赖 Window API、HTTP Bridge、CLI 或未来的 WebMCP adapter。

### 基础 SDK

第一版只提供一个基础包：

```txt
@agent-runtime/core
```

Modern.js、MF 和业务代码都依赖这个包：

```txt
Modern.js 内置接入 -> @agent-runtime/core
MF 内置接入        -> @agent-runtime/core
业务手动接入      -> @agent-runtime/core
```

第一期不单独提供：

```txt
@agent-runtime/modern-js
@agent-runtime/module-federation
@agent-runtime/react
```

原因是：

- Modern.js 和 MF 可以直接在各自实现里内置 Agent Runtime；
- React tree 暂时不是判断业务 ready 的核心依据；
- 过早拆包会增加理解成本和维护成本。

### Window API

Window API 是最小访问出口：

```ts
window.__AGENT_RUNTIME__
```

它适合：

- 本地调试；
- Agent 通过浏览器上下文直接读取；
- 没有 HTTP Bridge 时作为兜底；
- 验证 SDK 是否正常工作。

Window API 不负责跨进程通信。页面外的 Agent 如果要稳定访问页面运行态，仍然需要 HTTP Bridge。

### HTTP Bridge

HTTP Bridge 是本地服务，不是 SDK 本体。它负责把页面里的 Agent Runtime 暴露给页面外的 Agent、CLI 或平台。

核心链路：

```txt
页面 Agent Runtime
        ↓ WebSocket 主动连接
本地 HTTP Bridge
        ↑ HTTP API
Agent / CLI / 平台
```

页面需要主动连接 Bridge，因为浏览器页面不能自己启动 HTTP 服务，页面外的 Agent 也不能直接请求某个页面实例。

第一版 HTTP Bridge 可以提供：

```txt
GET  /targets
GET  /targets/:id/snapshot
GET  /targets/:id/events
GET  /targets/:id/actions
GET  /targets/:id/actions/:name/options
POST /targets/:id/actions/:name/run
POST /targets/:id/wait-for
GET  /targets/:id/events/stream
```

其中：

- `targets` 表示当前连接到 Bridge 的页面；
- `snapshot` 表示页面当前状态；
- `events` 表示页面历史变化；
- `actions` 表示页面声明的可执行动作；
- `options` 表示动态参数选项；
- `run` 表示执行页面声明过的 action；
- `wait-for` 表示等待页面状态变化；
- `events/stream` 表示持续监听事件。

页面里的 Agent Runtime 仍然是事实来源。Bridge 可以缓存最近的 snapshot 和 events，但不能成为主状态源。页面断开后，Bridge 可以返回最后一次看到的状态，但必须标记为 disconnected。

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
  agentRuntime: {
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

Bridge Server 还需要校验 token、origin、app name 和 runtime version。页面允许连接不代表 Bridge 一定接受。

### 构建插件

通用 Rspack / Webpack 构建插件应该和 HTTP Bridge 一起提供基础版本，但它不是 Modern.js 用户的主入口。

更合理的定位是：

```txt
@agent-runtime/core
Modern.js 内置接入
通用 Rspack / Webpack 构建插件
```

Modern.js 用户不应该手动配置 `AgentRuntimeWebpackPlugin` 或 `AgentRuntimeRspackPlugin`。Modern.js 只暴露框架配置，内部复用通用注入逻辑。

通用构建插件主要服务两个场景：

- 非 Modern.js 项目接入 Agent Runtime；
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
agent-runtime bridge
agent-runtime status
agent-runtime targets
agent-runtime snapshot --target <target-id>
agent-runtime events --target <target-id>
agent-runtime actions --target <target-id>
agent-runtime run-action --target <target-id> <action-name>
agent-runtime wait-for --target <target-id> <id> <status>
```

### Agent 使用方式

Agent 真正知道如何使用 Agent Runtime，主要依赖 Skill 或平台工具说明。

推荐链路：

```txt
Agent Skill
  ↓
CLI 或 HTTP API
  ↓
HTTP Bridge
  ↓
页面 Agent Runtime
```

Skill 负责告诉 Agent：

- 优先检查是否存在 Agent Runtime；
- 如何连接 Bridge；
- 如何读取 snapshot、events 和 actions；
- 如何执行 action；
- 如何等待目标状态；
- 如何用结果验证问题；
- 没有 Agent Runtime 时再 fallback 到 UI、console、network。

这部分的职责边界是：

```txt
Agent Runtime SDK：页面提供能力
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

## 内部数据结构

Agent Runtime 内部先收敛为三类核心数据：

```txt
Snapshot
Event Log
Action Registry
```

其中 Snapshot 使用图结构表达页面当前状态，Event Log 记录状态变化过程，Action Registry 保存页面声明给 Agent 的可调用能力。

### Snapshot

Snapshot 表示页面当前仍然有效的运行态，不保存完整历史。

```ts
type RuntimeSnapshot = {
  items: RuntimeSnapshotItem[];
  relations: RuntimeSnapshotRelation[];
  latestEventId: number;
};
```

`items` 表示当前页面里的运行时对象：

```ts
type RuntimeSnapshotItem = {
  id: string;
  type:
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
  status:
    | 'idle'
    | 'loading'
    | 'pending'
    | 'success'
    | 'error'
    | 'ready'
    | 'blocked'
    | 'inactive';
  source: string;
  label?: string;
  data?: unknown;
  error?: RuntimeError;
  updatedAt: number;
};
```

`type` 表示对象是什么，例如 route、loader、remote、业务 ready。`status` 表示它当前处于什么状态。

`relations` 表示对象关系：

```ts
type RuntimeSnapshotRelation = {
  from: string;
  to: string;
  type:
    | 'contains'
    | 'depends-on'
    | 'loads'
    | 'renders'
    | 'provides'
    | 'shares'
    | 'custom';
  relation?: string;
  label?: string;
  data?: unknown;
};
```

内置 relation type 的默认含义：

| type | 含义 |
| --- | --- |
| `contains` | 包含关系，例如 app contains route |
| `depends-on` | 依赖关系，例如 route depends-on loader |
| `loads` | 加载关系，例如 route loads MF remote |
| `renders` | 渲染关系，例如 expose renders component |
| `provides` | 提供关系，例如 remote provides expose |
| `shares` | shared 依赖关系，例如 MF shares react |
| `custom` | 业务自定义关系 |

`custom` 用于业务特殊关系，但需要配合 `relation` 或 `label` 使用，例如：

```ts
{
  from: 'field:province',
  to: 'field:city',
  type: 'custom',
  relation: 'controls-options',
  label: 'Province controls city options',
}
```

不建议第一版直接允许任意 string type。稳定的内置类型更利于 Agent 推理，业务扩展通过 `custom + relation` 表达。

### Event Log

Event 记录 Snapshot 的变化过程。

```ts
type RuntimeEvent = {
  id: number;
  type: string;
  source: string;
  timestamp: number;
  itemId?: string;
  relation?: RuntimeSnapshotRelation;
  status?: RuntimeSnapshotItem['status'];
  data?: unknown;
  error?: RuntimeError;
};
```

例如状态变化：

```ts
{
  id: 12,
  type: 'snapshot.updated',
  source: 'modern-js',
  itemId: 'loader:home',
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
    type: 'loads',
  },
}
```

### Action Registry

Action 是页面声明给 Agent 的可调用能力。Agent 不应该随便操作 DOM，而是调用页面声明过的 action。

第一版 action 先采用纯 action 声明，不做 DOM 自动识别、UI steps 或通用表单自动填写。

```ts
type RuntimeAction = {
  name: string;
  description?: string;
  params?: RuntimeActionParam[];
  getInputOptions?: RuntimeInputOptionsProvider;
  expect?: RuntimeCondition | RuntimeCondition[];
  enabled?: boolean;
  blockedBy?: RuntimeCondition[];
  risk?: 'safe' | 'state-changing' | 'destructive' | 'sensitive';
  handler: RuntimeActionHandler;
};
```

`name` 和 `handler` 是核心。`description`、`params`、`getInputOptions`、`expect` 用于帮助 Agent 更稳定地传参和验证结果。

`params` 描述 action 需要哪些参数：

```ts
type RuntimeActionParam = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'option';
  required?: boolean;
  description?: string;
  dependsOn?: string[];
};
```

`getInputOptions` 用于动态选项，例如普通 select、checkbox group、省市区级联：

```ts
type RuntimeInputOptionsProvider = (
  inputName: string,
  currentPayload?: Record<string, unknown>,
) => Promise<RuntimeOption[]> | RuntimeOption[];

type RuntimeOption = {
  label: string;
  value: string | number | boolean;
  description?: string;
};
```

`expect` 表示执行 action 后希望看到的状态：

```ts
type RuntimeCondition = {
  id: string;
  status: RuntimeSnapshotItem['status'];
};
```

示例：

```ts
registerAction({
  name: 'selectRegion',
  description: 'Select province, city and street.',
  params: [
    { name: 'province', type: 'option', required: true },
    {
      name: 'city',
      type: 'option',
      required: true,
      dependsOn: ['province'],
    },
    {
      name: 'street',
      type: 'option',
      required: true,
      dependsOn: ['city'],
    },
  ],
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
  expect: {
    id: 'field:region',
    status: 'ready',
  },
  handler: async ({ province, city, street }, ctx) => {
    await selectRegion({ province, city, street });
    ctx.updateSnapshot({
      id: 'field:region',
      type: 'field',
      status: 'ready',
    });
  },
});
```

### 第一版公开 API

公开 API 分成写入侧和 Agent 读取 / 执行侧。

写入侧只保留少量 API：

```ts
runtime.updateSnapshot(input);
runtime.registerAction(action);
runtime.unregisterAction(actionName);
runtime.runAction(actionName, payload?);
```

其中：

- `updateSnapshot` 更新当前页面状态；
- `registerAction` 注册页面声明给 Agent 的可调用能力；
- `unregisterAction` 注销 action；
- `runAction` 执行 action，既可以给 Agent 用，也可以给本地自测用。

公开 API 不提供 `emit`。事件由 Runtime Center 自动记录：

- 调用 `updateSnapshot` 后自动记录 snapshot 变更事件；
- 调用 `registerAction` 后自动记录 `action.registered`；
- 调用 `unregisterAction` 后自动记录 `action.unregistered`；
- 调用 `runAction` 后自动记录 `action.started`、`action.success` 或 `action.error`。

这样使用方不需要同时维护 snapshot 和 events，避免双写不一致。

`updateSnapshot` 的第一版形态：

```ts
type UpdateSnapshotInput = {
  id: string;
  status: RuntimeStatus;
  type?: RuntimeObjectType;
  source?: string;
  label?: string;
  data?: unknown;
  error?: RuntimeError;
  relations?: RuntimeRelationInput[];
};
```

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
  status: 'success',
});
```

`getSnapshot` 返回当前状态，使用 `items` 和 `relations`，不向使用方暴露内部图结构概念：

```ts
type RuntimeSnapshot = {
  items: RuntimeSnapshotItem[];
  relations: RuntimeSnapshotRelation[];
  latestEventId: number;
};
```

其中：

```ts
type RuntimeSnapshotItem = {
  id: string;
  type?: RuntimeObjectType;
  status: RuntimeStatus;
  source?: string;
  label?: string;
  data?: unknown;
  error?: RuntimeError;
  updatedAt: number;
};
```

Agent 读取 / 执行侧 API：

```ts
getSnapshot();
getEvents(filter?);
getActions();
getInputOptions(actionName, inputName, currentPayload?);
runAction(actionName, payload?);
waitFor(condition, options?);
```

其中：

- `getSnapshot` 读取当前状态；
- `getEvents` 读取历史变化；
- `getActions` 读取页面声明过的动作；
- `getInputOptions` 读取动态参数选项；
- `runAction` 执行动作；
- `waitFor` 等待目标状态。

第一版不做：

- DOM 自动识别；
- UI steps；
- 通用表单自动填写；
- workflow engine；
- 多 Runtime Center 聚合；
- 从 DOM 自动推断 params。

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

MF 负责说明 remote / expose / shared 是否正常，不判断业务组件是否真正 ready。

MF 自身状态优先复用 MF Observability Plugin。Agent Runtime 不重复实现一套 MF 加载追踪，而是在 MF 侧提供一个 Agent Runtime MF Adapter：

```txt
MF Observability Plugin
        ↓
Agent Runtime MF Adapter
        ↓
Agent Runtime
```

这个 Adapter 负责把 MF hooks 和 Observability report 转成 Agent Runtime 的 snapshot、relations 和 events。

第一版接入方式分三类：

- 使用 MF 构建插件时，由构建插件自动注入 Agent Runtime MF Adapter，并自动标注当前应用是哪个 MF consumer；
- 使用 MF runtime API 时，用户注册 `agentRuntimeMFPlugin()`，由 runtime plugin 从 MF instance 里读取 consumer、remotes、shared 和加载过程；
- 非标准封装场景，提供 `registerMFConsumer()` helper，让用户显式声明当前 consumer。

`registerMFConsumer()` 不是新的底层核心 API，只是 MF Adapter 的便捷入口。它内部仍然写入 Agent Runtime snapshot。

### 业务接入方

业务只补充框架无法判断的信息。

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

Modern.js 负责把框架自己已经知道的信息写入 Agent Runtime。业务用户不应该为了基础路由状态手动埋点。

Modern.js runtime 初始化时创建或获取页面级 Runtime Center：

```ts
const runtime = getOrCreateAgentRuntime({
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
  status: 'success',
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
    status: state.navigation.state === 'idle' ? 'success' : 'loading',
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
      relations: [
        {
          type: 'depends-on',
          from: `route:${routeId}`,
        },
      ],
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
      status: 'success',
      relations: [
        {
          type: 'renders',
          from: `route:${routeId}`,
        },
      ],
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

MF 负责把模块联邦运行时已经知道的信息写入 Agent Runtime。这里不要求业务用户直接调用 `updateSnapshot`，而是通过 MF Adapter 自动转换。

构建插件接入时，消费者身份可以从 MF 配置自动获得：

```ts
pluginModuleFederation({
  name: 'federation_consumer',
  remotes: {
    cloudConsoleProvider:
      'cloudConsoleProvider@http://localhost:4351/mf-manifest.json',
  },
  runtimePlugins: [
    agentRuntimeMFPlugin(),
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
  status: 'success',
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
  id: 'remote:cloudConsoleProvider',
  type: 'remote',
  source: 'module-federation',
  status: 'idle',
  data: {
    manifestUrl: 'http://localhost:4351/mf-manifest.json',
  },
  relations: [
    {
      from: 'app:federation_consumer',
      to: 'remote:cloudConsoleProvider',
      type: 'loads',
    },
  ],
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
    agentRuntimeMFPlugin(),
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
  status: 'success',
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
  relations: [
    {
      type: 'provides',
      from: 'remote:cloudConsoleProvider',
    },
  ],
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

Observability report 到 Agent Runtime 的转换规则可以先按下面收敛：

| MF 信息 | Agent Runtime 表达 |
| --- | --- |
| consumer / instance | consumer 写成 `type: 'app'`，instance 细节写入 `data` |
| remote loading / success / pending | `type: 'remote'` + 对应 `status` |
| remote failed | `type: 'remote'` + `status: 'error'` |
| remote recovered | `type: 'remote'` + `status: 'success'`，并在 `data` 里记录 recovered |
| expose loaded / failed | `type: 'expose'` + `status: 'success'` 或 `status: 'error'` + `provides` relation |
| shared provider / selected version / available versions | `type: 'shared'` + `shares` relation |
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
  status: 'success',
  data: {
    matches: ['root', 'home'],
  },
  relations: [
    {
      type: 'loads',
      to: 'remote:cloudConsoleProvider',
    },
  ],
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
  "items": [
    {
      "id": "route:/home",
      "type": "route",
      "status": "success"
    },
    {
      "id": "loader:home",
      "type": "loader",
      "status": "success"
    },
    {
      "id": "remote:cloudConsoleProvider",
      "type": "remote",
      "status": "success"
    },
    {
      "id": "business:cloud-console.dashboard",
      "type": "business",
      "status": "ready"
    }
  ],
  "relations": [
    {
      "from": "route:/home",
      "to": "loader:home",
      "type": "depends-on"
    },
    {
      "from": "route:/home",
      "to": "remote:cloudConsoleProvider",
      "type": "loads"
    },
    {
      "from": "route:/home",
      "to": "business:cloud-console.dashboard",
      "type": "contains"
    }
  ],
  "latestEventId": 42
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
const actions = await agentRuntime.getActions();
```

然后执行页面声明过的安全动作：

```ts
await agentRuntime.runAction('retryOrderDetail');
```

执行后再读取 snapshot 和 events 验证结果：

```ts
const snapshot = await agentRuntime.getSnapshot();
const events = await agentRuntime.getEvents();
```

用户侧的目标不是“多写埋点”，而是只在业务成功标准和安全动作上补充框架无法自动知道的信息。

### Agent 使用方

Agent 打开页面后，优先读取 Agent Runtime：

```ts
const snapshot = await agentRuntime.getSnapshot();
const events = await agentRuntime.getEvents();
const actions = await agentRuntime.getActions();
```

如果页面声明了安全动作，Agent 可以执行：

```ts
await agentRuntime.runAction('cloud-console.run-client-fallback');
```

执行后再读取：

```ts
const nextSnapshot = await agentRuntime.getSnapshot();
const nextEvents = await agentRuntime.getEvents({ since: snapshot.latestEventId });
```

Agent 应该用前后状态和事件作为验证证据，而不是只说“页面看起来正常”。

### 第一期验证方式

第一期可以先用 `cloud-console` 这类 demo 验证：

1. 页面初始停在 `/`；
2. Agent Runtime snapshot 显示 route pending、loader pending、business pending；
3. Agent 读取 actions，发现可执行 fallback action；
4. Agent 执行 action；
5. 页面进入 `/home`；
6. snapshot 更新为 route success、loader success、business ready；
7. events 记录完整变化过程。

这能验证 Agent Runtime 是否真的帮助 Agent 完成：

```txt
观察 → 操作 → 验证
```

## 阶段规划

整体规划收敛为三期。

### 第一期：Agent Runtime 最小可用闭环

目标：

> Agent 能在 demo 和本地开发场景里，通过 Agent Runtime 读取状态、执行动作、等待结果，并输出有证据的判断。

第一期需要提供：

| 方向 | 能力 |
| --- | --- |
| Core SDK | `updateSnapshot`、`registerAction`、`unregisterAction`、`runAction`、`waitFor`、`getInputOptions`、`getSnapshot`、`getEvents`、`getActions` |
| Window API | `window.__AGENT_RUNTIME__` |
| HTTP Bridge | 页面主动连接 Bridge；提供 targets、snapshot、events、actions、run-action、wait-for |
| CLI | 启动 Bridge、查看 targets、读取 snapshot / events / actions、执行 action、等待状态 |
| Skill | 告诉 Agent 优先读取 Agent Runtime，没有 runtime 时再 fallback 到 UI、console、network |
| 构建插件 | 提供 Rspack / Webpack 基础版本，用于注入 runtime 初始化和 bridge client；Modern.js 内部可以复用 |
| Modern.js | app/root、route location、basename、match、navigation、redirect、loader、route component、hydration、render error |
| MF | 基于 Observability Plugin 记录 consumer、remote、expose、shared、manifest、remoteEntry、uniqueName、build id、chunk / asset trace、loadedBefore / reused |
| Goofy | app、env、release、commit、branch、artifact、asset base、sourcemap 是否存在 |

第一期对应 demo 能解决的问题：

| 问题类型 | 对应 demo | Agent Runtime 帮助 |
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

Agent Runtime 不做：

- 不做 WebMCP 的竞争协议；
- 不做通用浏览器自动化框架；
- 不做任意 DOM 操作系统；
- 不做生产监控或 APM；
- 不自动猜业务成功标准；
- 不让 Agent 执行未声明的危险动作；
- 第一期不做跨 tab、跨 iframe、跨 worker、多 Runtime Center 聚合；
- 不要求所有生产者强依赖同一个 SDK 包版本。

Agent Runtime 要做的是：

> 让前端应用具备对 Agent 友好的运行时能力，使 Agent 能够读取状态、等待变化、执行声明动作并验证结果。

## 当前结论

阶段性结论：

- 名称使用 **Agent Runtime**。
- 它是一套面向 AI Agent 的前端运行时 SDK。
- 核心目标是减少 AI coding 过程中的人工介入，支撑真正的 agent loop。
- 稳定的是页面状态、事件、ready、blockers、actions 这些运行时语义。
- 可替换的是 WebMCP、CLI、Bridge、Window API、平台原生能力等暴露方式。
- Modern.js 和 MF 是首批内置接入方。
- 业务只需要补充框架无法自动判断的 ready 和 action。
