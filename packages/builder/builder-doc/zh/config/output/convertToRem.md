- Type: `boolean | Object`
- Default: `false`

通过设置 `output.convertToRem`，Builder 可进行如下处理：
- 将 css 中的 px 转成 rem
- 在 html 模版中插入运行时代码，对根元素 fontSize 进行设置

#### Boolean 类型

当设置 `output.convertToRem` 为 `true`，将开启 REM 处理能力。

```js
export default {
  output: {
    convertToRem: true,
  },
};
```

此时，REM 配置默认如下： 

```js
{
  enableRuntime: true,
  rootFontSize: 50,
  screenWidth: 375,
  rootFontSize: 50,
  maxRootFontSize: 64,
  widthQueryKey: '',
  excludeEntries: [],
  supportLandscape: false,
  useRootFontSizeBeyondMax: false,
  pxtorem: {
    rootValue: 50,
    unitPrecision: 5,
    propList: ['*'],
  }
}
```

#### Object 类型

当 `output.convertToRem` 的值为 `Object` 类型时，Builder 会根据当前配置进行 REM 处理。

配置项说明：

| 属性名                   | 描述                                                    | 默认值                                                       |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| enableRuntime            | 开启 html 模版插入功能，注入运行时代码  | true                                                         |
| rootFontSize             | 根元素字体值                                                 | 50                                                           |
| maxRootFontSize          | 最大根元素字体值                                             | 64                                                           |
| widthQueryKey            | 根据 widthQueryKey 的值去 url query 中取 client width（默认取 innerWidth 和 clientWidth 中的较小值） | ''                                                           |
| screenWidth              | 屏幕宽度                               | 375                                                          |
| excludeEntries           | 不进行调整的页面入口                                         | []                                                           |
| supportLandscape         | 横屏时使用 height 计算 rem                                   | false                                                        |
| useRootFontSizeBeyondMax | 超过 maxRootFontSize 时，是否使用rootFontSize | false                                                        |
| pxtorem                  | [postcss-pxtorem](https://github.com/cuth/postcss-pxtorem#options) 插件属性 | - rootValue。默认与 rootFontSize 相同 - unitPrecision: 5。精确位数 - propList: ['*']。支持转换的 css 属性 |


#### 示例

```js
export default {
  output: {
    convertToRem: {
      rootFontSize: 30,
      pxtorem: {
        propList: ['font-size'],
      },
    },
  },
};
```
