# AGENTS.md — Modern.js monorepo

> 给在本仓库工作的 AI Agent 的常驻指引：开发命令、修改约束和维护者工作流入口。

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
- 跑测试（按类型分别跑）：
  - 单测（rstest）：根目录 `pnpm test:ut`，或单包 `pnpm --filter <pkg> test`（包内即 `rstest`）。
  - 框架集成测试：`pnpm test:framework`（实际在 `tests/` 下跑 rstest 集成用例）。
  - 构建器（builder）e2e 测试：`pnpm test:builder`（在 `tests/e2e/builder` 下）。
  - Skill 回归：`node tests/skill/run.mjs`（migrate-to-v3）、`node tests/skill/migrate-tsconfig.mjs`（migrate-tsconfig）、`node tests/skill/feature-enable.mjs`（feature-enable）。
- 代码与格式检查：`pnpm check`（Rstack CLI，见 `rstack.config.mts`）。仅代码校验：`pnpm lint`。
- 全仓格式化：`pnpm format`
- 变更需 changeset：`pnpm change`（影响发布的改动必须加）。

## 禁改区（除非任务明确要求并人工确认）

- 不手改 `pnpm-lock.yaml`、`dist/`、`node_modules/`、各包 `CHANGELOG.md`。
- `tests/integration` 顶层目录的冻结基线以[集成目录清单](scripts/test-governance/integration-allowlist.json)为准。修改清单须经维护者人工批准。
- 不在缺少验证证据时修改框架运行时语义。优先复用现有测试或临时验证，不机械新增测试文件。
- 不提交 secret / token。

## 测试贡献与治理

- 默认不新增测试文件或 fixtures。先复用已有用例，或通过临时脚本、手动黑盒验证提供证据，并在 PR 中记录命令、结果及未执行项。
- 行内例外须经维护者人工批准，agent 不得自行批准。
- 运行 `pnpm check-test-governance` 验证变更。详细规则、命令选项、例外格式和 CI 流程见[测试治理说明](scripts/test-governance/README.md)。

## 查文档（知识检索）

- API / 配置 / 概念问题优先查 llms.txt：https://modernjs.dev/llms.txt
- 全文（体积大，按需取片段）：https://modernjs.dev/llms-full.txt
- 回答须匹配仓库当前版本，勿用更新版本未发布的特性。

## 文档写作

- 新增或修改文档时，不使用英文分号。使用中文分号 `；`、句号 `。` 或有序／无序列表表达。

## 维护者工作流

- 环境搭建与开发流程：见[贡献指南](packages/document/docs/zh/community/contributing-guide.mdx)。
- 提交 PR：遵循 [PR 模板](.github/PULL_REQUEST_TEMPLATE.md)，说明改动、关联 issue 和验证结果。涉及用户行为或 API 的改动同步更新文档。提交信息和 PR 标题遵循 Conventional Commits。
- 依赖排查：使用 [dependency-audit](.agents/skills/dependency-audit/SKILL.md)。
