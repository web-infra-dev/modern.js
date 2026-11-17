# 依赖检查

这是仓库内部使用的私有工具包。现有清单规则与新增源码检查独立运行，不会自动修改依赖声明。

## 命令

在仓库根目录运行：

```sh
pnpm lint:package-json
pnpm check-source-dependencies
pnpm check-source-dependencies --staged
pnpm check-source-dependencies --json
pnpm test:source-dependencies
```

- 清单检查保留原有 exports、workspace 协议及清单依赖环规则。
- 源码检查覆盖 pnpm workspace 中 `packages/**/src` 下的 JS、TS 和声明文件。测试、fixtures、templates、compiled、dist 不纳入本轮门禁，其他目录中的测试和脚本也不在扫描范围内。
- dependencies、devDependencies、peerDependencies、optionalDependencies 和包自身引用均视为已声明。类型引用可以由已声明的 `@types` 包提供。
- 根目录声明不能代替消费包的声明。配置好的本包路径别名不需要 npm 声明，跨包别名和跨包相对引用检查目标包关系。
- 未安装的外部包仍然检查声明。无法确定目标的本地路径或别名单独警告，不建议自动安装。

## 提交与持续集成

现有 pre-commit 在 `rs staged` 成功后运行一次 `--staged` 检查。必须先启用仓库 Git hooks 才会执行，工具不覆盖本机其他 hook 配置。

暂存区模式创建一个隔离的 Git index 快照，检查受影响包的完整源码。未暂存源码、清单和配置不能使检查通过。配置或根清单变化会扩大范围，删除和重命名同样触发。已安装外部依赖只读复用，workspace 链接指向暂存区快照。结束后删除工具自己创建的临时快照，不修改用户工作区或 Git index。

Lint 工作流运行同一套全量规则和工具回归测试，不要求先构建框架。

退出码：0 表示没有声明错误，1 表示发现未声明依赖，2 表示配置、Git 或解析执行失败。JSON 输出包含范围、耗时和诊断，不包含自动修复或依赖归属建议。
