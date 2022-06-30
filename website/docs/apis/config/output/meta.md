---
sidebar_label: meta
---

# output.meta

:::info 适用的工程方案
MWA
:::

- 类型：`Record<string, false | string | Record<string, string | boolean>>`
- 默认值：见下方默认值。

`output.meta` 用于配置 HTML 页面的 `<meta>` 标签。

## 默认值

Modern.js 默认设置的 `meta` 配置如下，通过 `output.meta` 设置的值会与默认值进行合并。

```js
const defaultMeta = {
  charset: { charset: 'utf-8' },
  renderer: 'webkit',
  layoutmode: 'standard',
  imagemode: 'force',
  'wap-font-scale': 'no',
  'format-detection': 'telephone=no',
  'http-equiv': {
    'http-equiv': 'x-ua-compatible',
    content: 'ie=edge',
  },
  viewport:
    'width=device-width, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
};
```

对应生成的 HTML 为：

```html
<meta charset="utf-8" />
<meta name="renderer" content="webkit" />
<meta name="layoutmode" content="standard" />
<meta name="imagemode" content="force" />
<meta name="wap-font-scale" content="no" />
<meta name="format-detection" content="telephone=no" />
<meta http-equiv="x-ua-compatible" content="ie=edge" />
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
```

## 详细用法

### 字符串用法

当 `meta` 对象的 `value` 为字符串时，会自动将对象的 `key` 映射为 `name`，`value` 映射为 `content`。

比如设置 `description`：

```js title="modern.config.js"
export default defineConfig({
  output: {
    meta: {
      description: 'a description of the page',
    },
  },
});
```

最终在 HTML 中生成的 `meta` 标签为：

```html
<meta name="description" content="a description of the page" />
```

### 对象用法

当 `meta` 对象的 `value` 为对象时，会将该对象的 `key: value` 映射为 `meta` 标签的属性。

这种情况下默认不会设置 `name` 和 `content` 属性。

比如设置 `http-equiv`：

```js title="modern.config.js"
export default defineConfig({
  output: {
    meta: {
      'http-equiv': {
        'http-equiv': 'x-ua-compatible',
        content: 'ie=edge',
      },
    },
  },
});
```

最终在 HTML 中生成的 `meta` 标签为：

```html
<meta http-equiv="x-ua-compatible" content="ie=edge" />
```

### 覆盖默认值

在 `meta` 对象中定义的值会自动覆盖 Modern.js 预设的默认值。

比如覆盖默认的 `viewport`：

```ts
export default defineConfig({
  output: {
    meta: {
      viewport: 'width=device-width',
    },
  },
});
```

### 移除默认值

将 `meta` 对象的 `value` 设置为 `false`，可以移除 Modern.js 预设的默认值。

比如移除默认的 `imagemode`：

```ts
export default defineConfig({
  output: {
    meta: {
      imagemode: false,
    },
  },
});
```
