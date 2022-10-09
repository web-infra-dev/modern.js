- Type: `Object | Function | undefined`
- Default:

```js
const defaultTerserOptions = {
  terserOptions: {
    mangle: {
      safari10: true,
    },
  },
};
```

在生产环境构建时，Builder 会通过 [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) 对 JavaScript 代码进行压缩优化。可以通过 `tools.terser` 修改 [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) 的配置。

### Object 类型

<<<<<<< HEAD
当 `tools.terser` 的值为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。
=======
当 `tools.terser` 配置为 `Object` 类型时，会与默认配置通过 `Object.assign` 合并。
>>>>>>> cea2c4f65 (docs(builder): add terser/minifyCss/pug document (#1821))

例如通过 `exclude` 排除部分文件的压缩：

```js
export default {
  tools: {
    terser: {
      exclude: /\/excludes/,
    },
  },
};
```

### Function 类型

当 `tools.terser` 配置为 `Function` 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果。

```js
export default {
  tools: {
    terser: opts => {
      opts.exclude = /\/excludes/;
    },
  },
};
```
