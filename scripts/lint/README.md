# 仓库 lint 规则

本目录的本地插件通过根目录 `rstack.config.mts` 注册，由 `pnpm lint` 和 `pnpm check` 统一执行。

## modern/no-unused-destructuring

现有 `@typescript-eslint/no-unused-vars` 负责普通未使用绑定。本规则补充检查以 `_` 开头的对象解构绑定，避免通过重命名来掩盖无用解构。

- `matches: _matches` 没有被读取时报告错误，局部变量和函数参数都适用。
- 同层 rest 绑定被读取或对外导出时，允许通过兄弟属性排除字段，例如 `{ password: _password, ...safe }`。
- 未被使用的 `_rest` 不会使兄弟属性获得豁免。
- 嵌套对象分别检查，外层 rest 不能豁免内层无用绑定。
- 实际读取、闭包捕获、对外导出和纯类型声明不报告错误。
- 完整 `_args` 参数、数组占位和赋值解构不属于新增规则的检查范围。

规则只报告问题，不自动删除字段或参数。函数的参数数量、属性读取及默认值求值都可能有实际行为，例如 loader 的参数数量会影响数据预取。
