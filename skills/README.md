# Modern.js Skills（用户向）

本目录存放 Modern.js 官方面向**用户**的 **Agent Skills**：给 AI Agent（Claude Code / Codex / Cursor 等）读取的可触发工作流，核心是 `SKILL.md`，可附带 `scripts/`、`references/`。遵循 [Agent Skills 开放标准](https://github.com/vercel-labs/skills)。

## 已落地

- `modernjs-migrate-to-v3` —— Modern.js v2 → v3 迁移
- `modernjs-feature-enable` —— 为 v3 应用启用 BFF / SSG / styled-components / Tailwind / 自定义 Web Server

## 安装

仓库根 `skills/` 就是标准 `skills` CLI 默认发现的位置，直接从 GitHub 安装：

```bash
# 列出可安装的 Skills
npx skills add web-infra-dev/modern.js --list

# 安装单个 Skill（--agent 可选 claude-code / codex / cursor）
npx skills add web-infra-dev/modern.js --skill modernjs-migrate-to-v3 --agent codex -y
```

锁版本：在仓库后加 `#<tag>`（含本 Skill 的发布 tag / 分支 / commit），如
`npx skills add web-infra-dev/modern.js#<tag> --skill modernjs-migrate-to-v3`。

> 维护者内部 Skill（服务「开发 Modern.js 仓库」的 agent，如 `dependency-audit`）不在这里，放在 `scripts/skills/`，由 `pnpm sync:skills` 同步到本地 Agent 目录。
