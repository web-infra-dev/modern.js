# Modern.js Skills（用户向）

本目录承载 Modern.js 官方面向**用户**（「用 Modern.js 开发应用」的 AI Agent）的 **Agent Skills**：可触发的多步骤流程（程序性知识 + 脚本 + 状态），遵循 [Agent Skills 开放标准](https://github.com/vercel-labs/skills)。

> 维护者内部 Skill（服务「开发 Modern.js 仓库本身」的 agent，如 `dependency-audit`）**不在这里**，放在 `scripts/skills/`，详见下文「两类 Skills」。

## 安装（用户）

仓库根 `skills/` 就是标准 `skills` CLI 能默认发现的位置，直接从 GitHub 安装：

```bash
npx skills add web-infra-dev/modern.js --list
npx skills add web-infra-dev/modern.js --skill modernjs-migrate-to-v3 --agent codex -y
```

整个 Skill 目录（`SKILL.md` + `scripts/` + `references/`）会被装进对应 Agent 目录。

锁版本：在仓库后加 `#<ref>`（`<ref>` 填某个含本 skills/ 的发布 tag / 分支 / commit），如 `npx skills add web-infra-dev/modern.js#<tag> --skill modernjs-migrate-to-v3`。

## 边界：Skills / AGENTS.md / llms.txt

| 资产 | 职责 | source of truth |
|---|---|---|
| `llms.txt` | 知识索引（厚、自动生成） | 文档站（rspress `@rspress/plugin-llms`） |
| `AGENTS.md` | 项目约束 + 路由（薄、常驻） | 仓库根 `AGENTS.md`（维护者向） |
| **Skills** | 可验证的多步骤流程 | 用户向：仓库根 `skills/*`（标准 `skills` CLI 消费）；维护者向：`scripts/skills/*` |

判定法则：**多步骤 + 需脚本/判断/状态 + 高频痛点**三条都满足才做成 Skill；否则沉淀进 `AGENTS.md` 或文档。**不滥造 Skill。**

## 两类 Skills，不要混

### 1. 用户向（user）—— 服务「用 Modern.js 开发应用」的 agent

- **source of truth**：仓库根 `skills/<skill>/`（`SKILL.md` + `references/` + `scripts/`，唯一手写源）。
- **分发**：标准 `skills` CLI 直接从 GitHub 装（上面「安装」），锁版本用 `#<ref>`。无自建分发包。
- 已落地：`modernjs-migrate-to-v3`、`modernjs-feature-enable`。

### 2. 维护者向（maintainer）—— 服务「开发 Modern.js 仓库」的 agent

- **source of truth**：`scripts/skills/<skill>/`（单一手写源）。**故意不放在仓库根 `skills/`**，这样对外 `skills` CLI 默认发现不到内部 skill。
- **工具目录是派生镜像**：`.claude/skills/`、`.agents/skills/`、`.cursor/skills/` 由 `pnpm sync:skills` 从 `scripts/skills/*` 生成（软链镜像，已 `.gitignore`，非手写源）。
- **路由**：仓库根 `AGENTS.md` 负责告诉 agent 何时用哪个 maintainer skill + 验证命令。
- 同步命令：
  ```bash
  pnpm sync:skills --target=codex
  pnpm sync:skills --target=all
  ```
- 已落地：`dependency-audit`。规划中（P1+）：`modernjs-issue-triage`、`modernjs-pr-review`、`modernjs-test-selector`。

```
skills/<skill>/                   # 用户向唯一手写源（仓库根，对外 skills CLI 消费）
  SKILL.md  references/  scripts/

scripts/skills/<skill>/           # 维护者内部唯一手写源（对外 CLI 默认不发现）
  SKILL.md  references/  scripts/
        │  pnpm sync:skills（生成软链）
        ▼
.claude/skills/<skill>/   .agents/skills/<skill>/   .cursor/skills/<skill>/   # 派生镜像，.gitignore 忽略
```

## 与 create 的关系

`@modern-js/create` **不生成** AGENTS.md/CLAUDE.md（AGENTS.md 是仓库维护用的内部资产，不属于用户项目），也**不安装 Skills**。用户侧 skill 走显式入口（`npx skills add web-infra-dev/modern.js --skill <name>`）。
