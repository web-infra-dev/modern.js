# 引用样式资源

Builder 支持处理多种样式资源, 例如：Less, Sass。除此之外，Builder 也提供多种配置来处理你的样式资源。

## 使用 CSS Modules

Builder 提供开箱即用的 [CSS Modules](https://github.com/css-modules/css-modules)， 无需你额外的配置。当然若你想自定义 CSS Modules 相关配置，你可以通过 [tools.css-loader](/zh/api/config-tools.html#css-loader) 进行自定义。

自定义生成的类名也是我们比较常用的功能，你除了可以使用 [tools.cssLoader](/zh/api/config-tools.html#tools-cssloader) 来进行自定义，还可以使用 [output.cssModuleLocalIdentName](/zh/api/config-output.html#output-cssmodulelocalidentname) 来进行配置。

在默认情况下，只有 `*.module.css` 结尾的文件才被视为 CSS Modules 模块。如果你想去掉文件名中的 `.module`，可以通过开启 [output.disableCssModuleExtension](/zh/api/config-output.html#output-disablecssmoduleextension) 来实现，比如：

```ts
import styles1 from './foo.module.css';
import styles2 from './bar.css';
```

以上两个文件都会被视为 CSS Modules，
不过我们不太推荐开启该配置项，这样不利于项目长期维护。

## 使用 Less 和 Sass

Builder 已内置了社区流行的 CSS 预处理器，例如 Less , Sass。 无需你额外的配置，即可开箱即用，当然你也可以通过配置 [tools.less](/zh/api/config-tools.html#tools-less) 、 [tools.sass](/zh/api/config-tools.html#tools-sass) 来自定义 loader。

## 使用 PostCSS

Builder 内置了 [PostCSS](https://postcss.org/)。

你可以通过 [tools.postcss](/zh/api/config-tools.html#tools-postcss) 来配置 postcss-loader。

在默认情况下，我们开启了 [autoprefixer](https://github.com/postcss/autoprefixer) 来自动补齐 CSS 的浏览器前缀。如果你需要配置目标浏览器，可使用 [output.overrideBrowserslist](/zh/api/config-output.html#output-overridebrowserslist) 进行配置。

## CSS 压缩

通常情况下，在生产环境我们会将 CSS 、JS 等静态资源进行压缩，以此达到更好的传输效率。Builder 通过 [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) 在生产环境构建时自动压缩 CSS 代码。

你可以通过配置 [tools.minifyCss](/zh/api/config-tools.html#tools-minifycss) 来对它进行更自定义的配置。

## CSS 单文件

默认情况下，Builder 会把 CSS 提取为独立的 `.css` 文件，并输出到构建产物目录。

如果你希望将样式能内联到 JS 文件中，你可以将 [output.disableCssExtract](/zh/api/config-output.html#output-disablecssextract) 设置为 true, 来禁止 CSS 提取逻辑。
浏览器请求到 JS 文件后，JS 将动态地向 Html 插入 `<style>` 标签，以此加载 CSS 样式。

这将会增大你 JS Bundle 的体积，因此通常情况下，不太建议你禁止 CSS 提取逻辑。
