---
sidebar_label: entriesDir
sidebar_position: 111
---

# source.entriesDir

:::info 适用的工程方案
* MWA
:::

* 类型： `string`
* 默认值： `./src`


默认会根据 `src` 目录识别应用入口，可通过该选项自定义应用入口的识别目录。

例如，当配置与目录结构如下时：

```js title="modern.config.js"
export default defineConfig({
  source: {
    entriesDir: './src/pages'
  }
})
```

``` title="项目目录结构"
.
└── src
    └── pages
        ├── a
        │   └── App.jsx
        └── b
            └── App.jsx
```

Modern.js 会根据 `./src/pages` 目录结构生成构建入口 `a` 和入口 `b`，结果如下：

```js
 {
   a: './src/pages/a/App.jsx',
   b: './src/pages/b/App.jsx'
 }
```
