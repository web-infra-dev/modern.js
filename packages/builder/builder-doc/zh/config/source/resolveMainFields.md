- Type: `(string | string[])[]`

- Default: `undefined`

该配置项将决定你使用 `package.json` 哪个字段导入 `npm` 模块。对应 webpack 的 [resolve.mainFields](https://webpack.js.org/configuration/resolve/#resolvemainfields) 配置。

#### 示例

```js
export default {
  source: {
    resolveMainFields: ['main', 'browser', 'exports'],
  },
};
```
