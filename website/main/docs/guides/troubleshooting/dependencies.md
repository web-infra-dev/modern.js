---
sidebar_position: 1
---

# 依赖安装问题

### 如何升级项目中的 Modern.js 到最新版本？

对于使用 yarn 的项目，可以执行：

```bash
yarn upgrade --scope @modern-js
```

对于使用 pnpm 的项目，可以执行：

```bash
pnpm update "@modern-js/*" -r
```

如果需要了解不同版本之间的更新内容，可以查看：

- Modern.js 发版日志：[Modern.js/releases](https://github.com/modern-js-dev/modern.js/releases)。
- 各个 package 下的 `CHANGELOG.md` 文件。

---

### 如何锁定项目中的某个依赖版本？

如果需要锁定项目中的某个依赖的版本，可以通过以下方式进行操作：

**yarn**

对于使用 yarn 的项目，请在**项目根目录**的 `package.json` 中添加以下配置，然后重新执行 `yarn`：

```json
{
  "resolutions": {
    "package-name": "^1.0.0"
  }
}
```

**pnpm**

对于使用 pnpm 的项目，请在**项目根目录**的 `package.json` 中添加以下配置，然后重新执行 `pnpm i`：

```json
{
  "pnpm": {
    "overrides": {
      "package-name": "^1.0.0"
    }
  }
}
```

**npm**

对于使用 npm 的项目，请在**项目根目录**的 `package.json` 中添加以下配置，然后重新执行 `npm i`：

```json
{
  "overrides": {
    "package-name": "^1.0.0"
  }
}
```

:::info
对于 monorepo 场景，只能在项目根目录的 `package.json` 中锁定依赖版本，并且会影响 monorepo 中的所有 package。
:::

---

### 如何查看项目里某个依赖实际安装的版本？

可以使用包管理器自带的 `ls` 命令来查看项目里依赖的版本。

下面是一些基本的示例，详细用法请查看各个包管理器的文档。

**npm / yarn**

对于使用 npm 或 yarn 的项目，可以使用 `npm ls` 命令。

比如执行 `npm ls @modern-js/core`，可以看到如下结果：

```
project
└─┬ @modern-js/app-tools@1.6.10
  └── @modern-js/core@1.12.4
```

**pnpm**

对于使用 pnpm 的项目，可以使用 `pnpm ls` 命令。

比如执行 `pnpm ls @modern-js/core --depth Infinity`，可以看到如下结果：

```
devDependencies:
@modern-js/app-tools 1.7.0
└── @modern-js/core 1.13.0
```

---

### 安装依赖时提示 The engine "node" is incompatible？

安装依赖时如果出现以下报错提示，说明当前环境使用的 Node.js 版本过低，需要升级 Node.js 到更高版本。

```bash
The engine "node" is incompatible with this module.

Expected version ">=14.17.6". Got "12.20.1"
```

使用 Modern.js 时，建议使用 [Node.js 14.x](https://nodejs.org/download/release/latest-v14.x/) 或 [Node.js 16.x](https://nodejs.org/download/release/latest-v16.x/) 的最新版本。

如果当前环境的 Node.js 版本低于上述要求的版本，则可以使用 [nvm](https://github.com/nvm-sh/nvm) 或 [fnm](https://github.com/Schniz/fnm) 等工具进行版本切换。

下面是使用 nvm 的示例：

```
# 安装 Node.js v14
nvm install 14

# 切换到 Node 14
nvm use 14

# 将 Node 14 设置为默认版本
nvm default 14
```

在本地开发环境推荐使用 [fnm](https://github.com/Schniz/fnm)，它的用法与 nvm 相似，但拥有比 nvm 更好的性能。

---

### 升级依赖后出现 ReactNode 类型错误？

升级项目的依赖后，如果出现以下类型报错，说明项目中安装了错误的 `@types/react` 版本。

```bash
The types returned by 'render()' are incompatible between these types.
Type 'React.ReactNode' is not assignable to type 'import("/node_modules/@types/react/index").ReactNode'.
Type '{}' is not assignable to type 'ReactNode'.
```

出现这个问题的原因是 React 18 与 React 16/17 中的 ReactNode 类型定义不同，如果项目中出现多个不同 `@types/react` 版本，就会出现 ReactNode 类型冲突，导致以上报错。

解决方法为将项目中的 `@types/react` 和 `@types/react-dom` 锁定在统一的版本上，比如 `v17`。

```json
{
  "@types/react": "^17",
  "@types/react-dom": "^17"
}
```

关于锁定依赖版本的方法，请参考上方的 `如何锁定项目中的某个依赖版本？`。

---

### 执行 pnpm install 之后，控制台出现 peer dependencies 相关 warning？

出现该警告的原因是，某些三方 npm 包声明的 peer dependencies 版本范围与 Modern.js 中安装的版本范围不一致。

绝大多数情况下，peer dependencies 的警告不会影响项目运行，不需要额外进行处理，请忽略相关 warning。
