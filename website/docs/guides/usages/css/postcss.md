---
sidebar_position: 3
---

# PostCSS

[PostCSS](https://postcss.org/) 是一个用 JavaScript 工具和插件转换 CSS 代码的工具。Modern.js 内置 PostCSS，并集成 [Autoprefixer](https://github.com/postcss/autoprefixer) 等常用的 PostCSS 插件，能够满足大多数项目的样式开发需求。

默认情况下，Modern.js 会对 CSS 进行以下编译和转换：

1. [Autoprefixer](https://github.com/postcss/autoprefixer) 根据需要支持的浏览器范围，会自动为 CSS 规则添加需要的浏览器厂商前缀。Modern.js 默认支持的浏览器范围为：`['> 0.01%', 'not dead', 'not op_mini all']`。

  :::info 注意
    - 【支持的浏览器范围为：`> 0.01%`】是指浏览器市场份额大于 0.01%。
    - `not dead` 是指不包含官方不再支持的浏览器和过去24个月没有更新的浏览器。
    - `not op_mini all` 是指不包含 Opera Mini。
  :::

  :::info 补充信息
    如果需要修改默认浏览器支持范围，可以在项目的 `package.json` 文件中配置 `browserslist`，设置规则参考 [Browserslist](https://github.com/browserslist/browserslist) 的使用，下面是一个示例：
    ``` json title="package.json"
    {
      "browserslist": [
        "last 1 version",
        "> 1%",
        "IE 10"
      ]
    }
    ```
  :::

2. 提供 [CSS custom properties](https://www.w3.org/TR/css-variables-1/) 支持，可以在 CSS 中定义和使用自定义变量，如：

  ```css
  :root {
    --main-bg-color: pink;
  }

  body {
    background-color: var(--main-bg-color);
  }
  ```

3. 提供 [CSS Nesting](https://drafts.csswg.org/css-nesting-1/) 支持，可以在 CSS 中使用嵌套写法，如：

  ```css
  table.colortable td {
    text-align: center;
  }
  table.colortable td.c {
    text-transform: uppercase;
  }
  ```
  也可以改写成 CSS 嵌套写法：
  ```css
  table.colortable {
    & td {
      text-align: center;
      &.c { text-transform: uppercase }
    }
  }
  ```

4. 修复已知的 [Flexbugs](https://github.com/philipwalton/flexbugs) 。
5. 对以下 CSS 特性提供兼容：
    - [`initial` 属性值](https://developer.mozilla.org/en-US/docs/Web/CSS/initial_value)
    - [`break-` 属性](https://developer.mozilla.org/en-US/docs/Web/CSS/break-after)
    - [`font-variant`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant)
    - [Media Query Ranges](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries#syntax_improvements_in_level_4)

  当需要修改 PostCSS 配置时，可以通过底层配置 [`tools.postcss`](/docs/apis/config/tools/postcss) 来实现，下面是一个示例：

```js title="modern.config.js"
export default defineConfig({
  tools: {
    postcss: {
      plugins: ['autoprefixer', ('postcss-flexbugs-fixes': {})],
    },
  },
});
```
