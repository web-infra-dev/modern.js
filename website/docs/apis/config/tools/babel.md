---
sidebar_label: babel
sidebar_position: 1
---

# tools.babel

:::info 适用的工程方案
MWA，模块。
:::

- 类型： `Object | Function`
- 默认值：`{ presets: ['@modern-js/babel-preset-app'], plugins: [] }`

通过 `tools.babel` 可以修改 [babel-loader](https://github.com/babel/babel-loader) 的配置项。

## 类型

值为 `Object` 类型时，与默认配置通过 `Object.assign` 合并。

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

值为 `Function` 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    babel: config => {
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

## 插件信息

目前内部集成的 babel 预设如下所示：

- [@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env)
- [@babel/preset-react](https://www.npmjs.com/package/@babel/preset-react)
- [@babel/preset-typescript](https://www.npmjs.com/package/@babel/preset-typescript)

目前内部集成的 babel 插件如下所示：

- [@babel/plugin-proposal-decorators](https://www.npmjs.com/package/@babel/plugin-proposal-decorators)
- [@babel/plugin-proposal-object-rest-spread](https://www.npmjs.com/package/@babel/plugin-proposal-object-rest-spread)
- [@babel/plugin-transform-runtime](https://www.npmjs.com/package/@babel/plugin-transform-runtime)
- [@babel/plugin-syntax-dynamic-import](https://www.npmjs.com/package/@babel/plugin-syntax-dynamic-import)
- [@babel/plugin-proposal-function-bind](https://www.npmjs.com/package/@babel/plugin-proposal-function-bind)
- [@babel/plugin-proposal-export-default-from](https://www.npmjs.com/package/@babel/plugin-proposal-export-default-from)
- [@babel/plugin-proposal-export-namespace-from](https://www.npmjs.com/package/@babel/plugin-proposal-export-namespace-from)
- [@babel/plugin-proposal-pipeline-operator](https://www.npmjs.com/package/@babel/plugin-proposal-pipeline-operator)
- [@babel/plugin-proposal-partial-application](https://www.npmjs.com/package/@babel/plugin-proposal-partial-application)
- [@babel/plugin-syntax-dynamic-import](https://www.npmjs.com/package/@babel/plugin-syntax-dynamic-import)
- [babel-plugin-transform-react-remove-prop-types](https://www.npmjs.com/package/babel-plugin-transform-react-remove-prop-types)
- [babel-plugin-styled-components](https://www.npmjs.com/package/babel-plugin-styled-components)
- [babel-plugin-macros](https://www.npmjs.com/package/babel-plugin-macros)
- [babel-plugin-dynamic-import-node](https://www.npmjs.com/package/babel-plugin-dynamic-import-node)
- [babel-plugin-import](https://www.npmjs.com/package/babel-plugin-import)
- [babel-plugin-lodash](https://www.npmjs.com/package/babel-plugin-lodash)

<!-- TODO: babel-chain -->
