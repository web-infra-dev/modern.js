---
sidebar_label: disableCssModuleExtension
---

# output.disableCssModuleExtension

:::info 适用的工程方案
MWA。
:::

- 类型： `boolean`
- 默认值： `false`

默认情况下只有 `*.module.css` 结尾的文件才被视为 CSS Modules 模块。

开启该功能之后，会将源码目录下的 `*.css` 样式文件也当做 CSS Modules 模块，

`.sass`、`.scss` 和 `.less` 文件的处理规则与 `.css` 文件一致，也会受到 `disableCssModuleExtension` 的影响。

开启 `disableCssModuleExtension` 后，CSS Modules 和普通 CSS 文件无法得到明确的区分，因此不推荐开启该配置项。

## 示例

```js title="modern.config.js"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    disableCssModuleExtension: true,
  },
});
```

## 详细规则

以下是对 CSS Modules 判断规则的详细解释：

### 未开启 disableCssModuleExtension（默认）

以下文件会视为 CSS Modules：

- 所有 `*.module.css` 文件

以下文件会视为普通 CSS：

- 所有 `*.css` 文件（不含 `.module`）
- 所有 `*.global.css` 文件

### 开启 disableCssModuleExtension

以下文件会视为 CSS Modules：

- 源码目录下的 `*.css` 和 `*.module.css` 文件
- node_modules 下的 `*.module.css` 文件

以下文件会视为普通 CSS：

- 所有 `*.global.css` 文件
- node_modules 下的 `*.css` 文件（不含 `.module`）

:::info
对于 node_modules 中的 CSS Modules 文件，请始终使用 `*.module.css` 后缀。
:::
