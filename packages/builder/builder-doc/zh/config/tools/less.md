- Type: `Object | Function`
- Default

```js
{
  lessOptions: {
    javascriptEnabled: true
  },
  sourceMap: false,
}
```

你可以通过 `tools.less` 修改 [less-loader](https://github.com/webpack-contrib/less-loader) 的配置。

### Type

#### Object

当 `tools.less` 配置为 `Object` 类型时，与默认配置通过 Object.assign 合并。

```js
export default {
  tools: {
    less: {
      lessOptions: {
        javascriptEnabled: false
      },
    },
  },
};
```

#### Function

当 `tools.less` 为 Function 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果，第二个参数提供了一些可以直接调用的工具函数：

```js
export default {
  tools: {
    less(config) {
      // 修改 lessOptions 配置
      config.lessOptions = {
        javascriptEnabled: false
      };
    },
  },
};
```

### 工具函数

#### addExcludes

用来指定 `less-loader` 不编译哪些文件，例如：

```js
export default {
  tools: {
    less(config, { addExcludes }) {
      addExcludes(/node_modules/);
    },
  },
};
```
