# Builder 配置项

Builder 提供了丰富的配置项，以帮助使用者对构建行为进行定制。

## 配置分类

Builder 中的配置可以分为以下几类：

- [Dev Config](/api/config-dev.html)：与本地开发有关的配置。
- [Html Config](/api/config-html.html)：与 HTML 有关的配置。
- [Tools Config](/api/config-tools.html)：与底层工具有关的配置。
- [Source Config](/api/config-source.html)：与源代码解析、编译方式相关的配置。
- [Output Config](/api/config-output.html)：与构建产物有关的配置。
- [Security Config](/api/config-security.html)：与安全有关的配置。
- [Performance Config](/api/config-performance.html)：与编译性能、产物性能有关的配置。

你可以在 [API Reference](/api/) 页面找到所有配置项的详细说明。

## 配置默认值

Builder 为每个配置项预设了一个默认值，默认值可以满足大部分使用场景。同时，上层框架也会基于垂直场景的需求，覆盖一部分配置的默认值。

因此，在大多数情况下，你不需要声明任何 Builder 配置，直接开箱使用即可。

## 使用配置

### 在上层框架中使用

当你使用一个基于 Builder 的上层框架时，你可以直接通过框架的配置文件来定义 Builder 配置，上层框架会自动将相关配置透传给 Builder。

比如在 Modern.js 2.0 框架中，你可以直接在 [modern.config.ts](https://modernjs.dev/docs/apis/app/config/usage) 文件里定义 Builder 的 [source.alias](/api/config-source.html#source-alias) 配置：

```ts
// modern.config.ts
export default {
  source: {
    alias: {
      '@common': './src/common',
    },
  },
};
```

常用的框架配置文件包括：

| 框架          | 配置文件           |
| ------------- | ------------------ |
| Modern.js 2.0 | `modern.config.ts` |
| EdenX         | `edenx.config.ts`  |
| PIA           | `pia.config.ts`    |

### 通过 Node API 使用

当你通过 Node API 调用 Builder 时，你可以通过 Provider 的 `builderConfig` 配置项来传入 Builder 配置：

```ts
import { builderWebpackProvider } from '@modern-js/builder-webpack-provider';

const provider = builderWebpackProvider({
  builderConfig: {
    // some configs
  },
});
```

关于 Node API 的完整用法，请参考 [API - createBuilder](/api/builder-core.html#createbuilder)。

## 与框架配置的关系

通常来说，Builder 配置是框架配置的子集。

**Builder 配置只处理构建相关行为**，而框架配置涵盖的范围更大，还包括运行时、服务端、部署等方面，因此框架是在 Builder 配置的基础上扩展出来的。

## 调试配置

在执行构建时，你可以添加 `DEBUG=builder` 环境变量来开启 Builder 的调试模式。

```bash
DEBUG=builder pnpm dev
```

在调试模式下，Builder 会将内部最终生成的 Builder 配置写入到产物目录下，便于开发者查看和调试。

```
Inspect config succeed, open following files to view the content:

  - Builder Config: /Project/demo/dist/builder.config.js
  - Webpack Config (web): /Project/demo/dist/webpack.config.web.js
```

打开生成的 `/dist/builder.config.js` 文件，即可查看 Builder 配置的完整内容。

关于调试模式的完整介绍，请查看 [开启调试模式](/guide/debug/debug-mode.html) 章节。
