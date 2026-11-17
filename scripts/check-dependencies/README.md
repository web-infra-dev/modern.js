# 仓库依赖检查

本目录承载提交前和 CI 共用的依赖规则，不提供安装体积、安装耗时或传递依赖多版本审计。

## 检查入口

在仓库根目录执行：

| 命令                                              | 内容                                                               | 执行位置                         |
| ------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| `pnpm check-dependencies`                         | 依赖声明版本一致性，保留现有依赖和 examples 例外                   | manifest 变更时的 hooks、完整 CI |
| `pnpm lint:package-json`                          | workspace 包依赖环、workspace 协议、exports 键一致性、源码幽灵依赖 | hooks、完整 CI                   |
| `pnpm install --ignore-scripts --frozen-lockfile` | 锁文件可安装，且不需要更新                                         | CI                               |
| `pnpm check-package-artifacts`                    | 实际发布文件的入口和外部依赖声明                                   | 已构建后的 CI                    |
| `pnpm test:dependencies`                          | 正反例、暂存内容及真实打包回归测试                                 | 本地、CI                         |

源码检查以 `packages/` 中包的 manifest 为边界，区分同包本地引用、路径别名、Node 内置模块和显式声明。模板、fixtures 和预编译目录不当作该包的手写源码。包内测试和开发配置可使用根目录明确提供的共享开发工具。

提交配置按实际暂存内容检查。源码或 manifest 变更会检查受影响包，workspace 包依赖环读取完整图。版本一致性使用 Git index 中的 manifest 与 workspace 定义，不把未暂存的修复当作提交内容。hooks 不安装、不构建、不打包、不下载工具。

## 发布检查的范围

默认检查 pnpm 识别的 workspace 包中，位于 `packages/` 且 `private` 不为 `true` 的包，与现有发布目录范围一致。不检查 scripts、tests、examples 或嵌套模板 manifest。

可以聚焦一个已构建的可发布包：

```bash
pnpm check-package-artifacts packages/cli/builder
```

显式传入私有包或发布范围外目录也会报错，不允许借参数绕过筛选。

检查读取 pnpm 实际打包后的 manifest 和文件。打包在隔离目录进行，禁用生命周期脚本，不改写原包、不安装依赖，不重复构建。未构建、打包失败或入口目标缺失都会返回非零退出码。

检查适用的 `main`、`module`、`types`、`bin`、`exports` 和 `typesVersions`。类型包的空 `main` 视为未设置，仅在仓库测试中启用的 `modern:source` 不作为发布入口。未知条件不能因此被忽略。

## 依赖声明与归属不是同一个判断

源码阶段允许 dependencies、devDependencies、peerDependencies 和 optionalDependencies 中的有效声明。

发布阶段检查公开 JS 与类型入口可达的实际打包文件中明确的外部引用。所需依赖不能仅存在于 devDependencies，但报错不等于要求自动移到 dependencies：

- 包自身运行所需的独立库通常使用 dependencies。
- 应用或框架提供的宿主使用 peerDependencies，本地编译和测试可保留 devDependencies。
- 公开声明需要的独立类型工具可以使用 dependencies。
- React 等宿主类型可使用兼容的类型 peer，避免强制安装另一套 React 类型。
- 已被内联、不再保留外部引用的依赖不要求作为生产依赖声明。
- 捕获异常的纯模块解析探测不等于加载生产依赖。实际 import 或 require 不会因为位于 try/catch 中就自动放行 dev-only 引用。

修复前需要确认实际用途、宿主合同和兼容范围。检查不自动修改任何依赖声明。

## 能力边界

发布检查验证 manifest 的入口目标和显式外部依赖合同，不代替完整模块解析、声明语义检查或所有条件组合的消费方验证。内部文件被遍历时，仅检查实际打包且可读取的文件，不把完整相对引用闭包验证扩展成额外门禁。

BFF 声明可移植性等问题继续由已有隔离消费方集成测试保障。正常的传递依赖多版本、合理的 peer 和 optional 合同不因本检查被统一禁止。
