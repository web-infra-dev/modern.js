# Modern.js Skills

本目录承载 Modern.js 官方的 **Agent Skills**：面向 AI Agent 的、可触发的多步骤流程（程序性知识 + 脚本 + 状态）。

> 当前为 **P0 占位**：本目录只定义结构、分类与分发设计，**尚未落地任何 Skill 实现**（P1 实现首批）。

## 边界：Skills / AGENTS.md / llms.txt

| 资产 | 职责 | source of truth |
|---|---|---|
| `llms.txt` | 知识索引（厚、自动生成） | 文档站（rspress `@rspress/plugin-llms`） |
| `AGENTS.md` | 项目约束 + 路由（薄、常驻） | 仓库根 `AGENTS.md`（维护者向） |
| **Skills** | 可验证的多步骤流程 | 本目录 `skills/maintainer/*`、`skills/user/*` |

判定法则：**多步骤 + 需脚本/判断/状态 + 高频痛点**三条都满足才做成 Skill；否则沉淀进 `AGENTS.md` 或文档。**不滥造 Skill。**

## 两类 Skills，不要混

### 1. 维护者向（maintainer）—— 服务「开发 Modern.js 仓库」的 agent

- **source of truth**：`skills/maintainer/<skill>/SKILL.md` + `references/` + `scripts/`（单一手写源）。
- **工具目录是派生产物**：`.claude/skills/`（Claude Code）、`.agents/skills/`（Codex）等只作为**同步/软链镜像**，由脚本从 `skills/maintainer/*` 生成，**不作为手写源**（避免两份正文漂移）。这些目录在 `.gitignore` 中（派生物不入库）。
- **路由**：仓库根 `AGENTS.md` 负责告诉 agent 何时用哪个 maintainer skill + 验证命令。
- 规划中（P1+）：`modernjs-issue-triage`、`modernjs-dependency-audit`、`modernjs-pr-review`、`modernjs-test-selector`。

```
skills/maintainer/<skill>/        # 唯一手写源
  SKILL.md  references/  scripts/
        │  同步脚本（生成/软链）
        ▼
.claude/skills/<skill>/   .agents/skills/<skill>/   # 派生镜像，.gitignore 忽略
```

### 2. 用户向（user）—— 服务「用 Modern.js 开发应用」的 agent

- **source of truth**：`skills/user/<skill>/...`（或独立 repo），发布时打包成可分发包 **`@modern-js/skills`**（或 marketplace）。
- **不藏在仓库内部目录、不靠 `@modern-js/create` 隐式安装**。
- **用户显式安装**（P1 提供 CLI）：

  ```bash
  npx @modern-js/skills list                       # 列出可装 skill
  npx @modern-js/skills add modernjs-migrate-to-v3 # 安装单个 skill
  # 支持 --target=claude|codex|cursor|all
  ```
- 规划中（P1+）：`modernjs-migrate-to-v3`、`modernjs-feature-enable`、（用户侧）`modernjs-dependency-audit`。

## 目录约定（实现后）

每个 Skill 遵循 [Agent Skills 开放标准](https://github.com/vercel-labs/next-skills)：

```
skills/<maintainer|user>/<skill-name>/
  SKILL.md        # frontmatter: name / description / user-invocable
  references/     # 版本化参考资料（如 v2→v3 breaking changes）
  scripts/        # 可执行脚本（AST codemod / 检测器等）
```

## 与 create 的关系

`@modern-js/create` **不生成** AGENTS.md/CLAUDE.md（AGENTS.md 是仓库维护用的内部资产，不属于用户项目），也**不安装 Skills**。用户侧 skill 走显式入口（`npx @modern-js/skills list/add`）。
