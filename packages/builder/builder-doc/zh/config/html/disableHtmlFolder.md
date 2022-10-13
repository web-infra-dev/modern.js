- Type: `boolean`
- Default: `false`

移除 HTML 产物对应的文件夹。开启该选项后，生成的 HTML 文件目录会从 `[name]/index.html` 变为 `[name].html`。

#### 示例

默认情况下，HTML 产物在 `dist` 目录下的结构为：

```bash
/dist
└── html
    └── main
        └── index.html
```

开启 `html.disableHtmlFolder` 配置:

```js
export default {
  html: {
    disableHtmlFolder: true,
  },
};
```

重新编译后，HTML 产物在 dist 中的目录结构如下：

```bash
/dist
└── html
    └── main.html
```

> 如果需要设置 HTML 文件在 dist 目录中的路径，请使用 `output.distPath.html` 配置。
