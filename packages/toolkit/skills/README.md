# @modern-js/skills

把 Modern.js 官方 **Agent Skills** 显式安装到你项目的 AI Agent 目录（Claude Code / Codex / Cursor）。零依赖，`npx` 直接用。

> 设计原则：**默认不强装、不隐式安装、不拉外部代码** —— 由你显式 `add`。Skill 只是被复制进你选择的 Agent 目录。

## 用法

```bash
# 列出可安装的 Skills
npx @modern-js/skills list

# 安装一个 Skill 到 Agent 目录（默认安装到全部受支持的 Agent）
npx @modern-js/skills add modernjs-dependency-audit

# 指定目标 Agent 与项目根
npx @modern-js/skills add modernjs-dependency-audit --target=claude --dir=.
```

`--target`：`claude`（→ `.claude/skills/`）、`codex`（→ `.agents/skills/`）、`cursor`（→ `.cursor/skills/`）、`all`（默认）。

## 当前可安装的 Skills

| Skill | 说明 |
|---|---|
| `modernjs-migrate-to-v3` | v2 → v3 迁移：扫描产出 context.json + 迁移清单（自动/半自动/人工分类），安全改写 import 路径映射 |
| `modernjs-dependency-audit` | 依赖体检：幽灵依赖、循环依赖、重复多版本、安装体积归因 |

> 更多 Skill（`modernjs-feature-enable`、`modernjs-issue-triage` 等）实现中，完成后会加入此包。

## 与仓库内 source of truth 的关系

Skill 的唯一手写源在 Modern.js 仓库的 `skills/{maintainer,user}/*`；本包在发布时把**用户向** Skill 打包进 `skills/`（构建期同步，避免两份漂移）。`.claude/skills`、`.agents/skills`、`.cursor/skills` 是安装产物，不是手写源。
