- Type: `Object | Function`
- Default: `undefined`

通过 `tools.styleLoader` 可以设置 [style-loader](https://github.com/webpack-contrib/style-loader) 的配置项，默认的配置为一个空对象。

值得注意的是，builder 默认不会开启 `style-loader`，如果配置为 Obejct/Function 类型，则会在**开发环境**开启 `style-loader`。在生产环境，我们仍然会使用 [mini-css-extract-plugin](./cssExtract.md) 来提取 CSS。

### 类型

#### Object

当此值为 Object 类型时，与默认配置通过 Object.assign 合并。比如：

```js
export default {
  tools: {
    styleLoader: {
      insert: 'head',
    },
  },
};
```

#### Function

当此值为 Function 类型时，默认配置作为第一个参数传入，你可以直接修改配置对象，也可以返回一个对象作为最终配置。比如：

```js
export default {
  tools: {
    styleLoader: (config) => {
      config.insert = 'head';
      return config;
    },
  },
};
```
