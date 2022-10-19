# 快速上手

## 使用 Modern.js 应用

**Modern.js 应用从 2.0 版本开始，默认使用 Modern.js Builder 作为构建引擎**。

因此，如果你是一名业务开发者，那么不需要手动接入 Builder，只需要创建一个 Modern.js 2.0 项目，直接就可以使用 Builder 提供的所有能力。

> Tips: Modern.js 2.0 仍在开发中，尚未正式发布。

## 在前端框架中接入

如果你正在开发一个前端框架，可以通过下面的步骤来接入 Builder:

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

### 3. 调用 Builder 实例方法

Builder 实例提供了与构建相关的各个方法，你可以根据实际场景来进行使用。

在本地开发场景，建议使用 [builder.startDevServer](/zh/api/builder-instance.html#builder-startdevserver) 方法，调用后会启动本地 Dev Server。

```ts
await builder.startDevServer();
```

成功启动 Dev Server 后，可以看到以下日志信息：

```bash
info    Starting dev server...
info    Dev server running at:

  > Local:    http://localhost:8081
  > Network:  http://192.168.0.1:8081
```

在生产环境部署场景，建议使用 [builder.build](/zh/api/builder-instance.html#builder-build) 方法，调用后会构建出生产环境产物。

```ts
await builder.build();
```

> 关于 Builder 实例方法的更多介绍，请阅读 [Builder Instance](/zh/api/builder-instance.html) 章节。

通过以上三个步骤，你已经了解了 Builder 基本的使用方法。接下来你可以通过 Builder 插件和 Builder 配置来对构建流程进行定制。

## 下一步

你可能想要：

<NextSteps>
  <Step href="/guide/glossary.html" title="名词解释" description="了解 Builder 相关的概念"/>
  <Step href="/guide/features.html" title="功能导航" description="了解 Builder 提供的所有功能"/>
  <Step href="/api" title="查阅 API" description="查看详细的 API 文档"/>
</NextSteps>
