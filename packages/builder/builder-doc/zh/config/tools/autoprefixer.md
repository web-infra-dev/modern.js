<<<<<<< HEAD
- Type: `Object | Function`
=======
- Type: `Object` | `Function`
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))
- Default

```js
{
  flexbox: 'no-2009',
<<<<<<< HEAD
  // browserslist 取决于项目中的 browserslist 配置
  // 以及 `output.overrideBrowserslist`(优先级更高) 配置
=======
  // browserslist 取决于项目中的 browserslist 配置及 `output.overrideBrowserslist`(优先级更高) 配置
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))
  overrideBrowserslist: browserslist,
}
```

通过 `tools.autoprefixer` 可以修改 [autoprefixer](https://github.com/postcss/autoprefixer) 的配置。

<<<<<<< HEAD
### Object 类型

当 `tools.autoprefixer` 的值为 `Object` 类型时，会与默认配置通过 Object.assign 合并。比如：
=======
### 类型

#### Object

当 `tools.autoprefixer` 配置为 `Object` 类型时，与默认配置通过 Object.assign 合并。比如：
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))

```js
export default {
  tools: {
    autoprefixer: {
      flexbox: 'no-2009',
    },
  },
};
```

<<<<<<< HEAD
### Function 类型
=======
#### Function
>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))

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
<<<<<<< HEAD
=======

>>>>>>> 80b002a8d (feat: add builder sass/less docs (#1745))
