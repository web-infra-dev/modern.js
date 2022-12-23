---
title: HTML 模板
sidebar_position: 9
---

Modern.js 提供了 **JSX 模板**和**传统模板**两种方式用于自定义 HTML 模板。

### 使用说明

#### 引入
```tsx
import {
  Html,
  Root,
  Head,
  DocumentContext,
  Body,
} from '@modern-js/runtime/document';
```

#### 导出
```tsx
export default Document() {}
```

#### 文件位置

Document 文件，默认在应用根目录下:

```bash
.
├── src
│   ├── modern-app-env.d.ts
│   ├── myapp
│   │   └── routes
│   │       ├── index.css
│   │       ├── layout.tsx
│   │       ├── Document.tsx
│   │       └── page.tsx
│   ├── new-entry
│   │   └── routes
│   │       ├── index.css
│   │       ├── layout.tsx
│   │       ├── Document.tsx
│   │       └── page.tsx
│   └── Document.tsx
├── modern.config.ts
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

多 entry 场景构建时，优先 entry 的根目录下的 Docoument.tsx 文件。如果当前 entry 没有 Document.tsx 文件，则会查找根目录下的 Document.tsx 文件。
如果还没有，则会 fallback 到 `html 模板` 的逻辑。

#### 子组件

Document 模板共提供了 `Html`、`Root` `Head` `Body` 渲染页面的组件，以及 `DocumentContext` 等提供
分别渲染：
- `Html`: 提供 html 原生 dom。并计算出 `DocumentStructrueContext` 的值，将 `Html` 的结构传递给子组件，判断其它子组件是否默认渲染。

- `Body`: 渲染生成 `body` 节点。其子元素包含 `Root` 组件。支持其它元素同时作为子元素，例如页脚。

- `Root`: 渲染的根节点 `<div id='root'></div>`。默认根节点的 `id = 'root'`。可以设置 props.rootId 来更改 id 属性。子元素，也会被渲染进 DOM 里，随着 react 渲染完成，会替换掉，一般用来实现全局 loading。

- `Head`: 渲染生成 `head` 节点。会自动填充 meta 元素，以及 `Scripts` 组件。

- `Scripts`: 将构建产生的 script 标签渲染到该位置。用于调整构建产物的位置，默认放在 `Head` 组件里，用于

`Html` 组件中，`Head` 和 `Body` 是必须要存在的，其它组件可以按需选择合适的组件进行组装。

#### 模板参数

因为是 JSX 形式，Document.tsx 里，可以比较自由的在组件内使用各种变量去赋值给各种自定义组件。
但同时 Document 自身也提供了 `DocumentContext` context 来提供一些配置、环境参数，方便直接获取。主要以下参数：

- `processEnv`：提供构建时的 `process.env`
- `config`: Modern.js 项目的配置。目前只暴露出 output 相关的配置
- `entryName`: 当前的 entry 名。
- `templateParams`: html 模板的参数，由 builder 提供。对应 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 的 `templateParameters` 配置项最终获取到的结果。不建议使用!


### 示例

```tsx
import React, { useContext } from 'react';
import {
  Html,
  Root,
  Head,
  DocumentContext,
  Body,
} from '@modern-js/runtime/document';
import Script from '@/components/Script';

// 默认导出
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
        // Head 组件支持自定义子元素。包括 link, script
        <link href="https://modernjs.dev">Modern.js</link>
        <script
          // inline script 的脚本需要如下处理
          dangerouslySetInnerHTML={{
            __html: `window.b = 22`,
          }}
        ></script>
      </Head>
      <Body>
        // rootId 可以更改根元素的 id
        <Root rootId="root">
          // Root 支持子元素
          <h1 style={{ color: 'red' }}>以下为构建时传过来的参数：</h1>
          <h2> entryName：{entryName}</h2>
          <h2> title：{htmlConfig.title}</h2>
          <h2> rootId: {templateParams.mountId}</h2>
        </Root>
        // Body 组件支持 Root 以外增加不同的组件，共同组成页面
        <h1>bottom</h1>
      </Body>
    </Html>
  );
}

```

以上文件，将会生成以下 html 文件：

```html
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport"
        content="width=device-width, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="renderer" content="webkit">
    <meta name="layoutmode" content="standard">
    <meta name="imagemode" content="force">
    <meta name="wap-font-scale" content="no">
    <meta name="format-detection" content="telephone=no">
    <script>...</script>
    <script defer src="/static/js/lib-react.js"></script>
    <script defer src="/static/js/lib-polyfill.js"></script>
    <script defer src="/static/js/lib-router.js"></script>
    <script defer
        src="/static/js/vendors-node_modules_pnpm_loadable_component_5_15_2_react_18_2_0_node_modules_loadable_compon-3fb0cf.js"></script>
    <script defer
        src="/static/js/packages_runtime_plugin-router-legacy_dist_js_treeshaking_runtime_index_js-packages_runtime_p-28f4c9.js"></script>
    <script defer src="/static/js/sub.js"></script>
    <link href="https://www.baidu.com" />
    <script>window.b = 22</script>
</head>

<body>
    <div id="root">
        <!--<?- html ?>-->
        <h1 style="color:red">以下为构建时传过来的参数：</h1>
        <h2> entryName：sub</h2>
        <h2> title：</h2>
        <h2> rootId: root</h2>
    </div>
    <h1>bottom</h1>
    <!--<?- chunksMap.js ?>-->
    <!--<?- SSRDataScript ?>-->
</body>

</html>
```

## EJS

Modern.js 同时支持了使用 `ejs` 语法编写模板，当项目中，没有编写 `Document.[j|t]sx` 文件时，将自动回退至  `ejs` HTML 模板。

默认情况下，Modern.js 的应用工程中会内置一份 HTML 模板，用于生成 HTML 代码。

Modern.js 提供了**「自定义 HTML 片段」**和**「完全自定义 HTML 模板」**两种方式来自定义模板。

## 自定义 HTML 片段

在应用根目录下，创建 `config/html/` 目录，该目录下支持创建四种 HTML 片段。

- `top.(html|ejs)`
- `head.(html|ejs)`
- `body.(html|ejs)`
- `bottom.(html|ejs)`

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
    We're sorry but react app doesn't work properly without JavaScript enabled. Please enable it to continue.
  </noscript>
  <div id="<%= mountId %>"></div>
  <%= bodyTemplate %>
  <!-- webpack inject js -->
  <!--<?- bottomTemplate ?>-->
</body>
</html>
```

代码片段支持 [EJS](https://ejs.co/) 语法（默认使用 [Lodash template](https://lodash.com/docs/4.17.15#template) 语法）。

例如，新增 `head.ejs` 文件，并添加一个自定义标签：

```html title="config/html/head.ejs"
<% if (process.env.NODE_ENV === 'production') { %>
  <meta name='env' content="production">
<% } else { %>
  <meta name='env' content="development">
<% } %>
```

或在 `body.html` 里插入一个外链脚本：

```html title="config/html/body.html"
<script src="//example.com/assets/a.js"></script>
```

:::info 自定义 HTML 片段不支持修改 title 标签
自定义 HTML 片段的实现方式是将片段与框架内置的模板进行合并，由于框架的默认模板中已经存在 title 标签，因此自定义 HTML 模板中的 title 标签无法生效，请通过 [html.title](/docs/configure/app/html/title) 来修改页面标题。
:::

### 模板参数

模板中使用的参数可以通过 [html.templateParameters](/docs/configure/app/html/template-parameters) 配置项来定义。


### 按入口设置

`config/html/` 目录中的 HTML 片段对应用中的所有入口都生效。如果希望按入口自定义 HTML 片段，可以在 `config/html/` 目录下新建一个以**入口名**命名的目录，然后在这个目录中自定义 HTML 片段。

例如，如下设置的 HTML 片段仅对入口 `entry1` 生效：

```html
.
├── config/
│   └── html/
│       └── entry1
│           ├── head.html
│           └── body.html
└── src/
    ├── entry1/
    │   └── App.jsx
    └── entry2/
        └── App.jsx
```

## 完全自定义 HTML 模板

某些情况下，HTML 片段无法满足自定义需求，Modern.js 提供了完全自定义方式。

:::caution 注意
通常不建议直接覆盖默认的 HTML 模板，可能会失去一部分功能选项。即使需要替换，建议以内置模板为基础，按需修改。
:::


### 配置方式

在 `config/html/` 目录下，创建 `index.(html|ejs)` 文件。

该文件将替代默认的 HTML 模板。

:::info 注
内部默认 HTML 模板可以在 `node_modules/.modern-js/${entryName}/index.html` 中查看。
:::

如果仅需要为单一入口设置 HTML 模板，需要将 `index.(html|ejs)` 文件，放置到 `config/html/` 目录下以**入口名**命名的目录中。

例如，如下设置的 HTML 模板 `index.html` 仅对入口 `entry1` 生效：

```html
.
├── config/
│   └── html/
│       └── entry1
│           └── index.html
└── src/
    ├── entry1/
    │   └── App.jsx
    └── entry2/
        └── App.jsx
```
