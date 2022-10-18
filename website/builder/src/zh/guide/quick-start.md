# 快速上手

## Modern.js 项目

**Modern.js 2.0 项目默认使用 Modern.js Builder 作为构建引擎**。

如果你是一名业务开发同学，你不需要手动接入 Builder，只需要创建一个 Modern.js 2.0 项目，直接就可以使用 Builder 提供的所有能力。

> Tips: Modern.js 2.0 仍在开发中，尚未正式发布。

## 在前端框架中接入

如果你正在开发一个前端框架，请通过下面的步骤来接入 Builder:

### 1. 安装 Builder

你需要安装两个包，其中：

- `@modern-js/builder` 为 Builder 的核心包，导出了 Builder 的核心 API。
- `@modern-js/builder-webpack-provider` 为 Builder 的一个 Provider，提供了基于 webpack 的构建能力。

```bash
pnpm add @modern-js/builder @modern-js/builder-webpack-provider -D
```

> 在进行版本升级时，请确保你安装的 builder 和 provider 为同一个版本。

### 2. 创建 Builder 实例

创建 Builder 实例的过程分两步：

首先你需要初始化 Builder Provider，并传入 `builderConfig` 配置对象。Builder 提供了丰富的配置项，允许你对构建行为进行灵活定制。此时你还不需要了解配置项的具体内容，传入一个空对象即可。你可以在 [API - 配置](/zh/api/#配置) 中找到所有可用的配置项。

```ts
import { createBuilder } from '@modern-js/builder';
import { builderWebpackProvider } from '@modern-js/builder-webpack-provider';

const provider = builderWebpackProvider({
  builderConfig: {
    // some configs
  },
});
```

拿到 provider 对象后，你可以调用 `createBuilder` 方法来创建一个 Builder 实例对象：

```ts
const builder = await createBuilder(provider, {
  entry: {
    index: './src/index.ts',
  },
});
```

除了上述示例中的 `entry` 选项，`createBuilder` 方法也提供了一些其他的选项，你可以在 [API - createBuilder](/zh/api/builder-core.html#createbuilder) 中进一步了解。
