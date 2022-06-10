---
sidebar_label: less
---

# tools.less

:::info 适用的工程方案
MWA，模块。
:::

- 类型： `Object | Function`
- 默认值：`{ lessOptions: { javascriptEnabled: true } }`

Modern.js 支持 [Less](https://lesscss.org/) 编译，可以通过 `tools.less` 修改 [less-loader](https://github.com/webpack-contrib/less-loader) 的配置。

## 启用

为了使用 Less 编译能力，我们需要先启用对应的功能。

在当前项目根目录执行 `new` 命令, 并选择 **启用 Less 支持** 即可。

```bash
$ pnpm run new
? 请选择你想要的操作
? 启用可选功能 (Use arrow keys)
❯ 启用 Less 支持
```

## 类型

### Object 类型

配置项的值为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    less: {
      modifyVars: {},
    },
  },
});
```

### Function 类型

配置项的值为 `Function` 类型时，内部默认配置作为第一参数传入，可以直接修改配置对象不返回任何东西，也可以返回一个对象作为最终结果；第二个参数为修改 `less-loader` 配置的工具函数集合。

如下，修改 less 和 css 变量实现主题定制需求：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    less: opts => ({
      lessOptions: {
        modifyVars: {
          '@base-font-size': 37.5,
          '@primary-color': 'red',
        },
      },
    }),
  },
});
```

## 工具函数

### addExcludes

用来指定 less-loader 不编译哪些文件，例如：

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    less: (config, { addExcludes }) => {
      addExcludes([/src\/assets\/examples\.less/]);
    },
  },
});
```
