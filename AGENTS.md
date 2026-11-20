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
  - Skill 回归：`node tests/skill/run.mjs`（migrate-to-v3）、`node tests/skill/feature-enable.mjs`（feature-enable）。
- 代码与格式检查：`pnpm check`（Rstack CLI，见 `rstack.config.mts`）。仅代码校验：`pnpm lint`。
- 测试治理检查：`pnpm check-test-governance`，暂存区检查加 `--staged`，两个 Git tree 比较用 `--base REV --head REV`。
- 全仓格式化：`pnpm format`
- 变更需 changeset：`pnpm change`（影响发布的改动必须加）。

## 禁改区（除非任务明确要求并人工确认）

- 不手改 `pnpm-lock.yaml`、`dist/`、`node_modules/`、各包 `CHANGELOG.md`。
- 不未经维护者人工批准修改 `scripts/test-governance/integration-allowlist.json`。现有 52 个目录的冻结基线已获批准，后续扩展仍需单独审批。
- 不在缺少验证证据时修改框架运行时语义。优先复用现有测试或临时验证，不机械新增测试文件。
- 不提交 secret / token。

## 测试贡献与治理

- 默认不新增测试文件或 fixtures。先复用已有用例，或通过临时脚本、手动黑盒验证提供证据，并在 PR 中记录命令、结果及未执行项。
- 区分临时验证与永久回归测试。临时验证不必提交，永久测试只保留能保护明确用户行为或公共契约、且现有覆盖不足的用例，并说明理由。
- 不为已有集成流程编写逐层 mock 的重复单测。纯逻辑优先轻量黑盒测试，断言输入输出而非内部结构、调用次数或调用顺序。
- 不通过收紧 TypeScript 类型来替代测试或验证，也不为迎合测试而改变公共类型契约。
- 快照只保护稳定的用户输出或公共协议，不锁定内部实现细节。没有快照禁令，也没有测试数量软告警。
- `tests/integration` 冻结维护者批准的现有 52 个已跟踪目录，不删除已有 fixture。清单为 `scripts/test-governance/integration-allowlist.json`，格式是排序后的字符串 JSON 数组。不得自行扩展清单来绕过检查。
- 新增清单条目（包括清单首次引入）须经维护者人工批准，并在 PR 添加 `approved-new-integration-fixture` 标签。CI 在 PR 中通过 `--require-approval` 和 `TEST_GOVERNANCE_PR_LABELS` 标签名 JSON 数组校验。
- 行内例外需人工批准，格式必须为 `// test-governance-allow: <rule> | reason: <why> | expires: YYYY-MM-DD | approved-by: @<handle>`。仅 diff 触及的测试行校验例外格式和到期日期，agent 不能自批例外。

| 规则                                                                         | 执行者                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| 集成目录必须在冻结清单中，清单新增需批准                                     | `check-test-governance`，PR CI 审批标签门槛及维护者审核 |
| 新增内部相对模块 mock：`internal-module-mock`                                | `check-test-governance` 增量检查                        |
| 新增内部调用顺序断言：`invocation-call-order`                                | `check-test-governance` 增量检查                        |
| 新增非 Rstest runner：`non-rstest-runner`                                    | `check-test-governance` 增量检查                        |
| 触及的行内例外必须格式正确且未过期                                           | `check-test-governance` 增量检查，人工批准由维护者审核  |
| 默认不新增测试、避免重复覆盖、纯逻辑黑盒验证、公共快照、禁止收紧类型替代验证 | 贡献者、agent 及 PR 维护者审核，不作为启发式自动阻断    |

本地 `rs staged` 与 CI 使用同一 checker。`--staged` 只读 index，包含所有暂存的新增与删除，未暂存修复不能使检查通过。默认工作区模式比较 HEAD 与暂存、未暂存及未跟踪变更，并检查文件系统中的集成目录。历史反模式不阻塞无关改动，格式化后的多行新增反模式仍会检查。CLI 和例外流程见[测试治理说明](scripts/test-governance/README.md)。

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
