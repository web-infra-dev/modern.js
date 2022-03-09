---
sidebar_position: 0
---

# 配置使用


Modern.js 支持在 `package.json` 文件和根路径下的 `modern.config.t(j)s` 文件中自定义配置选项。在 `package.json` 中的配置优先级高于在 `modern.config.t(j)s` 中的配置。


### 在 `package.json` 中配置

在 `package.json` 中的 `modernConfig` 字段下设置需要自定义的配置选项，如：

```json title="package.json"
{
  "modernConfig": {
    "source": {
      "alias": {
        "@common": "./src/common",
      }
    }
  }
}
```

`package.json` 因为 JSON 文件格式的约束，只能对配置选项设置数字、字符串、布尔值、数组等简单类型的值，当需要对配置选项设置函数类型的值时，需要在 `modern.config.t(j)s` 文件中进行设置。

## 在 `modern.config.t(j)s` 中配置

`modern.config.t(j)s` 文件中，支持设置配置选项的值为函数类型的值。如：

```js title="modern.config.js"
module.exports = {
  source: {
    alias: opts => {
      opts['@common'] = './src/common';
    }
  }
}
```

当在 `modern.config.ts` 文件中设置配置选项时，可以通过 `@modern-js/app-tools` 中的 `defineConfig` API 进行配置，从而获得良好的 TS 类型提示支持。如：

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

:::tip 提示
注意和 `@modern-js/runtime` 提供的同名 API [defineConfig](/docs/apis/runtime/app/define-config) 区分。
:::
