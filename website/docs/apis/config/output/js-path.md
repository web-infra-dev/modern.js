---
sidebar_label: jsPath
---

# output.jsPath

:::info 适用的工程方案
* MWA
* 模块
:::

* 类型： `string`
* 默认值：
  - MWA 项目中: `static/js`
  - 模块工程方案中: `js`

设置 js 文件在输出目录中的相对路径。

### MWA 工程方案

默认情况下在 MWA 项目中，执行 `yarn build` 之后， js 产物在 `dist` 目录下的结构如下：

```bash
└── static
    └── js
        ├── 2.9b520d98.chunk.js
        ├── 2.9b520d98.chunk.js.map
        ├── main.ef911a7c.chunk.js
        ├── main.ef911a7c.chunk.js.map
        ├── runtime-main.6acd5045.js
        └── runtime-main.6acd5045.js.map
```

在 `modern.config.js` 设置 `output.jsPath` 之后：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    jsPath: './js-assets',
  },
});
```


重新执行 `build`，对应 js 产物在 dist 中的目录结构如下：

```bash
└── js-assets
    ├── 2.9b520d98.chunk.js
    ├── 2.9b520d98.chunk.js.map
    ├── main.ef911a7c.chunk.js
    ├── main.ef911a7c.chunk.js.map
    ├── runtime-main.6acd5045.js
    └── runtime-main.6acd5045.js.map
```

### 模块工程方案

执行 `build` 之后， js 产物在 `dist` 目录下的结构如下：

```bash
└── js
    ├── modern
    │   ├── index.js
    │   ├── index.d.ts
    │   └── index.js.map
    ├── node
    │   ├── index.js
    │   ├── index.d.ts
    │   └── index.js.map
    └── treeshaking
        ├── index.js
        ├── index.d.ts
        └── index.js.map
```

在 `modern.config.js` 设置 `output.jsPath` 之后：

```js title="modern.config.js"
import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    jsPath: './js-assets',
  },
});
```

重新执行 `build`，对应 js 产物在 dist 中的目录结构如下：

```bash
└── js
    ├── modern
    │   ├── index.js
    │   ├── index.d.ts
    │   └── index.js.map
    ├── node
    │   ├── index.js
    │   ├── index.d.ts
    │   └── index.js.map
    └── treeshaking
        ├── index.js
        ├── index.d.ts
        └── index.js.map
```
