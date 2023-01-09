---
title: HTML 模板
sidebar_position: 9
---

Modern.js 提供了 **JSX 语法**和**HTML(Ejs) 语法**两种方式用于自定义 HTML 模板。

## JSX 语法

Modern.js 约定，在 `src/` 目录下，或在入口目录下，可以创建 `Document.[jt]sx` 并默认导出组件。该组件的渲染结果可以作为入口的 HTML 模板。

例如以下目录结构：

```bash
.
├── src
│   ├── Document.tsx
│   ├── entry-a
│   │   ├── Document.tsx
│   │   └── routes
│   ├── entry-b
│   │   └── routes
│   └── modern-app-env.d.ts
```

`entry-a` 会优先使用当前入口下的 `Docoument.[jt]sx` 文件。如果当前入口没有 `Document.[jt]sx` 文件，例如 `entry-b`，则会查找根目录下的 `Document.[jt]sx` 文件。

如果还没有，则会兜底到传统模板的逻辑。

### HTML 组件

Modern.js 提供了一些列渲染页面的组件，用来帮助开发者生成模板，可以从 `@modern-js/runtime/document` 中导出这些组件：

```tsx
import { Html, Body, Root, Head, Scripts } from '@modern-js/runtime/document';
```

这些组件分别渲染：

- `Html`：提供原生 HTML Element 的能力，并能默认渲染开发者未添加的必须的组件。`<Head>` 和 `<Body>` 是必须要存在的，其它组件可以按需选择合适的组件进行组装。

- `Body`：提供原生 Body Element 的能力，内部需要包含 `<Root>` 组件，也支持其它元素同时作为子元素，例如添加页脚。

- `Root`：渲染的根节点 `<div id='root'></div>`。默认根节点的 `id = 'root'`。可以设置 `props.rootId` 来更改 id 属性。可以添加子组件，也会被渲染到 HTML 模板中，当 React 渲染完成后会被覆盖，一般用来实现全局 Loading。

- `Head`：提供原生 Head Element 的能力，并会自动填充 `<meta>`，以及 `<Scripts>` 组件。

- `Scripts`：构建产生的 script 内容，可用于调整构建产物的位置，默认放在 `<Head>` 组件中。

### 模板参数

因为是 JSX 形式，`Document.[jt]sx` 里，可以比较自由的在组件内使用各种变量去赋值给各种自定义组件。

Modern.js 也提供了 `DocumentContext` 来提供一些配置、环境参数，方便直接获取。主要以下参数：

- `processEnv`：提供构建时的 `process.env`
- `config`：Modern.js 项目的配置。目前只暴露出 output 相关的配置
- `entryName`：当前的入口名
- `templateParams`：HTML 模板的参数（为了兼容传统模板，不推荐使用）

### 示例

```tsx
import React, { useContext } from 'react';
import {
  Html,
  Root,
  Head,
  Body,
  Scripts,
  DocumentContext,
} from '@modern-js/runtime/document';

export default function Document(): React.ReactElement {
  // DocumentContext 提供一些构建时的参数
  const {
    config: { output: htmlConfig },
    entryName,
    templateParams,
  } = useContext(DocumentContext);

  return (
    <Html>
      <Head>
        <link href="https://modernjs.dev">Modern.js</link>
      </Head>
      <Body>
        <Root rootId="root">
          <h1 style={{ color: 'red' }}>以下为构建时传过来的参数：</h1>
          <h2> entryName：{entryName}</h2>
          <h2> title：{htmlConfig.title}</h2>
          <h2> rootId: {templateParams.mountId}</h2>
        </Root>
        <h1>bottom</h1>
      </Body>
    </Html>
  );
}
```

以上 JSX 组件，将会生成以下 HTML 模板：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="renderer" content="webkit" />
    <meta name="layoutmode" content="standard" />
    <meta name="imagemode" content="force" />
    <meta name="wap-font-scale" content="no" />
    <meta name="format-detection" content="telephone=no" />
    <script>
      ...
    </script>
    <script defer src="/static/js/lib-react.js"></script>
    <script defer src="/static/js/lib-polyfill.js"></script>
    <script defer src="/static/js/lib-router.js"></script>
    <script
      defer
      src="/static/js/vendors-node_modules_pnpm_loadable_component_5_15_2_react_18_2_0_node_modules_loadable_compon-3fb0cf.js"
    ></script>
    <script
      defer
      src="/static/js/packages_runtime_plugin-router-legacy_dist_js_treeshaking_runtime_index_js-packages_runtime_p-28f4c9.js"
    ></script>
    <script defer src="/static/js/sub.js"></script>
    <link href="https://www.baidu.com" />
  </head>

  <body>
    <div id="root">
      <!--<?- html ?>-->
      <h1 style="color:red">以下为构建时传过来的参数：</h1>
      <h2>entryName：sub</h2>
      <h2>title：</h2>
      <h2>rootId: root</h2>
    </div>
    <h1>bottom</h1>
    <!--<?- chunksMap.js ?>-->
    <!--<?- SSRDataScript ?>-->
  </body>
</html>
```

## Html 语法

Modern.js 也支持 HTML 语法。默认情况下，Modern.js 的应用工程中会内置一份 HTML 模板，用于生成 HTML 代码。

基于 HTML 语法的模板，Modern.js 提供了 **自定义 HTML 片段**和**完全自定义 HTML 模板**两种方式来自定义模板。

### 自定义 HTML 片段

在应用根目录下，创建 `config/html/` 目录，该目录下支持创建四种 HTML 片段。

- `top.html`
- `head.html`
- `body.html`
- `bottom.html`

**这些片段将按位置注入到默认的 HTML 模板中。**

```html
<!DOCTYPE html>
<html>
  <head>
    <%= meta %>
    <title><%= title %></title>
    <%= topTemplate %>

    <script>
      window.__assetPrefix__ = '<%= assetPrefix %>';
    </script>
    <%= headTemplate %>
    <!-- webpack inject css -->
  </head>
  <body>
    <noscript>
      We're sorry but react app doesn't work properly without JavaScript
      enabled. Please enable it to continue.
    </noscript>
    <div id="<%= mountId %>"></div>
    <%= bodyTemplate %>
    <!-- webpack inject js -->
    <!--<?- bottomTemplate ?>-->
  </body>
</html>
```

代码片段支持使用 [Lodash template](https://lodash.com/docs/4.17.15#template) 语法。

例如在 `body.html` 里插入一个外链脚本：

```html title="config/html/body.html"
<script src="//example.com/assets/a.js"></script>
```

:::info
自定义 HTML 片段的实现方式是将片段与框架内置的模板进行合并，由于框架的默认模板中已经存在 `<title>`，因此自定义 HTML 模板中的 title 标签无法生效，请通过 [html.title](/docs/configure/app/html/title) 来修改页面标题。
:::

### 完全自定义 HTML 模板

某些情况下，HTML 片段无法满足自定义需求，Modern.js 提供了完全自定义方式。

:::caution 注意
通常不建议直接覆盖默认的 HTML 模板，可能会失去一部分功能选项。即使需要替换，建议以内置模板为基础，按需修改。
:::

在 `config/html/` 目录下，创建 `index.html` 文件,该文件将替代默认的 HTML 模板。

:::info 注
内部默认 HTML 模板可以在 `node_modules/.modern-js/${entryName}/index.html` 中查看。
:::

### 模板参数

模板中使用的参数可以通过 [html.templateParameters](/docs/configure/app/html/template-parameters) 配置项来定义。

### 按入口设置

`config/html/` 目录中的 HTML 片段对应用中的所有入口都生效。如果希望按入口自定义 HTML 片段，可以在 `config/html/` 目录下新建一个以**入口名**命名的目录，然后在这个目录中自定义 HTML 片段。

例如，如下设置的 HTML 片段仅对入口 `entry1` 生效：

```bash
.
├── config/
│   └── html/
│       └── entry1
│           ├── head.html
│           └── body.html
└── src/
    ├── entry1/
    │   └── routes
    └── entry2/
        └── routes
```
