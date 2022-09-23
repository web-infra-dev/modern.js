# 功能导航

在这里，你可以了解到 Modern.js Builder 支持的主要功能。

## JavaScript 编译

| 功能 | 描述 | 相关链接 |
| --- | --- | --- |
| Babel 编译 | 默认开启 Babel 编译，内置多个 Babel 插件 | <ul><li>[tools.babel](/zh/api/config-tools.html#tools-babel)</li></ul> |
| TS 编译 | 默认通过 Babel 编译 TS 文件，支持切换为 `ts-loader` 编译 | <ul><li>[tools.babel](/zh/api/config-tools.html#tools-babel)</li><li>[tools.tsLoader](/zh/api/config-tools.html#tools-tsloader)</li></ul> |
| TS 类型检查 | 默认通过 TS Checker 检查类型问题 | <ul><li>[tools.tsChecker](/zh/api/config-tools.html#tools-tschecker)</li></ul> |
| JS 压缩 | 默认在生产环境构建时开启压缩 | <ul><li>[tools.terser](/zh/api/config-tools.html#tools-terser)</li></ul> |
| Polyfill | 默认会注入 core-js 等 Polyfill | <ul><li>[output.polyfill](/zh/api/config-output.html#output-polyfill)</li></ul> |
| SourceMap 生成 | 默认在生产环境构建时生成高质量 SourceMap | <ul><li>[output.disableSourceMap](/zh/api/config-output.html#output-disablesourcemap)</li></ul> |
| 文件别名 | 可选功能，通过 alias 设置文件别名 | <ul><li>[source.alias](/zh/api/config-source.html#source-alias)</li></ul> |
| 限制源代码路径 | 可选功能，限制源代码的引用路径 | <ul><li>[source.moduleScopes](/zh/api/config-source.html#source-modulescopes)</li></ul> |

## CSS 编译

| 功能 | 描述 | 相关链接 |
| --- | --- | --- |
| PostCSS 编译 | 默认开启 PostCSS 编译，内置 autoprefixer 等多个插件 | <ul><li>[tools.postcss](/zh/api/config-tools.html#tools-postcss)</li><li>[tools.autoprefixer](/zh/api/config-tools.html#tools-autoprefixer)</li></ul> |
| Sass 预处理 | 默认支持编译 `.scss` 和 `.sass` 文件 | <ul><li>[tools.sass](/zh/api/config-tools.html#tools-sass)</li></ul> |
| Less 预处理 | 默认支持编译 `.less` 文件 | <ul><li>[tools.less](/zh/api/config-tools.html#tools-less)</li></ul> |
| CSS Modules 编译 | 默认支持编译 `*.module.*` 文件 | <ul><li>[tools.cssLoader](/zh/api/config-tools.html#tools-cssloader)</li></ul> |
| CSS Modules 类型提示 | 可选功能，自动生成 CSS Modules 的类型定义文件 | <ul><li>[enableCssModuleTSDeclaration](/zh/api/config-output.html#output-enablecssmoduletsdeclaration)</li></ul> |
| CSS 压缩 | 默认在生产环境构建时开启压缩 | <ul><li>[tools.minifyCss](/zh/api/config-tools.html#tools-minifycss)</li></ul> |
| 抽取 CSS 文件 | 默认会将 CSS 抽取为独立的文件 | <ul><li>[tools.cssExtract](/zh/api/config-tools.html#tools-cssextract)</li></ul> |
| Styled Components | 默认支持 styled-components 编译 | <ul><li>[tools.styledComponents](/zh/api/config-tools.html#tools-styledcomponents)</li></ul> |
| 将 CSS 插入到 JS 中 | 可选功能，通过 `style-loader` 插入样式 | <ul><li>[tools.styleLoader](/zh/api/config-tools.html#tools-styleloader)</li></ul> |

## HTML 编译

| 功能 | 描述 | 相关链接 |
| --- | --- | --- |
| 设置标题 | 设置 HTML 的 title 标签 | <ul><li>[html.title](/zh/api/config-html.html#html-title)</li><li>[html.titleByEntries](/zh/api/config-html.html#html-titlebyentries)</li></ul> |
| 设置 meta | 设置 HTML 的 meta 标签 | <ul><li>[html.meta](/zh/api/config-html.html#html-meta)</li><li>[html.metaByEntries](/zh/api/config-html.html#html-metabyentries)</li></ul> |
| 设置 favicon | 设置页面的 favicon 图标 | <ul><li>[html.favicon](/zh/api/config-html.html#html-favicon)</li><li>[html.faviconByEntries](/zh/api/config-html.html#html-faviconbyentries)</li></ul> |
| 设置 app 图标 | 设置 iOS 系统下的 app icon | <ul><li>[html.appIcon](/zh/api/config-html.html#html-appicon)</li></ul> |
| 使用 pug 模板 | 可选功能，使用 pug 模板语法 | <ul><li>[tools.pug](/zh/api/config-tools.html#tools-pug)</li></ul> |
| 内联 JS 文件 | 可选功能，将 JS 内联到 HTML 中 | <ul><li>[output.enableInlineScripts](/zh/api/config-output.html#output-enableinlinescripts)</li></ul> |
| 内联 CSS 文件 | 可选功能，将 CSS 内联到 HTML 中 | <ul><li>[output.enableInlineStyles](/zh/api/config-output.html#output-enableinlinestyles)</li></ul> |

## React 相关

| 功能 | 描述 | 相关链接 |
| --- | --- | --- |
| React Refresh | 默认支持 React Refresh 热更新 | <ul><li>[dev.hmr](/zh/api/config-dev.html#dev-hmr)</li></ul> |
| SVG 转 React 组件 | 默认支持在 React 组件中引用 SVG 作为组件 | <ul><li>[output.svgDefaultExport](/zh/api/config-output.html#output-svgdefaultexport)</li></ul> |

## 静态资源相关

| 功能 | 描述 | 相关链接 |
| --- | --- | --- |
| 内联静态资源 | 默认将体积较小的图片等资源内联到 JS 中 | <ul><li>[output.dataUriLimit](/zh/api/config-output.html#output-dataurilimit)</li></ul> |
| 清理静态资源 | 每次开始构建前，自动清理 dist 目录下的静态资源 | <ul><li>[output.cleanDistPath](/zh/api/config-output.html#output-cleandistpath)</li></ul> |
| 拷贝静态资源 | 可选功能，将静态资源拷贝到 dist 目录下 | <ul><li>[output.copy](/zh/api/config-output.html#output-copy)</li></ul> |
| 生成 manifest 文件 | 可选功能，生成包含静态资源信息的 manifest 文件 | <ul><li>[output.enableAssetManifest](/zh/api/config-output.html#output-enableassetmanifest)</li></ul> |

## 性能相关

| 功能 | 描述 | 相关链接 |
| --- | --- | --- |
| 展示产物体积 | 在生产环境构建后，默认展示所有静态资源的体积信息 | - |
| 分析产物体积 | 可选功能，通过 Bundle Analyzer 分析产物体积 | <ul><li>[performance.bundleAnalyze](/zh/api/config-performance.html#performance-bundleanalyze)</li></ul> |
| 移除 console | 可选功能，移除代码中的 `console.xx` | <ul><li>[performance.removeConsole](/zh/api/config-performance.html#performance-removeconsole)</li></ul> |
| 优化 moment.js 体积 | 可选功能，移除 moment.js 多余的 locale 文件 | <ul><li>[performance.removeMomentLocale](/zh/api/config-performance.html#performance-removemomentlocale)</li></ul> |
