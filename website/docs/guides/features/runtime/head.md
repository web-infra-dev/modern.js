---
sidebar_position: 5
title: 定义 head 信息
---

自定义 HTML 的 `title` 或 `meta` 有两种方式：

1. 自定义 HTML 模版。
2. 使用 `Helmet` 动态修改。

## 自定义 HTML 模版

在根目录下创建 `/config/html/` 目录，并在其下创建 `head.html` 文件，代码如下：

```html title="head.html"
<meta name="keywords" content="HTML, CSS, JavaScript">
<title>I love Modern.js</title>
<script>window.hello = 'Modern.js'</script>
```

`head.html` 可以自定义 `head` 部分内容，例如 `meta`、`title`、`script` 等标签。

:::info 补充信息
可查看 【[自定义 HTML 模板](/docs/guides/usages/html) 】了解更多内容。
:::


## 使用 `Helmet` 动态修改

**自定义 HTML 模版** 可以满足绝大部分的场景，但当需要动态修改 `head` 内容时，可以使用 `Helmet` 组件 。

以如下场景为例：

页面中一个按钮每次点击之后，当前标签页的 title 上实时显示当前时间戳。代码如下：

```tsx
import { useState } from 'react';
import { Helmet } from '@modern-js/runtime/head';

function App() {
  const [timestamp, setTimestamp] = useState(Date.now());

  return (
    <div>
      <Helmet>
        <title>I love Modern.js {String(timestamp)}</title>
        <meta name="keywords" content="HTML, CSS, JavaScript" />
      </Helmet>
      <button type="button" onClick={() => setTimestamp(Date.now())}>
        update timestamp
      </button>
    </div>
  );
}

export default App;
```

`Helmet` 是一个 React 组件，我们利用它动态渲染  `title` 和 `meta` 两个标签。

:::info 补充信息
1. Modern.js 中 `Helmet` 默认支持 SSR ，服务端渲染之后，返回给浏览器的 HTML 的 `head` 中会含有 `Helmet` 渲染的标签。
2. 可以查看 [Head API](/docs/apis/runtime/app/head) 了解 `Helmet` 的更多用法。
:::
