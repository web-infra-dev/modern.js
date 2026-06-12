# Skill Test Fixtures

这些目录是 `tests/skill/run.mjs` 和 `tests/skill/feature-enable.mjs` 的固定输入样例。测试会把 fixture 复制到临时目录，再运行 skill 脚本并断言结果；fixture 本身不是运行产物，也不会参与 workspace 安装。

## 为什么需要提交

- **迁移类 skill 靠结构输入防回归**：例如 `pages` 到 `routes`、`runtime` 冲突、workspace 协议、自定义 server、Tailwind import、BFF 导出形态等问题，只有真实文件结构才能稳定复现。
- **每个 fixture 对应一个已发现的风险点**：目录名里的 `edge`、`real`、`conflict`、`half` 等词表示它覆盖的行为边界。删掉 fixture 会让对应回归只剩人工记忆。
- **体积受控**：当前 fixture 只保留最小源码、配置和 `PROVENANCE.md`，不提交 `node_modules`、`dist`、`.modern`、`.agents/runs` 等生成物。

## 新增准入

新增 fixture 前先确认：

1. 这个场景不能用现有 fixture 表达，且对应一个明确 bug、验收点或历史回归。
2. 只保留复现所需的最少文件；不要复制完整应用。
3. 不提交安装产物、构建产物、运行报告或本地 agent 产物。
4. 如果 fixture 裁剪自真实项目或生成器输出，补 `PROVENANCE.md` 说明来源与裁剪范围。

## Reviewer 口径

这些 fixture 是测试输入，性质类似 parser/compiler 的 golden cases。数量多是因为 skill 的风险来自项目形态差异，而不是单个函数分支；保留它们可以把用户实测问题固化成可重复验证的回归用例。
