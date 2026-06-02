# Modern.js Skills

本目录承载 Modern.js 官方的 **Agent Skills**：面向 AI Agent 的、可触发的多步骤流程（程序性知识 + 脚本 + 状态）。

> 当前为 **P0 占位**：本目录只定义结构、规划与选装机制，**尚未落地任何 Skill 实现**。P1 才会实现首批 Skill。

## 为什么需要 Skills（与 AGENTS.md / llms.txt 的边界）

| 资产 | 职责 | 何时用 |
|---|---|---|
| `llms.txt` | 知识索引（厚、自动生成） | 查 API / 配置 / 概念 |
| `AGENTS.md` | 项目约束 + 路由（薄、常驻） | "在这个项目里要遵守什么、去哪找" |
| **Skills** | 可验证的多步骤流程（带脚本/状态） | "怎么一步步做完并验证"（迁移、体检、issue 分诊） |

判定法则：**多步骤 + 需脚本/判断/状态 + 高频痛点**三条都满足才做成 Skill；否则沉淀进 `AGENTS.md` 或文档。**不滥造 Skill。**

## 规划中的 Skills（尚未实现）

### P1（首批高价值）
- `modernjs-migrate-to-v3` — 用户向：Modern.js 应用 v2 → v3 迁移。首版只做**安全改写**；`pages → routes`、custom server 做检测 + 简单安全改写，复杂项进**人工清单**；强制产出 `context.json` + 报告。
- `modernjs-dependency-audit` — 维护者/用户共用：循环依赖、幽灵依赖、重复版本、peer/dev/prod 放置、exports/types、安装体积与耗时归因。
- `modernjs-issue-triage` — 维护者向：读 issue → 分类到 app-tools/builder/runtime/server/docs/tests → 判断是否缺复现 → 生成最小复现建议、标签、回复草稿。

### P2（后续）
- `modernjs-test-selector` / `modernjs-pr-review` — 维护者向。
- `modernjs-feature-enable` — 用户向：按需启用 BFF / SSG / RSC / Tailwind / Module Federation / Arco·Antd transformImport。
- `modernjs-best-practices` — **背景辅助**定位，核心防错仍放 AGENTS + docs index，**不作默认强依赖**。

## 安装与选装约定

- Skills **默认不强装、不隐式安装**。
- 通过 `@modern-js/create` 的 `--skills=none|recommended|custom` 选择（默认 `recommended`：只**展示推荐清单并要求确认**，不自动安装）。
- 计划提供独立安装入口（P1 起）：`npx @modern-js/skills add <skill>`。

## 目录约定（实现后）

每个 Skill 遵循 Agent Skills 开放标准：

```
skills/<skill-name>/
  SKILL.md        # frontmatter: name / description / user-invocable
  references/     # 版本化的参考资料（如 v2→v3 breaking changes）
  scripts/        # 可执行脚本（AST codemod / 检测器等）
```
