# 依赖检查

这是仓库内部使用的私有工具包。现有清单规则与新增源码检查独立运行，不会自动修改依赖声明。

## 命令

在仓库根目录运行：

```sh
pnpm check-dependencies
pnpm lint:package-json
pnpm check-source-dependencies
pnpm check-source-dependencies --staged
pnpm check-source-dependencies --json
```

- `check-dependencies` 保留原有版本一致性检查和用户示例豁免，同时从 `pnpm-workspace.yaml` 发现根目录 `examples/` 下的全部实际项目，包含嵌套 Module Federation 示例。示例的 Modern.js 安装依赖必须在 dependencies、devDependencies、optionalDependencies 中精确声明为 `latest`，第三方依赖和 peerDependencies 不受此规则限制，框架包和测试 fixtures 不作为用户示例检查。
- 示例包名必须被 `@examples/*` 匹配，且 `.changeset/config.json` 的 ignore 必须为 `["@examples/*"]`，避免额外的否定模式让示例逃逸。依赖诊断包含清单路径、依赖字段、包名、当前值和要求的 `latest` 值。检查不会在 bump 后修复或恢复清单。
- 清单检查保留原有 exports、workspace 协议及清单依赖环规则。
- 源码检查覆盖 pnpm workspace 中 `packages/**/src` 下的 JS、TS 和声明文件。测试、fixtures、templates、compiled、dist 不纳入本轮门禁，其他目录中的测试和脚本也不在扫描范围内。
- dependencies、devDependencies、peerDependencies、optionalDependencies 和包自身引用均视为已声明。类型引用可以由已声明的 `@types` 包提供。
- 根目录声明不能代替消费包的声明。配置好的本包路径别名不需要 npm 声明，跨包别名和跨包相对引用检查目标包关系。
- 未安装的外部包仍然检查声明。无法确定目标的本地路径或别名单独警告，不建议自动安装。

## 提交与持续集成

现有 pre-commit 在 `rs staged` 成功后运行一次 `--staged` 检查。必须先启用仓库 Git hooks 才会执行，工具不覆盖本机其他 hook 配置。

暂存区模式创建一个隔离的 Git index 快照，检查受影响包的完整源码。未暂存源码、清单和配置不能使检查通过。配置或根清单变化会扩大范围，删除和重命名同样触发。已安装外部依赖只读复用，workspace 链接指向暂存区快照。结束后删除工具自己创建的临时快照，不修改用户工作区或 Git index。

Lint 工作流运行全量源码依赖检查，无需先构建框架。现有 `rs staged` 的 package.json 任务与依赖检查工作流均调用 `pnpm check-dependencies`。依赖检查工作流覆盖目标为 `main` 和 `release-v3.12.0` 的 PR，并运行以下 Rstest 回归命令：

```sh
pnpm exec rstest run --config scripts/check-dependencies/rstest.config.mts
```

回归检查保护新增的示例依赖与发布契约，现有测试没有覆盖这些行为。测试在临时 workspace 使用真实 Changesets 配置及已安装 CLI，通过普通版本升级和 canary snapshot 验证框架升级、示例清单逐字节不变，并包含单独提议示例版本变更的 changeset，不新增永久 fixtures。

退出码：0 表示没有声明错误，1 表示发现未声明依赖，2 表示配置、Git 或解析执行失败。JSON 输出包含范围、耗时和诊断，不包含自动修复或依赖归属建议。
