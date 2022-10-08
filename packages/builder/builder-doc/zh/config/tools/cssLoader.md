- Type: `Object | Function`
- Default: `undefined`

通过 `tools.cssLoader` 可以修改 [css-loader](https://github.com/webpack-contrib/css-loader) 的配置项。默认配置如下:

```js
{
  importLoaders: 1,
  modules: {
    auto: true,
    exportLocalsConvention: 'camelCase',
    // isProd 表示生产环境构建
    localIdentName: isProd
      ? '[hash:base64]'
      : '[path][name]__[local]--[hash:base64:5]',
    // isServer 表示 SSR 构建
    exportOnlyLocals: isServer,
  },
  // 默认在生产环境中的 enableSourceMap 为 true
  sourceMap: enableSourceMap,
}
```

### 类型

#### Object

当此值为 Object 类型时，与默认配置通过 Object.assign 合并。比如：

```js
export default {
  tools: {
    cssLoader: {
      modules: {
        localIdentName: '[path][name]__[local]--[hash:base64:5]',
      },
    },
  },
};
```

#### Function

当此值为 Function 类型时，默认配置作为第一个参数传入，你可以直接修改配置对象，也可以返回一个对象作为最终配置。比如：

```js
export default {
  tools: {
    cssLoader: (config) => {
      config.modules.localIdentName = '[path][name]__[local]--[hash:base64:5]';
      return config;
    },
  },
};
```
