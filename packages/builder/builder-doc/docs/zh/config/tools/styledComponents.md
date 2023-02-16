- **类型：** `Object | Function`
- **默认值**

```js
{
  displayName: true,
  // 在 SSR 构建中 isSSR 为 true
  ssr: isSSR,
  // 在生产环境构建时启用 `pure` 来优化包体积
  pure: isProd,
  transpileTemplateLiterals: true,
}
```
- **打包工具：** `仅支持 webpack`

对应 [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components) 的配置。 值为 `Object` 类型时，利用 Object.assign 函数与默认配置合并。比如:

```js
export default {
  tools: {
    styledComponents: {
      pure: false,
    },
  },
};
```

值为 `Function` 类型时，第一个参数为默认配置，第二个参数提供了一些可以直接调用的工具函数：

```js
export default {
  tools: {
    styledComponents(config) {
      // 修改 pure 配置
      config.pure = false;
    },
  },
};
```
