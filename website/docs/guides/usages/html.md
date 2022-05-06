---
title: 自定义 HTML 模板
sidebar_position: 7
---

:::info 注
默认情况下，Modern.js 会内置一份 HTML 模板。应用开发中，可以通过代码片段来自定义模板内容。
:::

## 自定义 HTML 片段

在应用根目录下，创建 `config/html/` 目录，该目录下支持创建四种 HTML 片段。

- `top.(html|ejs)`
- `head.(html|ejs)`
- `body.(html|ejs)`
- `bottom.(html|ejs)`

**这些片段将按位置注入到默认的 HTML 模板中。**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>hello modern.js</title>
  <%= topTemplate %>
  <script>
  // polyfill
  </script>
  <script>
  // slardar
  </script>
  <%= headTemplate %>
  <!-- webpack inject css -->
</head>
<body>
  <div id="root"></div>
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

或在 Body 里插入一个外链脚本：

```html title="config/html/body.html"
<script src="//example.com/assets/a.js"></script>
```


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
