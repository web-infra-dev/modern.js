# 开启 REM 适配

Builder 支持通过 [output.convertToRem](/api/config-output.html#output-converttorem) 一键开启 REM 适配能力，能够根据屏幕大小来动态调整字体大小，让网页在不同大小的屏幕上都能够自适应显示。

## 开启 REM 的适配能力

开启 `convertToRem` 后，会对页面进行如下两个操作：

1. 将 CSS 属性中的 px 转成 rem。
2. 对根元素的字体大小进行动态设置。

```ts
export default {
  output: {
    convertToRem: true,
  },
};
```

## CSS 属性值转换

由于默认的 rootFontSize 为 50。开启 rem 转换后，会按照 1rem = 50px 的比例，对 CSS 样式做如下转换：

```css
/* input */
h1 {
  margin: 0 0 16px;
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: 1px;
}

/* output */
h1 {
  margin: 0 0 0.32rem;
  font-size: 0.64rem;
  line-height: 1.2;
  letter-spacing: 0.02rem;
}
```

Builder 默认会对所有 CSS 属性进行转换，如果希望仅对 font-size 属性进行转换，可通过设置 pxtorem.propList 实现。

```ts
export default {
  output: {
    convertToRem: {
      pxtorem: {
        propList: ['font-size'],
      },
    },
  },
};
```

## 根元素字体大小计算

页面根元素的字体大小的计算公式为：

```
根元素字体大小 = 当前客户端屏幕宽度  * 根元素字体值 / UI 设计图宽度

(即：pageRootFontSize = clientWidth * rootFontSize / screenWidth)
```

以屏幕宽度为 390 的手机端浏览器为例，根元素字体值的默认值为 50， UI 设计图宽度为 375。

此时计算出的页面根元素的字体大小为 52 (`390 * 50 / 375`)。
此时 1 rem 为 52px，CSS 样式中的 32px（0.64 rem），实际页面效果为 33.28 px。

```ts
export default {
  output: {
    convertToRem: {
      rootFontSize: 50,
      screenWidth: 375,
    },
  },
};
```

## 自定义最大根元素字体值

在桌面浏览器端，根据计算公式得到的页面根元素字体值往往过大，当计算出的结果超出了默认的最大根元素字体值时，则采用当前设置的最大根元素字体值为当前根元素字体值。

以屏幕宽度为 1920 的桌面浏览器为例，此时计算出的根元素的字体大小为 349，超出了最大根元素字体值 64。则采用 64 为当前的根元素字体值。

```ts
export default {
  output: {
    convertToRem: {
      maxRootFontSize: 64,
    },
  },
};
```

## 如何判断 REM 是否生效？

1. CSS：查看生成的 `.css` 文件中对应属性的值是否从 px 转换成 rem。
2. HTML：打开页面控制台查看 `document.documentElement.style.fontSize` 是否存在有效值。

## 如何获取页面实际生效的 rootFontSize 值？

页面实际生效的 rootFontSize 会根据当前页面的情况动态计算。 可通过打印 `document.documentElement.style.fontSize` 查看，也可通过 `window.ROOT_FONT_SIZE` 获取。
