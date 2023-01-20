- **Type:** `Object | Function`
- **Default:**

```js
const defaultOptions = {
  lessOptions: {
    javascriptEnabled: true,
  },
  // 默认在开发环境下启用 CSS 的 Source Map
  sourceMap: isDev,
};
```

你可以通过 `tools.less` 修改 [less-loader](https://github.com/webpack-contrib/less-loader) 的配置。

### Object 类型

当 `tools.less` 的值为 `Object` 类型时，会与默认配置通过 Object.assign 进行浅层合并，值得注意的是，`lessOptions` 会通过 deepMerge 进行深层合并。

```js
export default {
  tools: {
    less: {
      lessOptions: {
        javascriptEnabled: false,
      },
    },
  },
};
```

### Function 类型

当 `tools.less` 为 Function 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果，第二个参数提供了一些可以直接调用的工具函数：

```js
export default {
  tools: {
    less(config) {
      // 修改 lessOptions 配置
      config.lessOptions = {
        javascriptEnabled: false,
      };
    },
  },
};
```

### 工具函数

#### addExcludes

- **Type:** `(excludes: RegExp | RegExp[]) => void`

用来指定 `less-loader` 不编译哪些文件，你可以传入一个或多个正则表达式来匹配 less 文件的路径。例如：

```js
export default {
  tools: {
    less(config, { addExcludes }) {
      addExcludes(/node_modules/);
    },
  },
};
```
