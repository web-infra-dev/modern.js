# 测试治理

此工具冻结已批准的集成目录并阻止本次变更新增的明确反模式，不删除现有测试或 fixture，不改变发布包行为，无需 changeset。

默认不新增测试文件或 fixtures。优先复用已有用例或临时黑盒验证，在 PR 记录命令、结果及未执行项。永久测试只保护现有覆盖不足的明确用户行为或公共契约。不要逐层 mock 重复集成流程，不通过收紧 TypeScript 类型替代验证。纯逻辑优先轻量输入输出测试，快照只保护稳定用户输出或公共协议。测试贡献原则见[贡献指南](../../packages/document/docs/zh/community/contributing-guide.mdx#验证变更与保留回归测试)。

## CLI 与数据来源

在仓库根目录运行：

```sh
pnpm check-test-governance
pnpm check-test-governance --staged
pnpm check-test-governance --base origin/main --head HEAD
TEST_GOVERNANCE_PR_LABELS='["approved-new-integration-fixture"]' pnpm check-test-governance --base origin/main --head HEAD --require-approval
pnpm check-test-governance --help
```

| 模式                    | 检查数据来源                                                                |
| ----------------------- | --------------------------------------------------------------------------- |
| 默认工作区              | HEAD 与暂存、未暂存及未跟踪变更，同时检查文件系统中的集成目录               |
| `--staged`              | HEAD 与 Git index，文件内容及目录列表只来自 index，未暂存修复不能使检查通过 |
| `--base REV --head REV` | 两个 Git tree，不依赖工作区内容，省略 `--head` 时使用 HEAD                  |
| `--require-approval`    | 额外读取 `TEST_GOVERNANCE_PR_LABELS` 标签名 JSON 数组，校验清单新增审批     |

`--staged` 不与 `--base`、`--head` 混用。比较前确保已获取对应 Git 历史，可加 `--json` 获取结构化诊断。失败后根据输出的路径、行号和修复建议调整本次变更，再运行相同命令。本地设置标签变量仅验证检查行为，不代表人工批准。

## 规则

| 规则                                           | 自动执行范围                         |
| ---------------------------------------------- | ------------------------------------ |
| 集成目录必须在 `integration-allowlist.json` 中 | 检查所选模式的全部集成目录           |
| `internal-module-mock`                         | 增量阻止新增内部相对模块 mock        |
| `invocation-call-order`                        | 增量阻止新增内部调用顺序断言         |
| `non-rstest-runner`                            | 增量阻止新增非 Rstest runner         |
| 行内例外格式与到期日期                         | 只校验 diff 触及的测试行             |
| 清单新增条目的审批标签                         | PR CI 使用 `--require-approval` 校验 |

反模式检查覆盖 `.test`、`.spec` 的 JS/TS 文件变体、`__tests__`，以及 packages/scripts 下 tests 目录中的非 fixture 辅助代码。检查结合完整测试文件和 diff 触及的行识别多行写法，不因未触及的历史反模式阻塞无关改动。

测试必要性、重复覆盖、纯逻辑黑盒验证、快照公共性及类型契约由贡献者与维护者审核，不作为启发式自动阻断。没有快照禁令，也没有测试数量软告警。

## 冻结清单与人工审批

`tests/integration` 顶层目录的冻结基线以[集成目录清单](./integration-allowlist.json)为准。清单按名称排序，以 JSON 字符串数组保存维护者批准的目录名。不允许贡献者或 agent 自行扩展清单来绕过检查，也不授权删除现有 fixture。

确需新增目录时，先说明现有 fixture 为何不足及新增维护成本，取得维护者人工批准后，将批准目录加入排序清单，在 PR 记录理由和批准者，并由维护者添加 `approved-new-integration-fixture` 标签。任何清单新增条目都需要该标签，包括清单首次引入。纯条目删除不需扩展审批标签，但剩余目录仍必须登记。

## 行内例外

确实无法避免反模式时，先申请有明确理由、到期日期和人工批准者的短期例外，使用以下精确格式：

```text
// test-governance-allow: <rule> | reason: <why> | expires: YYYY-MM-DD | approved-by: @<handle>
```

`<rule>` 必须是上表中的三个反模式标识之一。注释放在违规表达式同一行，或该多行表达式内被 diff 触及的行，独立的前置注释不豁免下一行。理由应说明必要性和后续移除方案，日期必须有效且未过期，账号必须是实际人工批准者。

checker 只校验 diff 触及的测试行中的例外格式和到期日期，真实批准由维护者审核。agent 不得自批、伪造批准或机械延长日期。行内例外不批准新增集成目录。

## 提交与 CI

- 根脚本直接运行 `node ./scripts/test-governance/check.mjs`，所有入口使用同一个 checker，无新增依赖。
- 启用仓库 hooks 后，`rs staged` 使用函数任务运行相同命令并加 `--staged`，不追加文件名，checker 自行读取全部 index 变更。lint-staged 跳过仅删除的提交，`rstack.config.mts` 在该情况下调用同一个 staged 检查。
- Linux lint 工作流保留现有任务并获取完整历史，使用 `--base SHA --head SHA`。PR 比较 base 与 checkout 的合并候选提交，并要求审批标签，避免落后分支缺少新清单或把 main 已完成的清理算作新增反模式。merge queue 比较 merge group base/head，手动触发比较所选提交与父提交。仅 PR 加 `--require-approval`。
- CI 通过 `TEST_GOVERNANCE_PR_LABELS` 传入标签名 JSON 数组，不把标签内容当作 shell 命令执行。PR 添加或移除标签时重新检查。
