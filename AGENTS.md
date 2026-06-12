# AGENTS.md — Modern.js monorepo

> 给在本仓库工作的 AI Agent（Claude Code / Cursor 等）的常驻指引。保持精简：只放命令、约束、路由。详细知识查文档与 llms.txt，复杂流程走 `skills/`。

## 这是什么仓库
- Modern.js：基于 React 的渐进式 Web 框架（当前主仓为 **v3**）。
- pnpm + nx monorepo。包的划分见 `pnpm-workspace.yaml`，主要分区：
  - `packages/solutions/app-tools` — 应用工程方案（高风险区）
  - `packages/cli/*` — 构建器与 CLI 插件（builder 等，高风险区）
  - `packages/runtime/*` — 运行时（高风险区）
  - `packages/server/*` — 服务端 / BFF（高风险区）
  - `packages/toolkit/*` — 工具库（含 `create` 脚手架）
  - `packages/document` — 文档站（rspress，产出 llms.txt）

## 常用命令
- 安装依赖：`pnpm install`
- 构建单包：`pnpm --filter <pkg> build`
- 跑测试：`pnpm --filter <pkg> test`（或包内 `rstest`）
- 代码风格：`biome`（见 `biome.json`），提交前跑 lint。
- 变更需 changeset：`pnpm change`（影响发布的改动必须加）。

## 禁改区（除非任务明确要求并人工确认）
- 不手改 `pnpm-lock.yaml`、`dist/`、`node_modules/`、各包 `CHANGELOG.md`。
- 不改框架运行时语义而不加测试。
- 不提交 secret / token。

## 查文档（知识检索）
- API / 配置 / 概念问题优先查 llms.txt：https://modernjs.dev/llms.txt
- 全文（体积大，按需取片段）：https://modernjs.dev/llms-full.txt
- 回答须匹配仓库当前版本，勿用更新版本未发布的特性。

## 复杂流程（走 Skills）
- 两类 Skill 分两处源，别混（详见 `skills/README.md`）：
  - **用户向**（服务「用 Modern.js 开发应用」的 agent）：唯一手写源是仓库根 `skills/<name>/`（带 SKILL.md 的目录），遵循 Agent Skills 开放标准，用户用标准 `npx skills add web-infra-dev/modern.js --skill <name>` 安装（锁版本加 `#<tag>`）。已落地 `modernjs-migrate-to-v3`、`modernjs-feature-enable`。
  - **维护者向**（服务「开发 Modern.js 仓库」的 agent）：唯一手写源是 `scripts/skills/<name>/`，**不放在根 `skills/`**（避免被对外 `skills` CLI 默认发现）；`.claude/skills`、`.agents/skills`、`.cursor/skills` 只是 `pnpm sync:skills` 生成的镜像（派生物，已 gitignore）。已落地 `dependency-audit`；规划中（P1+）`modernjs-issue-triage`、`modernjs-pr-review`。
- Skills 默认不强装、不隐式安装；只在多步骤 + 可验证 + 高频场景才做成 Skill，其余沉淀进本文件或文档。

## AGENTS / llms.txt / Skills 边界（一句话）
- llms.txt = 知识（厚、自动生成）；AGENTS.md = 约束与路由（薄、常驻）；Skills = 可验证的多步骤流程（带脚本/状态）。
