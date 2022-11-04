---
sidebar_label: jsPath
---

# output.jsPath



* 类型： `string`
* 默认值： `js`

设置 js 文件在输出目录中的相对路径。

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
