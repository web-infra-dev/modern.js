- **类型：** `Object | Function`
- **默认值：**

```js
{
  flexbox: 'no-2009',
  // browserslist 取决于项目中的 browserslist 配置
  // 以及 `output.overrideBrowserslist`(优先级更高) 配置
  overrideBrowserslist: browserslist,
}
```

通过 `tools.autoprefixer` 可以修改 [autoprefixer](https://github.com/postcss/autoprefixer) 的配置。

### Object 类型

当 `tools.autoprefixer` 的值为 `Object` 类型时，会与默认配置通过 Object.assign 合并。比如：

```js
export default {
  tools: {
    autoprefixer: {
      flexbox: 'no-2009',
    },
  },
};
```

### Function 类型

当 `tools.autoprefixer` 为 Function 类型时，默认配置作为第一个参数传入，可以直接修改配置对象，也可以返回一个值作为最终结果。比如：

```js
export default {
  tools: {
    autoprefixer(config) {
      // 修改 flexbox 的配置
      config.flexbox = 'no-2009';
    },
  },
};
```
