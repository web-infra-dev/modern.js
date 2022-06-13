---
sidebar_label: sass
---

# tools.sass

:::info 适用的工程方案
MWA，模块。
:::

- 类型： `Object | Function`
- 默认值： `{}`

Modern.js 支持 [Sass](https://sass-lang.com/) 编译，可以通过 `tools.sass` 修改 [sass-loader](https://github.com/webpack-contrib/sass-loader) 的配置。

## 启用

为了使用 Sass 编译能力，我们需要先启用对应的功能。

在当前项目根目录执行 `new` 命令, 并选择 **启用 Sass 支持** 即可。

```bash
$ pnpm run new
? 请选择你想要的操作
? 启用可选功能 (Use arrow keys)
❯ 启用 Sass 支持
```

## 类型

### Object 类型

配置项的值为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。

```js title="modern.config.js"
export default defineConfig({
  tools: {
    sass: {},
  },
});
```

### Function 类型

配置项的值为 `Function` 类型时，内部默认配置作为第一参数传入，可以直接修改配置对象不做返回，也可以返回一个对象作为最终结果；第二个参数为修改 `sass-loader` 配置的工具函数集合。

如下配置 [additionalData](https://github.com/webpack-contrib/sass-loader#additionaldata):

```js title="modern.config.js"
export default defineConfig({
  tools: {
    sass: opts => {
      opts.additionalData = async (content, loaderContext) => {
        // ...
      };
    },
  },
});
```

## 工具函数

### addExcludes

用来指定 sass-loader 不编译哪些文件，例如：

```ts title="modern.config.ts"
export default defineConfig({
  tools: {
    sass: (config, { addExcludes }) => {
      addExcludes([/src\/assets\/examples\.sass/]);
    },
  },
});
```
