- Type : `string | object | function | RegExp`

- Default: `undefined`

在构建时，防止将代码中某些 `import` 的依赖包打包到 bundle 中，而是在运行时再去从外部获取这些依赖。

详情请见: [Webpack 外部扩展(Externals)](https://webpack.docschina.org/configuration/externals/)

#### 示例

将 `react-dom` 依赖从构建产物中剔除。
为了在运行时获取这个模块, `react-dom` 的值将全局检索 `ReactDOM` 变量。

```js
export default {
  output: {
    externals: {
      'react-dom': 'ReactDOM',
    },
  },
};
```
