- **类型：** `boolean | object`
- **默认值：** `false`

通过设置 `output.convertToRem`，Builder 可进行如下处理：

- 将 CSS 中的 px 转成 rem
- 在 HTML 模版中插入运行时代码，对根元素 fontSize 进行设置

### Boolean 类型

当设置 `output.convertToRem` 为 `true`，将开启 rem 处理能力。

```js
export default {
  output: {
    convertToRem: true,
  },
};
```

此时，rem 配置默认如下：

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

### Object 类型

当 `output.convertToRem` 的值为 `object` 类型时，Builder 会根据当前配置进行 rem 处理。

选项：

| 名称                     | 类型       | 默认值                                                                                                                                  | 描述                                                                                                                                          |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| enableRuntime            | `boolean`  | `true`                                                                                                                                  | 是否自动生成 runtime 代码来动态计算根元素字体大小                                                                                             |
| inlineRuntime            | `boolean`  | `true`                                                                                                                                  | 是否将 runtime 代码内联到 HTML 文件中。如果设置为 `false`，运行时代码会被抽取为一个独立的 `convert-rem.[version].js` 文件，并输出到产物目录下 |
| rootFontSize             | `number`   | `50`                                                                                                                                    | 根元素字体值                                                                                                                                  |
| maxRootFontSize          | `number`   | `64`                                                                                                                                    | 最大根元素字体值                                                                                                                              |
| widthQueryKey            | `string`   | `'' `                                                                                                                                   | 根据 widthQueryKey 的值去 url query 中取 client width                                                                                         |
| screenWidth              | `number`   | `375`                                                                                                                                   | UI 设计图宽度                                                                                                                                 |
| excludeEntries           | `string[]` | `[]`                                                                                                                                    | 设置不注入 runtime 代码的页面入口，通常需要配合 `pxtorem.exclude` 使用                                                                        |
| supportLandscape         | `boolean`  | `false`                                                                                                                                 | 横屏时使用 height 计算 rem                                                                                                                    |
| useRootFontSizeBeyondMax | `boolean`  | `false`                                                                                                                                 | 超过 maxRootFontSize 时，是否使用 rootFontSize                                                                                                |
| pxtorem                  | `object`   | <ul><li>rootValue。默认与 rootFontSize 相同 </li><li>unitPrecision: 5。精确位数 </li><li>propList: ['*']。支持转换的 CSS 属性</li></ul> | [postcss-pxtorem](https://github.com/cuth/postcss-pxtorem#options) 插件属性                                                                   |

### 示例

```js
export default {
  output: {
    convertToRem: {
      rootFontSize: 30,
      excludeEntries: ['404', 'page2'],
      pxtorem: {
        propList: ['font-size'],
      },
    },
  },
};
```
