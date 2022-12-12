---
title: Document 模板
sidebar_position: 9
---

Docuemnt 模板会生成 html 文件，替代原来的 `html 模板`。
这种方式的好处在于：使用了 `jsx` 语法，让写模板跟写组件一样丝滑。

为了同时能够满足后端同学也能使用 `ejs` 语法编写模板，Modern.js 使用 `html 模板` 作为兼容。当项目中，没有编写 `Document.j|tsx` 文件时，将自动回退至 html 模板。

## 使用说明
### 引入
```tsx
import {
  Html,
  Root,
  Head,
  DocumentContext,
  Body,
} from '@modern-js/runtime/document';
```

### 导出
```tsx
export default Document() {}

```

### 文件位置

Document 文件，默认在应用根目录下:

```bash
.
├── node_modules
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

### 子组件
Document 模板共提供了 `Html`、`Root` `Head` `Body` 渲染页面的组件，以及 `DocumentContext` 等提供
分别渲染：
- `Html`: 提供 html 原生 dom。并计算出 `DocumentStructrueContext` 的值，将 `Html` 的结构传递给子组件，判断其它子组件是否默认渲染。

- `Body`: 渲染生成 `body` 节点。其子元素包含 `Root` 组件。支持其它元素同时作为子元素，例如页脚。

- `Root`: 渲染的根节点 `<div id='root'></div>`。默认根节点的 `id = 'root'`。可以设置 props.rootId 来更改 id 属性。子元素，也会被渲染进 DOM 里，随着 react 渲染完成，会替换掉，一般用来实现全局 loading。

- `Head`: 渲染生成 `head` 节点。会自动填充 meta 元素，以及 `Scripts` 组件。

- `Scripts`: 将构建产生的 script 标签渲染到该位置。用于调整构建产物的位置，默认放在 `Head` 组件里，用于

`Html` 组件中，`Head` 和 `Body` 是必须要存在的，其它组件可以按需选择合适的组件进行组装。

### 模板参数

因为是 JSX 形式，Document.tsx 里，可以比较自由的在组件内使用各种变量去赋值给各种自定义组件。
但同时 Document 自身也提供了 `DocumentContext` context 来提供一些配置、环境参数，方便直接获取。主要以下参数：

- `processEnv`：提供构建时的 `process.env`
- `config`: Modern.js 项目的配置。目前只暴露出 output 相关的配置
- `entryName`: 当前的 entry 名。
- `templateParams`: html 模板的参数，由 builder 提供。对应 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 的 `templateParameters` 配置项最终获取到的结果。不建议使用!


## 示例

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


