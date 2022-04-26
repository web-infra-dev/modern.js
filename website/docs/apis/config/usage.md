---
sidebar_position: 0
---

# 配置使用

Modern.js 支持在 `modern.config.js` 配置文件或 `package.json` 文件中自定义配置选项。

## 配置文件

Modern.js 的配置文件定义在项目的根目录下，同时支持 `.js` 和 `.ts` 两种格式：

- `modern.config.js`
- `modern.config.ts`

### modern.config.js

`modern.config.js` 中可以使用 JavaScript 语法，因此比 `package.json` 更加灵活。

比如，你可以在 `modern.config.js` 中定义函数类型的配置选项：

```js title="modern.config.js"
export default {
  source: {
    alias: opts => {
      opts['@common'] = './src/common';
    },
  },
};
```

你也可以通过 `process.env.NODE_ENV` 进行动态设置：

```js title="modern.config.js"
export default {
  server: {
    ssr: process.env.NODE_ENV === 'development',
  },
};
```

### modern.config.ts

我们推荐使用 .ts 格式的配置文件，它提供了友好的 TypeScript 类型提示，从而帮助你避免配置中的错误。

你可以依据自己的工程方案，从以下包中导入 `defineConfig` 工具函数：

- 应用工程方案：`@modern-js/app-tools`。
- 模块工程方案：`@modern-js/module-tools`。

`defineConfig` 函数会帮助你进行配置的类型推导和类型补全：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    alias: {
      '@common': './src/common',
    },
  },
});
```

## 在 package.json 中配置（不推荐）

除了配置文件外，也可以在 `package.json` 中的 `modernConfig` 字段下设置配置选项，如：

```json title="package.json"
{
  "modernConfig": {
    "source": {
      "alias": {
        "@common": "./src/common"
      }
    }
  }
}
```

由于 JSON 文件格式的限制，`package.json` 中只能定义数字、字符串、布尔值、数组等简单类型的值，当我们需要设置函数类型的值时，建议在 Modern.js 配置文件中进行设置。

## 注意事项

- 不建议同时使用 `package.json` 和 `modern.config.js` 进行配置。如果同时使用了两者并出现配置冲突，modern.js 会在命令行进行提示。
- `@modern-js/runtime` 导出了同名的 [defineConfig](/docs/apis/runtime/app/define-config) API，请注意区分。
