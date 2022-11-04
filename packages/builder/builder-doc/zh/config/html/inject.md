- Type: `'head' | 'body'| 'true' | false`
- Default: `'head'`

修改构建产物中 `<script>` 标签在 HTML 中的插入位置。

可以设置为以下值：

- `'head'`: script 标签会插入在 HTML 的 head 标签内。
- `'body'`: script 标签会插入在 HTML 的 body 标签尾部。
- `true`: 最终表现取决于 `html-webpack-plugin` 的 scriptLoading 配置项。
- `false`: script 标签不插入 HTML 中。

#### 默认插入位置

script 标签默认在 head 标签内：

```html
<html>
  <head>
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

#### 插入至 body 标签

添加如下配置，可以将 script 插入至 body 标签：

```js
export default {
  html: {
    inject: 'body',
  },
};
```

可以看到 script 标签生成在 body 标签尾部：

```html
<html>
  <head>
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
