- Type: `Object | Function | undefined`
- Default: `undefined`

你可以通过 `tools.inspector` 开启或者配置 Webpack 调试工具 [webpack-inspector](https://github.com/modern-js-dev/webpack-inspector)。

当配置不为 `undefined` 时，则表示开启了 `webpack-inspector`，此时 `tools.inspector` 的类型可以为 `Object` 或者 `Function`。

### 类型

#### Object

当 `tools.inspector` 配置为 `Object` 类型时，与默认配置通过 Object.assign 合并。比如：

```js
export default {
  tools: {
    inspector: {
      // 默认端口为 3333
      port: 3334,
    },
  },
};
```

#### Function

当 `tools.inspector` 为 Function 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果。比如：

```js
export default {
  tools: {
    inspector(config) {
      // 修改端口号
      config.port = 3333;
    },
  },
};
```
