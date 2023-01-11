# 构建产物目录

本章节主要介绍构建产物的目录结构，以及如何控制不同类型产物的输出目录。

## 默认产物目录

下面是最基础的产物目录结构，默认情况下，构建产物会生成在当前项目的 `dist` 目录下。

```bash
dist
├── static
│   ├── css
│   │   ├── [name].[hash].css
│   │   └── [name].[hash].css.map
│   │
│   └── js
│       ├── [name].[hash].js
│       ├── [name].[hash].js.LICENSE.txt
│       └── [name].[hash].js.map
│
└── html
    └── [name]
        └── index.html
```

最常见的产物是 HTML 文件、JS 文件和 CSS 文件：

- HTML 文件：默认输出到 `html` 目录。
- JS 文件：默认输出到 `static/js` 目录，
- CSS 文件：默认输出到 `static/css` 目录。

此外，JS 文件和 CSS 文件有时候会生成一些相关产物：

- License 文件：包含开源许可证信息，默认输出到 JS 文件的同级目录，并添加 `.LICENSE.txt` 后缀。
- Source Map 文件：包含保存源代码映射关系，默认输出到 JS 文件和 CSS 文件的同级目录，并添加 `.map` 后缀。

在产物的文件名称中，`[name]` 表示这个文件对应的入口名称，比如 `index`, `main`。`[hash]` 则是基于该文件的内容生成的哈希值。

## 修改产物目录

Builder 提供了多个配置项来修改产物目录和产物名称，你可以：

- 通过 [output.filename](/api/config-output.html#output-filename) 来修改产物的文件名。
- 通过 [output.distPath](/api/config-output.html#output-distpath) 来修改产物的输出路径。
- 通过 [output.legalComments](/api/config-output.html#output-legalcomments) 来修改 License 文件的生成方式。
- 通过 [output.disableSourceMap](/api/config-output.html#output-disablesourcemap) 来移除 Source Map 文件。
- 通过 [html.disableHtmlFolder](/api/config-html.html#html-disablehtmlfolder) 移除 HTML 产物对应的文件夹。

## 静态资源

当你在代码中引用图片、SVG、字体、媒体等类型的静态资源时，它们也会被输出到 `dist/static` 目录下，并根据静态资源类型来自动分配到对应的子目录：

```bash
dist
└── static
    ├── image
    │   └── foo.[hash].png
    │
    ├── svg
    │   └── bar.[hash].svg
    │
    ├── font
    │   └── baz.[hash].woff2
    │
    └── media
        └── qux.[hash].mp4
```

你可以通过 [output.distPath](/api/config-output.html#output-distpath) 配置项将这些静态资源统一输入到单个目录下，比如输出到 `assets` 目录：

```ts
export default {
  output: {
    distPath: {
      image: 'assets',
      svg: 'assets',
      font: 'assets',
      media: 'assets',
    },
  },
};
```

上方的配置会生成以下目录结构：

```bash
dist
└── assets
    ├── foo.[hash].png
    ├── bar.[hash].svg
    ├── baz.[hash].woff2
    └── qux.[hash].mp4
```

## Node.js 产物目录

当 Builder 的 [构建产物类型](/guide/basic/build-target.html) 中包含 `'node'`，或者你在上层框架中开启了 SSR 等服务端功能时，Builder 会在构建后生成一份 Node.js 产物，并输出到 `bundles` 目录下：

```bash
dist
├── bundles
│   └── [name].js
├── static
└── html
```

Node.js 产物通常只包含 JS 文件，不包含 HTML、CSS 等文件。此外，Node 产物的 JS 文件名称也不会自动生成哈希值。

你可以通过 [output.distPath.server](/api/config-output.html#output-distpath) 配置项来修改 Node 产物的输出路径。

比如，将 Node.js 产物输出到 `server` 目录：

```ts
export default {
  output: {
    distPath: {
      server: 'server',
    },
  },
};
```

## 扁平化产物目录

有时候你不想产物目录有太多层级，可以将目录设置为空字符串，使生成的产物目录扁平化。

参考下方的例子：

```ts
export default {
  output: {
    distPath: {
      js: '',
      css: '',
      html: '',
    },
    disableHtmlFolder: true,
  },
};
```

上方的配置会生成以下目录结构：

```bash
dist
├── [name].[hash].css
├── [name].[hash].css.map
├── [name].[hash].js
├── [name].[hash].js.map
└── [name].html
```

## 产物不写入磁盘

默认情况下，Builder 会将构建产物写入磁盘，以方便开发者查看产物的内容，或是配置静态资源的代理规则。

在开发环境，你可以选择将构建产物保存在 Dev Server 的内存中，从而减少文件操作产生的开销。

将 `dev.writeToDisk` 配置项设置为 `false` 即可：

```ts
export default {
  dev: {
    writeToDisk: false,
  },
};
```
