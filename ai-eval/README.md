# Modern.js AI 基建 — 最小 eval

复测 Modern.js AI 基建（AGENTS.md / llms.txt / Skills）的收益，**用 Modern.js 自己的 A/B 数据说话，不照搬 EdenX 的 14PP**。

## 三组 A/B 条件

见 [`groups.json`](./groups.json)：

| group | 条件 |
|---|---|
| `baseline` | 无基建 |
| `agents-llms` | AGENTS.md + llms.txt |
| `agents-llms-skills` | AGENTS.md + llms.txt + Skills |

## 任务集

见 [`tasks/`](./tasks)，每个任务定义 `prompt` / `fixture` / `successCriteria` / 要记录的 `record` 指标。当前样例：

- `docs-qa-bff` — 文档问答（BFF 写法）
- `dependency-audit-phantom` — 依赖问题（幽灵依赖定位）
- `migrate-pages-to-routes` — 迁移（pages → routes，保守改写）

## 运行

```bash
# 展开全部 group × task，生成运行矩阵与结果路径
node ai-eval/run.mjs

# 只跑部分
node ai-eval/run.mjs --groups=baseline,agents-llms --tasks=docs-qa-bff

# 接入真实 Agent 后，合并实测指标得到三组对比
node ai-eval/run.mjs --scores=scores.json
```

输出目录默认 `ai-eval/results/<时间戳>/`：

```
results/<时间戳>/
  <group>/<taskId>.json   # 每个 cell 的结果（pending / measured + 指标）
  summary.json            # 运行矩阵 + 按 group 的指标聚合对比
```

## 指标

`taskPass`、`firstBuildPass`、`firstLintPass`、`firstTestPass`、`wrongTestScope`、`manualItemAccuracy`、`durationMs`、`tokens`。

## P0 边界说明

本目录是 **P0 脚手架**：提供可执行入口、任务定义、三组 A/B 输出路径与汇总打分。

真正驱动 Agent 执行的部分用可插拔 adapter 接入（默认 `manual`：落盘待填 prompt 与评分模板）。P1 起接入 CI 与真实 Agent runner，节奏为：skill/reference 改动跑 quick eval，发布前跑 standard / full eval。
