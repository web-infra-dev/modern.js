---
extractApiHeaders: [2]
---

# Builder Core

本章节描述了 Builder 提供的一些核心方法。

## createBuilder

创建一个 Builder 实例对象。

使用该方法时，需要搭配 `@modern-js/webpack-builder` 或 `@modern-js/rspack-builder` 提供的 provider 使用。provider 包含了与特定 bundler 相关的构建逻辑。

### webpack provider

当传入 `webpackBuildProvider` 时，Builder 会使用 webpack 作为 bundler 进行构建。

```ts
import { createBuilder } from '@modern-js/builder';
import { webpackBuildProvider } from '@modern-js/webpack-builder';

const provider = webpackBuildProvider({
  builderConfig: {
    // some configs
  },
});

const builder = await createBuilder(provider, {
  // some options
});
```

### rspack provider

当传入 `rspackBuildProvider` 时，Builder 会使用 rspack 作为 bundler 进行构建。

```ts
import { createBuilder } from '@modern-js/builder';
import { rspackBuildProvider } from '@modern-js/rspack-builder';

const provider = rspackBuildProvider({
  builderConfig: {
    // some configs
  },
});

const builder = await createBuilder(provider, {
  // some options
});
```

> Tips: @modern-js/rspack-builder 尚未开发完成。

### options

`createBuilder` 的第二个参数是一个配置对象，你可以传入以下选项：

```ts
type BuilderEntry = Record<string, string | string[]>;

type BuilderTarget = 'web' | 'node' | 'modern-web';

type CreateBuilderOptions = {
  cwd?: string;
  entry?: BuilderEntry;
  target?: BuilderTarget | BuilderTarget[];
  framework?: string;
  configPath?: string | null;
};
```

各个选项的作用：

- `cwd`: 当前执行构建的根路径，默认值为 `process.cwd()`
- `entry`: 构建入口对象
- `target`: 构建产物类型，默认值为 `['web']`
- `framework`: 框架的英文名称，唯一标识符，默认值为 `'modern.js'`
- `configPath`: 框架配置文件的路径（绝对路径），该参数影响构建缓存更新

#### 构建产物类型

target 表示构建产物类型，可以设置为以下值：

- `web`: 用于浏览器的产物
- `modern-web`：用于现代浏览器的产物
- `node`: 用于 SSR 场景的产物

当 target 为包含多个值的数组时，会并行构建并生成多份不同的产物。比如同时构建浏览器产物和 SSR 产物：

```ts
const builder = await createBuilder(provider, {
  target: ['web', 'node'],
});
```

## mergeBuilderConfig

合并多份 Builder 配置对象，并返回一个合并后的新对象。

- **Type**

```ts
function mergeBuilderConfig(...configs: BuilderConfig[]): BuilderConfig;
```

- **Example**

```ts
const config1 = {
  dev: {
    https: false,
  },
};
const config2 = {
  dev: {
    https: true,
  },
};

const mergedConfig = mergeBuilderConfig(config1, config2);

console.log(mergedConfig); // { dev: { https: true } }
```

> 该方法不会修改传入的 config 对象。

## webpack

webpack 对象，用于消费 webpack 内置插件或类型定义。

- **Example**

```ts
import webpack from '@modern-js/webpack-builder/webpack';

new webpack.DefinePlugin();
```

> 大部分场景下，推荐直接引用该对象，而不是手动安装一份 webpack 依赖，这样可以避免出现多实例问题。

## HtmlWebpackPlugin

HtmlWebpackPlugin 对象，通常用于实现 HtmlWebpackPlugin 的自定义插件。

- **Example**

```ts
import HtmlWebpackPlugin from '@modern-js/webpack-builder/html-webpack-plugin';
```

> 大部分场景下，推荐直接引用该对象，而不是手动安装一份 html-webpack-plugin 依赖，这样可以避免出现多实例问题。
