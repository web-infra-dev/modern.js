---
sidebar_position: 4
---

# Monorepo

Monorepo 项目默认只需要 [PackageManager 配置](/docs/apis/generator/config/introduce#package-manager)。

## 创建子项目

Monorepo 项目支持通过使用 new 命令创建子项目，子项目类型支持应用、测试应用、模块、内部模块，除了应用和模块各自的配置外，这里还需要一些通用的子项目配置。

### Solution

子项目类型(solution)，不同子项目类型字段为:

- 应用(mwa)
- 应用（测试）(mwa_test)
- 模块(module)
- 模块（内部）(inner_module)

### Package-Name

子项目名称(packageName)，字符串类型。

### Package-Path

子项目路径(packagePath)，字符串类型。
