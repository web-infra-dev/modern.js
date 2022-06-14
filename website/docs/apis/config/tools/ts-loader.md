---
title: tools.tsLoader
sidebar_label: tsLoader
---

:::info 适用的工程方案
MWA。
:::

- 类型： `Object | Function`
- 默认值：

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "ESNext"
  },
  "transpileOnly": false,
  "allowTsInNodeModules": true
}
```

项目中开启 [output.enableTsLoader](/docs/apis/config/output/enable-ts-loader) 选项后，可以通过
`tools.tsLoader` 对 [ts-loader](https://github.com/TypeStrong/ts-loader) 进行配置。

## 类型

### Object 类型

当此值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并。

例如修改 `allowTsInNodeModules` 为 `false`：

```typescript title="modern.js.config.ts"
import { defineConfig } from '@modern.js/app-tools';

export default defineConfig({
  tools: {
    tsLoader: {
      allowTsInNodeModules: false,
    },
  },
});
```

### Function 类型

当此值为 `Function` 类型时，默认配置作为第一参数传入，可以直接修改配置对象不做返回，也可以返回一个对象作为最终配置；第二个参数为修改 `ts-loader` 配置工具函数集合：

```typescript title="modern.js.config.ts"
import { defineConfig } from '@modern.js/app-tools';

export default defineConfig({
  tools: {
    tsLoader: opts => {
      opts.allowTsInNodeModules = false;
    },
  },
});
```

## 工具函数

`tools.tsLoader` 的值为 `Function` 类型时，第二个参数可用的工具函数如下：

### addIncludes

- 类型： `(includes: string | RegExp | Array<string | RegExp>) => void`

默认情况下，Modern.js 只会编译 src 目录下的业务代码，使用 `addIncludes` 可以指定 `ts-loader` 编译 `node_modules`` 下的一些文件。

```typescript title="modern.js.config.ts"
import { defineConfig } from '@modern.js/app-tools';

export default defineConfig({
  tools: {
    tsLoader: (config, { addIncludes }) => {
      addIncludes([/node_modules\/react/]);
    },
  },
});
```

:::info
不推荐使用 `addIncludes` 编译 `node_modules` 下的文件，建议使用 [source.include](/docs/apis/config/source/include) 代替。
:::info

### addExcludes

- 类型： `(excludes: string | RegExp | Array<string | RegExp>) => void`

和 `addIncludes` 相反，指定 `ts-loader` 编译时排除某些文件。

例如不编译 `src/example` 目录下的文件：

```typescript title="modern.js.config.ts"
import { defineConfig } from '@modern.js/app-tools';

export default defineConfig({
  tools: {
    tsLoader: (config, { addExcludes }) => {
      addExcludes([/src\/example\//]);
    },
  },
});
```
