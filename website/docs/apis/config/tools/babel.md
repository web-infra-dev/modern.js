---
sidebar_label: babel
---

# tools.babel

:::info 适用的工程方案
MWA，模块。
:::

- 类型： `Object | Function`
- 默认值：`{ presets: ['@modern-js/babel-preset-app'], plugins: [] }`

通过 `tools.babel` 可以修改 [babel-loader](https://github.com/babel/babel-loader) 的配置项。

## 类型

### Object 类型

当此值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    babel: {
      plugins: [
        [
          'babel-plugin-import',
          {
            libraryName: 'xxx-components',
            libraryDirectory: 'es',
            style: true,
          },
        ],
      ],
    },
  },
});
```

### Function 类型

当此值为 `Function` 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果，第二个参数提供了一些可以直接调用的工具函数：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    babel: config => {
      // 添加一个插件，比如配置某个组件库的按需引入
      // Modern.js 目前内置了 antd 的按需引入规则
      config.plugins.push([
        'babel-plugin-import',
        {
          libraryName: 'xxx-components',
          libraryDirectory: 'es',
          style: true,
        },
      ]);
    },
  },
});
```

## 工具函数

`tools.babel` 值为 `Function` 时，第二个参数可用的工具函数如下：

### addPlugins

添加 Babel 插件。

例如添加 `babel-plugin-import`：

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    babel: (config, { addPlugins }) => {
      addPlugins([
        [
          'babel-plugin-import',
          {
            libraryName: 'xxx-components',
            libraryDirectory: 'es',
            style: true,
          },
        ],
      ]);
    },
  },
});
```

### addPresets

添加 Babel 预设配置。

大多数情况下，我们不需要新增预设配置，内置的 `@modern-js/babel-preset-app` 已经能满足大部分需求。

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    babel: (config, { addPresets }) => {
      addPresets([['@babel/preset-env', { targets: 'defaults' }]]);
    },
  },
});
```

### removePlugins

删除 Modern.js 中默认集成的 Babel 插件，参数为需要删除的插件名：

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    babel: (config, { removePlugins }) => {
      removePlugins(['babel-plugin-import']);
    },
  },
});
```

### removePresets

删除 Modern.js 中默认集成的 Babel 预设配置，参数为需要删除的预设名：

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    babel: (config, { removePresets }) => {
      removePresets(['@babel/preset-react']);
    },
  },
});
```

### addIncludes

默认情况下，Modern.js 只会编译 src 目录下的业务代码，使用 `addIncludes` 可以指定 `ts-loader` 编译 `node_modules` 下的一些文件。

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    babel: (config, { addIncludes }) => {
      addIncludes([/node_modules\/react/]);
    },
  },
});
```

:::info
不推荐使用 `addIncludes` 编译 `node_modules` 下的文件，建议使用 [source.include](/docs/apis/config/source/include) 代替。
:::info

### addExcludes

和 `addIncludes` 相反，指定 Babel 编译时排除某些文件。

例如不编译 `src/example` 目录下的文件：

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    babel: (config, { addExcludes }) => {
      addExcludes([/src\/example/]);
    },
  },
});
```

## 插件信息

目前内部集成的 Babel 预设配置如下所示：

- [@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env)
- [@babel/preset-react](https://www.npmjs.com/package/@babel/preset-react)
- [@babel/preset-typescript](https://www.npmjs.com/package/@babel/preset-typescript)

目前内部集成的 Babel 插件如下所示：

- [@babel/plugin-proposal-decorators](https://www.npmjs.com/package/@babel/plugin-proposal-decorators)
- [@babel/plugin-transform-runtime](https://www.npmjs.com/package/@babel/plugin-transform-runtime)
- [@babel/plugin-proposal-function-bind](https://www.npmjs.com/package/@babel/plugin-proposal-function-bind)
- [@babel/plugin-proposal-export-default-from](https://www.npmjs.com/package/@babel/plugin-proposal-export-default-from)
- [@babel/plugin-proposal-pipeline-operator](https://www.npmjs.com/package/@babel/plugin-proposal-pipeline-operator)
- [@babel/plugin-proposal-partial-application](https://www.npmjs.com/package/@babel/plugin-proposal-partial-application)
- [babel-plugin-transform-react-remove-prop-types](https://www.npmjs.com/package/babel-plugin-transform-react-remove-prop-types)
- [babel-plugin-styled-components](https://www.npmjs.com/package/babel-plugin-styled-components)
- [babel-plugin-macros](https://www.npmjs.com/package/babel-plugin-macros)
- [babel-plugin-dynamic-import-node](https://www.npmjs.com/package/babel-plugin-dynamic-import-node)
- [babel-plugin-import](https://www.npmjs.com/package/babel-plugin-import)
- [babel-plugin-lodash](https://www.npmjs.com/package/babel-plugin-lodash)

<!-- TODO: babel-chain -->
