---
title: Head
sidebar_position: 1
---

# Head

:::info 补充信息
用于给 `head` 元素内添加 html 元素（如 title、meta、script 等），并且支持 `SSR`。
```tsx
import { Helmet } from '@modern-js/runtime/head';
```
:::

## API

```tsx
<Helmet></Helmet>
```

## 示例

```tsx
import { Helmet } from '@modern-js/runtime/head';

function IndexPage() {
  return (
    <div>
      <Helmet>
        <title>My page title</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Helmet>
      <p>Hello Modern.js!</p>
    </div>
  )
}

export default IndexPage
```

## 更多用法

详见 [react-helmet](https://github.com/nfl/react-helmet)。
