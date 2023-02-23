# 引用样式资源

Builder 内置多种常用的样式资源处理方式，包括 Less / Sass 预处理器、PostCSS、CSS Modules、CSS 内联和 CSS 压缩。

除此之外，Builder 也提供了多个配置项来自定义样式资源的处理规则。

## 使用 Less、Sass 和 Stylus

Builder 内置了社区流行的 CSS 预处理器，包括 Less 和 Sass。

默认情况下，你不需要对 Less 和 Sass 进行任何配置。如果你有自定义 loader 配置的需求，可以通过配置 [tools.less](/api/config-tools.html#toolsless)、[tools.sass](/api/config-tools.html#toolssass) 来进行设置。

你也可以在 Builder 中使用 Stylus，只需要安装 Builder 提供的 Stylus 插件即可，使用方式请参考 [Stylus 插件](/plugins/plugin-stylus.html)。

## 使用 PostCSS

Builder 内置了 [PostCSS](https://postcss.org/) 来转换 CSS 代码。你可以通过 [tools.postcss](/api/config-tools.html#toolspostcss) 来配置 postcss-loader。

```ts
export default {
  tools: {
    postcss: opts => {
      const viewportPlugin = require('postcss-px-to-viewport')({
        viewportWidth: 375,
      });
      opts.postcssOptions.plugins.push(viewportPlugin);
    },
  },
};
```

### 内置 PostCSS 插件

Builder 内置了一些 PostCSS 插件，会对 CSS 进行以下转换：

- [autoprefixer](https://github.com/postcss/autoprefixer)：在默认情况下，我们开启了 autoprefixer 来自动补齐 CSS 的浏览器前缀。如果你需要配置目标浏览器，可使用 [output.overrideBrowserslist](/api/config-output.html#outputoverridebrowserslist) 进行配置。
- [postcss-nesting](https://www.npmjs.com/package/postcss-nested)：提供 [CSS Nesting](https://drafts.csswg.org/css-nesting-1/) 支持，可以在 CSS 中使用嵌套写法，如：

```css
.my-table {
  & td {
    text-align: center;

    &.c {
      text-transform: uppercase;
    }
  }
}
```

- [postcss-flexbugs-fixes](https://www.npmjs.com/package/postcss-flexbugs-fixes)：用于修复已知的 [Flex Bugs](https://github.com/philipwalton/flexbugs)。
- [postcss-initial](https://www.npmjs.com/package/postcss-initial)：仅在需要兼容低版本浏览器时启用，提供对 [`initial` 属性值](https://developer.mozilla.org/en-US/docs/Web/CSS/initial_value) 的兼容。
- [postcss-page-break](https://www.npmjs.com/package/postcss-page-break)：仅在需要兼容低版本浏览器时启用，提供对 [`break-` 属性](https://developer.mozilla.org/en-US/docs/Web/CSS/break-after) 的兼容。
- [postcss-font-variant](https://www.npmjs.com/package/postcss-font-variant)：仅在需要兼容低版本浏览器时启用，提供对 [`font-variant`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant) 的兼容。
- [postcss-media-minmax](https://www.npmjs.com/package/postcss-media-minmax)：仅在需要兼容低版本浏览器时启用，提供对 [Media Query Ranges](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries#syntax_improvements_in_level_4) 的兼容。
- [postcss-custom-properties](https://www.npmjs.com/package/postcss-custom-properties)：仅在需要兼容低版本浏览器时启用，提供对 [Custom Properties](https://www.w3.org/TR/css-variables-1/) 的兼容，你可以在 CSS 中定义和使用自定义变量，如：

```css
:root {
  --main-bg-color: pink;
}

body {
  background-color: var(--main-bg-color);
}
```

## 使用 CSS Modules

请阅读 [使用 CSS Modules](/guide/basic/css-modules.html) 章节来了解 CSS Modules 的完整用法。

## CSS 压缩

通常情况下，在生产环境我们会将 CSS、JS 等静态资源进行压缩，以达到更好的传输效率。

Builder 通过 [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) 在生产环境构建时自动压缩 CSS 代码（底层使用的压缩工具为 [cssnano](https://cssnano.co/)）。

你可以通过 [tools.minifyCss](/api/config-tools.html#toolsminifycss) 配置项来修改 `css-minimizer-webpack-plugin`的配置。

:::tip 关于 cssnano
cssnano 是一个用于优化和压缩 CSS 文件的工具。它通过删除未使用的规则、合并相同的规则、移除注释和空白符以及转换长度单位等方式来减小 CSS 文件的体积，从而提升网站的加载速度。
:::

## 内联 CSS 文件

默认情况下，Builder 会把 CSS 提取为独立的 `.css` 文件，并输出到构建产物目录。

如果你希望将样式内联到 JS 文件中，可以将 [output.disableCssExtract](/api/config-output.html#outputdisablecssextract) 设置为 `true` 来禁用 CSS 提取逻辑。当浏览器请求到 JS 文件后，JS 将动态地向 HTML 插入 `<style>` 标签，以此加载 CSS 样式。

```ts
export default {
  output: {
    disableCssExtract: true,
  },
};
```

这将会增大你的 JS Bundle 体积，因此通常情况下，不太建议禁用 CSS 提取逻辑。

## 引用 node_modules 里的样式

你可以直接引用 node_modules 里的样式文件。

- 在组件中引用：

```ts title="src/App.tsx"
// 引用 Arco Design 样式：
import '@arco-design/web-react/dist/css/arco.css';
```

- 在样式文件中引用：

```css title="src/App.css"
/* 引用 normalize.css */
/* https://github.com/necolas/normalize.css */
@import 'normalize.css';

body {
  /* */
}
```
