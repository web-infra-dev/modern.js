# 测试治理

用于校验 `tests/integration` 冻结清单，并拦截测试代码中的明确反模式。测试编写与保留原则见[贡献指南](../../packages/document/docs/zh/community/contributing-guide.mdx#验证变更与保留回归测试)。

## 用法

在仓库根目录运行：

```sh
pnpm check-test-governance
pnpm check-test-governance --staged
pnpm check-test-governance --base origin/main --head HEAD
TEST_GOVERNANCE_PR_LABELS='["approved-new-integration-fixture"]' pnpm check-test-governance --base origin/main --head HEAD --require-approval
pnpm check-test-governance --help
```

| 参数                    | 说明                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| 无参数（默认）          | 检查工作区（HEAD 与暂存、未暂存、未跟踪变更）及本地集成目录             |
| `--staged`              | 仅检查 Git 暂存区快照，未暂存的修改不生效                               |
| `--base REV --head REV` | 比较两个 Git commit，不依赖工作区内容（省略 `--head` 时默认为 `HEAD`）  |
| `--require-approval`    | 读取环境变量 `TEST_GOVERNANCE_PR_LABELS`（JSON 数组），校验清单新增审批 |
| `--json`                | 输出结构化 JSON 结果                                                    |

- `--staged` 不能与 `--base`、`--head` 同时使用，使用 `--base` 前需确保本地已拉取对应 Git 历史。
- 输出摘要中，`packageFiles` 为 `packages/` 全量扫描的文件数，`files` 和 `lines` 为包外增量检查的文件数和新增行数。

## 检查范围与规则

- **扫描范围**：`packages/` 下无论 diff 是否为空，都会对目标快照中的全部测试及测试辅助文件做全量检查；`packages/` 之外（如 `tests/e2e/builder/`、`examples/`）仅检查 diff 新增行，不阻断未触及的历史代码。
- **文件匹配**：匹配 `.test` / `.spec` 的 JS/TS 文件、`__tests__/`，以及 `packages/` 或 `scripts/` 下 `tests/` 中的辅助代码，统一排除 `fixture/`、`fixtures/` 和 `node_modules/`。

| 规则                    | 检查内容                                             | 生效范围                                    |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------- |
| `integration-fixture`   | 集成目录必须在 `integration-allowlist.json` 中       | 所选模式的全部 `tests/integration` 顶层目录 |
| `allowlist-approval`    | 清单新增条目必须带有审批标签                         | 仅在启用 `--require-approval` 时            |
| `internal-src-import`   | 禁止相对路径绕过公开入口直接导入包内 `src/`          | `packages/` 全量                            |
| `internal-module-mock`  | 禁止对内部相对路径模块使用 `rs.mock` / `rstest.mock` | `packages/` 全量，包外增量                  |
| `invocation-call-order` | 禁止断言 `invocationCallOrder` 实现细节              | `packages/` 全量，包外增量                  |
| `non-rstest-runner`     | 禁止引入 Rstest 之外的测试框架                       | `packages/` 全量，包外增量                  |
| `invalid-exception`     | 校验行内例外注释的格式与有效期                       | `packages/` 全量，包外增量                  |

关于 `internal-src-import`：检查器按包的 `package.json`（`exports` 和 `main`）识别公开入口，无需预构建；跨包需通过包名和公开子路径导入，同一测试目录内允许相对导入辅助代码。若公开入口和现有 `tests/integration/` 均无法覆盖内部细节，应在 PR 中记录临时验证证据，不要为此提交内部单测或扩大包导出。

测试必要性、重复覆盖、快照粒度等质量判断由人工 review 把关，不作自动阻断。

## 审批与豁免

> 贡献者与 agent 均不得自行修改集成目录清单，也不得自批、伪造或机械延长行内例外。本地设置 `TEST_GOVERNANCE_PR_LABELS` 仅用于验证脚本行为，不代表人工批准。

### 新增集成目录

`tests/integration` 顶层目录的冻结基线见 [integration-allowlist.json](./integration-allowlist.json)（按名称排序的 JSON 字符串数组）。工具不会删除现有 fixture。

确需新增目录时：

1. 说明现有 fixture 为何不足及新增维护成本，取得维护者人工批准。
2. 将目录名按排序加入 `integration-allowlist.json`，并在 PR 中记录理由与批准者。
3. 由维护者为 PR 添加 `approved-new-integration-fixture` 标签（纯条目删除无需该标签）。

### 行内例外

确实无法避免某条反模式时，取得维护者人工批准后，在违规表达式所在行添加单行注释：

```text
// test-governance-allow: <rule> | reason: <why> | expires: YYYY-MM-DD | approved-by: @<handle>
```

- `<rule>` 必须是上表中的反模式规则 ID 之一（行内例外不适用于集成目录清单）。
- 注释必须位于违规表达式所在行（多行表达式可放在其中任一受检行），前置独立注释不生效。
- `reason` 需说明必要性与后续移除方案，`expires` 必须为有效且未过期的日期，`approved-by` 必须为实际人工批准者。

## Hooks 与 CI

- 本地通过 `pnpm check-test-governance` 调用，启用仓库 Git hooks 后，提交阶段会自动运行 `--staged` 检查。
- CI 在 PR、merge queue 和手动触发场景下使用 `--base` / `--head` 比较对应提交，其中仅 PR 启用 `--require-approval`，并在标签变更时重新触发检查。
