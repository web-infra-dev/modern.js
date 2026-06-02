# Agent Runtime 测试流程

## 目标

这份流程用于评估 Agent Runtime 能否让 Agent 更快、更稳定地完成 Modern.js 页面调试。

后续每次测试都应该用同一套流程执行：

1. 当前能力下跑一次，作为 baseline。
2. 接入 Agent Runtime 能力后，用同一批 case 复跑。
3. 对比耗时、判断准确率、证据完整度和人工辅助次数。

重点不是证明某个 demo 能不能打开，而是衡量 Agent 是否能从“靠人辅助排查”变成“自己打开页面、观察状态、触发动作、等待结果、给出结论”。

## 测试范围

第一批固定测集使用 `tests/integration/agent-runtime-mf` 下的 6 个 demo。下表只给评估人员做统计和分组，不应该原样放进被测 Agent 的 prompt。

| Demo | 覆盖方向 | 是否包含页面动作 |
| --- | --- | --- |
| `react-multi-version` | MF shared / React runtime / component render | 否 |
| `nested-router-tree` | route / React render | 否 |
| `async-chunk-runtime` | build runtime / MF / Garfish / async chunk | 是 |
| `garfish-provider` | Garfish / provider / context | 视 demo 状态而定 |
| `redirect-loader` | route / loader / redirect | 是 |
| `usenavigate-blank` | route action / navigation / blank state | 是 |

扩展测集使用 `.goal/vmok-oncall-reviewed-cases` 下的 14 个真实 case。扩展测集可以按登录态、是否可本地复现、是否需要补充上下文分批执行。

## 首批 Demo 启动信息

这部分只给测试执行者准备环境使用。被测 Agent 默认只拿 `target_url` 和当前 case 的源码入口，不拿启动命令和覆盖方向。

| Demo | Provider | Consumer | Target URL | 备注 |
| --- | --- | --- | --- | --- |
| `react-multi-version` | `pnpm --dir tests/integration/agent-runtime-mf/cases/react-multi-version/provider dev` | `pnpm --dir tests/integration/agent-runtime-mf/cases/react-multi-version/consumer dev` | `http://localhost:4312` | 常规 dev 启动 |
| `nested-router-tree` | `pnpm --dir tests/integration/agent-runtime-mf/cases/nested-router-tree/provider dev` | `pnpm --dir tests/integration/agent-runtime-mf/cases/nested-router-tree/consumer dev` | `http://localhost:4322` | 常规 dev 启动 |
| `async-chunk-runtime` | `pnpm --dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime/provider build`，然后 `pnpm --dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime/provider serve` | `pnpm --dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime/consumer dev` | `http://localhost:4332` | provider 需要先 build 再 serve |
| `garfish-provider` | `pnpm --dir tests/integration/agent-runtime-mf/cases/garfish-provider/provider dev` | `pnpm --dir tests/integration/agent-runtime-mf/cases/garfish-provider/consumer dev` | `http://localhost:4342` | 常规 dev 启动 |
| `redirect-loader` | `pnpm --dir tests/integration/agent-runtime-mf/cases/redirect-loader/provider dev` | `pnpm --dir tests/integration/agent-runtime-mf/cases/redirect-loader/consumer dev` | `http://localhost:4352` | 常规 dev 启动 |
| `usenavigate-blank` | `pnpm --dir tests/integration/agent-runtime-mf/cases/usenavigate-blank/provider dev` | `pnpm --dir tests/integration/agent-runtime-mf/cases/usenavigate-blank/consumer dev` | `http://localhost:4362` | 常规 dev 启动 |

## 启动 Codex 测试

后续新建会话时，可以直接让 Agent 使用这个文档和脚本执行测试：

```txt
请按照 docs/agent-runtime/evaluation-process.md，
使用 scripts/agent-runtime/run-codex-eval.sh 跑 <case> 的 <baseline/runtime> 测试。
目标页面是 <target_url>。
```

也可以直接在命令行执行脚本：

```bash
scripts/agent-runtime/run-codex-eval.sh \
  --case async-chunk-runtime \
  --round baseline
```

接入 Agent Runtime 后复跑：

```bash
scripts/agent-runtime/run-codex-eval.sh \
  --case async-chunk-runtime \
  --round runtime
```

首批 demo 的 URL 会由脚本根据 `--case` 自动推断：

| Case | 自动 URL |
| --- | --- |
| `react-multi-version` | `http://localhost:4312` |
| `nested-router-tree` | `http://localhost:4322` |
| `async-chunk-runtime` | `http://localhost:4332` |
| `garfish-provider` | `http://localhost:4342` |
| `redirect-loader` | `http://localhost:4352` |
| `usenavigate-blank` | `http://localhost:4362` |

只有真实页面、登录态页面，或者不在首批 demo 列表里的 case，才需要手动传 `--url`。

脚本会自动使用：

```bash
codex \
  --ask-for-approval never \
  exec \
  --ephemeral \
  --disable memories \
  --sandbox workspace-write
```

其中：

- `--ephemeral` 用于避免测试会话持久化。
- `--disable memories` 用于避免 Codex 读取历史记忆。
- `--ask-for-approval never` 用于避免非交互测试卡在确认步骤。
- `--output-last-message` 会把最终回答保存到结果目录。
- `--json` 会把执行事件保存为 JSONL，方便后续统计。

默认使用 `repo-assisted` 模式。这个模式更接近真实开发排查：Agent 可以看源码，但脚本会把 Codex 工作目录限制在当前 demo case 目录，而不是整个 Modern.js 仓库。

例如 `async-chunk-runtime` 默认入口是：

```txt
tests/integration/agent-runtime-mf/cases/async-chunk-runtime
```

如果要手动指定源码入口，可以传 `--case-dir`：

```bash
scripts/agent-runtime/run-codex-eval.sh \
  --case async-chunk-runtime \
  --round baseline \
  --case-dir tests/integration/agent-runtime-mf/cases/async-chunk-runtime
```

如果要测纯黑盒页面调试能力，可以使用 `black-box`。这个模式会把 Codex 工作目录放到临时空目录，只给页面 URL，不给仓库上下文：

```bash
scripts/agent-runtime/run-codex-eval.sh \
  --case usenavigate-blank \
  --round baseline \
  --access-mode black-box
```

真实页面或登录态页面如果源码入口不在首批 demo 目录下，建议显式传 `--case-dir`：

```bash
scripts/agent-runtime/run-codex-eval.sh \
  --case some-real-page \
  --round baseline \
  --url <target_url> \
  --mode real-page \
  --case-dir <source_entry_dir>
```

如果没有传 `--case-dir`，且 `--case` 能匹配到首批 demo 目录，脚本会自动使用对应 demo 目录作为入口。

每次执行会生成一个结果目录：

```txt
docs/agent-runtime/evaluation-results/<timestamp>-<round>-<case>/
```

目录里包含：

- `prompt.txt`：实际发给 Codex 的 prompt。
- `answer.md`：Codex 最终回答。
- `events.jsonl`：Codex 执行事件。
- `metadata.md`：case、round、URL、分支、commit、耗时等信息。

## 测试轮次

每个 case 至少跑两轮。

| 轮次 | 能力状态 | 允许使用的手段 | 目的 |
| --- | --- | --- | --- |
| Baseline | 未接入 Agent Runtime | 页面、console、network、人工提供的必要环境信息；是否允许读源码由 `access_mode` 决定 | 记录当前 Agent 靠外部信号排查的表现 |
| Runtime | 接入 Agent Runtime 后 | Baseline 手段 + snapshot / events / actions / ready / blockers | 记录结构化运行态是否提升排查效率和自动化程度 |

两轮测试必须尽量保持一致：

- 使用同一个 case。
- 使用同一个入口 URL。
- 使用同一个复现顺序。
- 使用同一类 Agent prompt。
- 不在 prompt 中提前暴露预期根因。
- 每个 case 使用独立上下文，避免前一个 case 的结论污染下一个 case。

## 上下文隔离

测试要分清“测试执行者”和“被测 Agent”。

- 测试执行者可以阅读本流程、demo README 和预期结果，用来准备环境和评分。
- 被测 Agent 只应该收到目标页面、任务要求和允许操作，不应该收到预期根因。
- 如果要测黑盒调试能力，被测 Agent 不应该读取 demo README、评估流程、源码或历史结果。
- 如果要测仓库辅助调试能力，被测 Agent 可以读当前 case 的源码，但仍不应该读取评估答案、历史结果或人整理好的 case 结论。
- 每次报告里需要注明本次是 `black-box` 还是 `repo-assisted`。

建议默认跑 `repo-assisted`，因为真实开发排查通常需要结合源码。为了避免上下文过大或提前看到答案，脚本默认会把源码入口限制到当前 demo case 目录。`black-box` 可以作为补充，用来单独评估 Runtime 对纯页面观测的提升。

## 执行前准备

每轮测试前记录：

| 字段 | 说明 |
| --- | --- |
| `round` | `baseline` 或 `runtime` |
| `case_id` | demo 名称或 oncall case 文件名 |
| `branch` | 当前 git 分支 |
| `commit` | 当前 git commit |
| `mode` | `local-demo`、`login-page`、`real-page` |
| `access_mode` | `black-box` 或 `repo-assisted` |
| `case_dir` | repo-assisted 模式下的源码入口目录 |
| `provider_command` | provider 启动命令 |
| `consumer_command` | consumer 启动命令 |
| `target_url` | Agent 需要打开的页面 |
| `expected_layer` | 只记录在结果表中，不放进 Agent prompt |

如果 case 依赖登录态，测试人员只负责准备登录环境，不直接提示问题根因。登录态准备也要记录为人工辅助。

## Agent Prompt 规则

Prompt 应只描述目标，不暴露预期结论。

推荐模板：

```txt
请打开下面页面并判断它是否按预期工作。

页面地址：<target_url>
目标：复现页面问题，判断页面卡在哪一层，并给出可验证证据。

要求：
1. 你可以打开页面、点击页面上的复现按钮、查看控制台和运行状态。
2. 不要只说页面报错，要判断问题属于 route、loader、MF、Garfish、React 渲染、业务 ready 或其他层级。
3. 如果需要人工辅助，请明确说明需要什么信息，并继续记录当前已经确认的证据。
4. 最后给出结论、证据和剩余不确定点。
```

接入 Agent Runtime 后，增加一句：

```txt
如果页面提供 Agent Runtime 能力，请优先使用 snapshot、events、ready、blockers 和 actions 来判断状态。
```

## 计时规则

计时从 Agent 收到 case prompt 后开始。

| 时间点 | 含义 |
| --- | --- |
| `t0_started` | Agent 收到 prompt，开始执行 |
| `t1_page_opened` | 首次打开目标页面 |
| `t2_issue_reproduced` | 首次确认问题现象已复现 |
| `t3_layer_identified` | 首次判断出问题所属层级 |
| `t4_evidence_collected` | 首次拿到足够支撑结论的证据 |
| `t5_final_answered` | 输出最终结论 |

核心耗时：

| 指标 | 计算方式 |
| --- | --- |
| 页面打开耗时 | `t1_page_opened - t0_started` |
| 复现耗时 | `t2_issue_reproduced - t0_started` |
| 分层判断耗时 | `t3_layer_identified - t0_started` |
| 证据收集耗时 | `t4_evidence_collected - t0_started` |
| 总耗时 | `t5_final_answered - t0_started` |

如果某个时间点无法达成，记录为 `not reached`，不要用最终时间硬填。

## 人工辅助分级

有些 case 当前需要人辅助排查。测试时不要忽略这件事，而是把它量化。

| 等级 | 含义 | 示例 |
| --- | --- | --- |
| H0 | 无人工辅助 | Agent 自己完成打开、复现、判断和取证 |
| H1 | 环境辅助 | 人只负责登录、启动服务、提供账号状态 |
| H2 | 操作辅助 | 人需要告诉 Agent 点哪个按钮、切哪个路由、按什么顺序复现 |
| H3 | 观测辅助 | 人需要提供 console、network、截图、日志等运行证据 |
| H4 | 判断辅助 | 人直接提示根因方向或关键代码位置 |

目标是：

- Baseline 允许出现 H2 / H3 / H4。
- Runtime 后理想状态是降到 H0 或 H1。
- 依赖登录态的真实页面可以保留 H1，但不应该继续依赖 H2 / H3 / H4。

## 自动化程度评分

每个 case 最后给一个自动化评分。

| 分数 | 含义 |
| --- | --- |
| A0 | 无法打开或无法复现 |
| A1 | 能复现现象，但无法判断层级 |
| A2 | 能判断层级，但证据不足 |
| A3 | 能判断层级，并给出可验证证据 |
| A4 | 能自动执行复现动作、等待状态变化、给出结论和证据 |

第一阶段目标：

- 6 个 demo 至少达到 A3。
- 有页面动作的 demo 目标达到 A4。
- 登录态真实页面至少减少 H2 / H3 / H4 类型辅助。

## 结果记录模板

脚本每次执行都会创建一个结果目录：

```txt
docs/agent-runtime/evaluation-results/<timestamp>-<round>-<case>/
```

其中 `metadata.md`、`prompt.txt`、`answer.md` 和 `events.jsonl` 会由脚本自动生成。如果需要人工复盘，可以在同一个目录下补充 `summary.md`。

`summary.md` 建议使用下面格式：

```md
## <case_id>

| 字段 | 结果 |
| --- | --- |
| round | baseline / runtime |
| target_url |  |
| expected_layer |  |
| detected_layer |  |
| access_mode | black-box / repo-assisted |
| case_dir |  |
| automation_score | A0 / A1 / A2 / A3 / A4 |
| human_help_level | H0 / H1 / H2 / H3 / H4 |
| page_open_time |  |
| reproduce_time |  |
| layer_identify_time |  |
| evidence_time |  |
| total_time |  |
| result | pass / partial / fail |

### Agent 结论

记录 Agent 最终判断。

### 证据

记录页面现象、console、network、snapshot、events、blockers、截图或日志。

### 人工辅助

记录人提供了什么信息，以及如果接入 Runtime 后是否应该自动完成。

### 复盘

- 判断是否正确：
- 慢在哪一步：
- 缺少什么结构化信号：
- 接入 Agent Runtime 后预期如何改善：
```

## 通过标准

单个 case 的 `pass` 标准：

1. 能复现问题，或明确说明为什么当前环境无法复现。
2. 能判断问题所属层级。
3. 能给出支撑结论的证据。
4. 不把 remote 加载成功误判成页面业务可用。
5. 如果页面没有 ready，能说明 blocker，而不是只说 timeout。

整轮测试的通过标准：

1. 6 个 demo 都有结果记录。
2. 每个 demo 都有耗时数据。
3. 每个 demo 都有自动化评分和人工辅助等级。
4. Runtime 轮次相比 baseline 至少能减少人工辅助或缩短判断耗时。
5. 对未改善的 case，能明确缺少哪类 runtime 信号。

## 对比报告

完成 baseline 和 Runtime 两轮后，输出汇总表：

| Case | Baseline score | Runtime score | Baseline help | Runtime help | Baseline total | Runtime total | 是否改善 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `react-multi-version` |  |  |  |  |  |  |  |
| `nested-router-tree` |  |  |  |  |  |  |  |
| `async-chunk-runtime` |  |  |  |  |  |  |  |
| `garfish-provider` |  |  |  |  |  |  |  |
| `redirect-loader` |  |  |  |  |  |  |  |
| `usenavigate-blank` |  |  |  |  |  |  |  |

汇总结论需要回答：

1. 哪些 case 已经能全自动完成。
2. 哪些 case 仍然需要人工辅助。
3. 人工辅助卡在哪一类：环境、操作、观测还是判断。
4. Agent Runtime 新增了哪些有效证据。
5. 下一阶段应该补哪些 API 或事件。
