---
sidebar_label: inject
sidebar_position: 35
---

# `output.inject`

:::info 适用的工程方案
MWA。
:::

- 类型： `'head' | 'body'| 'true' | false`
- 默认值： `head`

修改构建产物中 script 标签在 html 中的插入位置。对应选项说明如下：

- `head`: script 标签会默认在 html `head` 标签内。
- `body`: script 标签会默认在 html `body` 标签尾部。
- `true`: 和 `head` 表现相同。
- `false`: script 标签不插入 html 中。

## 默认插入位置

默认情况下，`dev` 可以看到 script 标签会插入到 `head` 中：

```html
<html>
  <head>
    <meta charset="utf-8" />
    <title></title>
    <script defer src="/static/js/runtime-main.js"></script>
    <script defer src="/static/js/main.js"></script>
    <link href="/static/css/main.css" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

## 插入至 body 标签

配置如下时:

```javascript title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    inject: 'body',
  },
});
```

可以看到 script 标签会插入到 `body` 中：

```html
<html>
  <head>
    <meta charset="utf-8" />
    <title></title>
    <link href="/static/css/main.css" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script defer src="/static/js/runtime-main.js"></script>
    <script defer src="/static/js/main.js"></script>
  </body>
</html>
```
