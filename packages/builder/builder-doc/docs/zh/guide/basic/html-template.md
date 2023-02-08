# 配置 HTML 模板

在构建的过程中，Builder 会基于 HTML 模板文件和模板参数进行编译，生成若干份 HTML 文件。

Builder 提供了一些配置项来对 HTML 模板进行设置。通过本章节你可以了解到这些配置项的基本用法。

## 设置模板文件

通常来说，HTML 模板文件是由上层框架预先定义的。

比如在 Modern.js 框架中，默认会预设一份 HTML 模板，同时也支持用户自定义模板的内容。你可以阅读 [「Modern.js - HTML 模板」](https://modernjs.dev/docs/guides/basic-features/html) 章节来了解相关内容。

在 Builder 中，你可以使用 [html.template](/api/config-html.html#htmltemplate) 和 [html.templateByEntries](/api/config-html.html#htmltemplatebyentries) 配置项来设置自定义的 HTML 模板文件。

```ts
export default {
  html: {
    template: './static/index.html',
  },
};
```

## 设置页面标题

你可以通过 [html.title](/api/config-html.html#htmltitle) 和 [html.titleByEntries](/api/config-html.html#htmltitlebyentries) 配置项来设置 HTML 的 `<title>` 标签。

当你的项目中只有一个页面时，直接使用 `html.title` 设置即可：

```ts
export default {
  html: {
    title: 'example',
  },
};
```

当你的项目中有多个页面时，请使用 `html.titleByEntries` 来为不同的页面设置对应的标题，`html.titleByEntries` 使用页面的「入口名称」作为 key。

```ts
export default {
  html: {
    titleByEntries: {
      foo: 'Foo',
      bar: 'Bar',
    },
  },
};
```

## 设置页面图标

Builder 支持设置 [favicon](https://developer.mozilla.org/en-US/docs/Glossary/Favicon) 图标 和 iOS 系统下的 [apple-touch-icon](https://webhint.io/docs/user-guide/hints/hint-apple-touch-icons/) 图标。

你可以通过 [html.favicon](/api/config-html.html#htmlfavicon) 和 [html.faviconByEntries](/api/config-html.html#htmlfaviconbyentries) 配置项来设置 favicon 图标。

```ts
export default {
  html: {
    favicon: './src/assets/icon.png',
  },
};
```

也可以通过 [html.appIcon](/api/config-html.html#htmlappicon) 配置项来设置 iOS 下的 apple-touch-icon 图标。

```ts
export default {
  html: {
    appIcon: './src/assets/icon.png',
  },
};
```

## 设置 meta 标签

你可以通过 [html.meta](/api/config-html.html#htmlmeta) 和 [html.metaByEntries](/api/config-html.html#htmlmetabyentries) 配置项来设置 HTML 的 `<meta>` 标签。

比如设置 description：

```ts
export default {
  html: {
    meta: {
      description: 'a description of the page',
    },
  },
};
```

最终在 HTML 中生成的 meta 标签为：

```html
<meta name="description" content="a description of the page" />
```

## 设置模板参数

在 HTML 模板中，你可以使用丰富的模板参数，Builder 默认注入的模板参数包括：

```ts
type DefaultParameters = {
  meta: string; // 对应 html.meta 配置
  title: string; // 对应 html.title 配置
  mountId: string; // 对应 html.mountId 配置
  entryName: string; // 入口名称
  assetPrefix: string; // 对应 output.assetPrefix 配置
  compilation: webpack.Compilation; // 对应 webpack 的 compilation 对象
  webpackConfig: Configuration; // webpack 配置
  // htmlWebpackPlugin 内置的参数
  // 详见 https://github.com/jantimon/html-webpack-plugin
  htmlWebpackPlugin: {
    tags: object;
    files: object;
    options: object;
  };
};
```

你也可以通过 [html.templateParameters](/api/config-html.html#htmltemplateparameters) 和 [html.templateParametersByEntries](/api/config-html.html#htmltemplateparametersbyentries) 配置项来传入自定义的模板参数。

比如：

```ts
export default {
  html: {
    templateParameters: {
      text: 'World',
    },
  },
};
```

接下来，你可以在 HTML 模板中，通过 `<%= text %>` 来读取参数：

```js
<div>hello <%= text %>!</div>
```

经过编译后的最终 HTML 代码如下：

```js
<div>hello world!</div>
```

## 模板引擎

Builder 支持 [Lodash Template](https://www.lodashjs.com/docs/lodash.template)、[EJS](https://ejs.co/)、[Pug](https://pugjs.org/) 等多个模板引擎，默认使用最基础的 Lodash Template 作为模板引擎。

### [Lodash Template](https://www.lodashjs.com/docs/lodash.template)

当模板文件的后缀为 `.html` 时，Builder 会使用 Lodash Template 对模板进行编译。

例如，在模板中定义一个 `text` 参数，值为 `'world'`，在构建时会自动将 `<%= text %>` 替换为对应的值。

```html
<!-- 输入  -->
<div>hello <%= text %>!</div>

<!-- 输出 -->
<div>hello world!</div>
```

请阅读 [Lodash Template](https://www.lodashjs.com/docs/lodash.template) 文档来了解完整用法。

### [EJS](https://ejs.co/)

当模板文件的后缀为 `.ejs` 时，Builder 会使用 EJS 模板引擎对模板进行编译。EJS 是一套简单的模板语言，支持直接在标签内书写简单、直白的 JavaScript 代码，并通过 JavaScript 输出最终所需的 HTML。

例如，你可以先通过 [html.template](/api/config-html.html#htmltemplate) 配置项来引用一个 `.ejs` 模板文件：

```ts
export default {
  html: {
    template: './static/index.ejs',
  },
};
```

接着在模板中定义一个 `user` 参数，值为 `{ name: 'Jack' }`。在构建时，会自动将 `<%= user.name %>` 替换为对应的值。

```html
<!-- 输入  -->
<% if (user) { %>
<h2><%= user.name %></h2>
<% } %>

<!-- 输出 -->
<h2>Jack</h2>
```

请阅读 [EJS](https://ejs.co/) 文档来了解完整用法。

### [Pug](https://pugjs.org/)

当模板文件的后缀为 `.pug` 时，Builder 会使用 Pug 模板引擎对模板进行编译。Pug 是一款健壮、灵活、功能丰富的模板引擎，专门为 Node.js 平台开发。

使用 Pug 模板前，需要开启 [tools.pug](/api/config-tools.html#toolspug) 配置项，并通过 [html.template](/api/config-html.html#htmltemplate) 配置项来引用一个 `.pug` 模板文件：

```ts
export default {
  html: {
    template: './static/index.pug',
  },
  tools: {
    pug: true,
  },
};
```

开启后，你可以在 `.pug` 模板中使用 Pug 语法：

```html
<!-- 输入  -->
p Hello #{text}!

<!-- 输出 -->
<p>Hello World!</p>
```

请阅读 [Pug](https://pugjs.org/) 文档来了解完整用法。

## 注入标签

通过配置 `html.tags` 选项可以在最终生成的 HTML 产物中插入任意标签。

:::warning 使用场景
前端应用的产物最终都会直接或间接地被 HTML 入口引用，但大多数时候直接向 HTML 注入标签都并非首选。
:::

模版文件中可以通过 `htmlWebpackPlugin.tags` 变量来访问需要最终注入到 HTML 的所有标签：

```html
<html>
  <head>
    <%= htmlWebpackPlugin.tags.headTags %>
  </head>
  <body>
    <%= htmlWebpackPlugin.tags.bodyTags %>
  </body>
</html>
```

`html.tags` 的作用就是调整这些模板变量进而修改 HTML，配置的具体定义参考 [API References](/api/config-html.html#htmltags)。

### 对象形式

```ts
export default {
  output: {
    assetPrefix: '//example.com/'
  },
  html: {
    tags: [
      { tag: 'script', attrs: { src: 'a.js' } },
      { tag: 'script', attrs: { src: 'b.js' }, append: false },
      { tag: 'link', attrs: { href: 'style.css', rel: 'stylesheet' }, append: true }
      { tag: 'link', attrs: { href: 'page.css', rel: 'stylesheet' }, publicPath: false }
      { tag: 'script', attrs: { src: 'c.js' }, head: false },
      { tag: 'meta', attrs: { name: 'referrer', content: 'origin' } },
    ],
  },
};
```

标签最终的插入位置由 `head` 和 `append` 选项决定，两个配置相同的元素将被插入到相同区域，并且维持彼此之间的相对位置。

标签默认会启用 `publicPath` 配置，即会将 `output.assetPrefix` 的值拼接到 `script` 标签的 `src` 等表示路径的属性上。

所以以上配置构建出的 HTML 产物将会类似：

```html
<html>
  <head>
    <script src="//example.com/b.js"></script>
    <link href="//example.com/style.css" rel="stylesheet">
    <link href="page.css" rel="stylesheet">
    <!-- some other headTags... -->
    <script src="//example.com/a.js"></script>
    <meta name="referrer" content="origin">
  </head>
  <body>
    <!-- some other bodyTags... -->
    <script src="//example.com/c.js"></script>
  </body>
</html>
```

### 函数形式

`html.tags` 也支持传入回调函数，常用于修改标签列表或是在插入标签的同时确保其相对位置：

```typescript
export default {
  html: {
    tags: [
      tags => { tags.splice(0, 1); },
      { tag: 'script', attrs: { src: 'a.js' }, head: false },
      { tag: 'script', attrs: { src: 'b.js' }, append: false },
      { tag: 'script', attrs: { src: 'c.js' } },
      tags => [...tags, { tag: 'script', attrs: { src: 'd.js' } }],
    ],
  },
};
```

最终产物将会类似：

```html
<html>
  <head>
    <!-- some other headTags... -->
    <script src="//example.com/c.js"></script>
    <script src="//example.com/d.js"></script>
  </head>
  <body>
    <!-- some other bodyTags... -->
    <script src="//example.com/a.js"></script>
  </body>
</html>
```
