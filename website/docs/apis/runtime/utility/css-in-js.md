---
title: CSS-In-JS API
sidebar_position: 2
---

:::info 补充信息
通过 Style Component 在页面上使用 CSS。
```ts
import styled from '@modern-js/runtime/styled';
```
:::

`styled` 具体API，请看：[styled-component api](https://styled-components.com/docs/api)。

## API

请看 [styled-component API](https://styled-components.com/docs/api)。

## 示例

```tsx
import styled from '@modern-js/runtime/styled';

const Button = styled.button`
  background: palevioletred;
  border-radius: 3px;
  border: none;
  color: white;
`

const TomatoButton = styled(Button)`
  background: tomato;
`

render(
  <>
    <Button>I'm purple.</Button>
    <br />
    <TomatoButton>I'm red.</TomatoButton>
  </>
)
`

render(
  <div>
    <Button
      href="https://github.com/styled-components/styled-components"
      target="_blank"
      rel="noopener"
      primary
    >
      GitHub
    </Button>

    <Button as={Link} href="/docs">
      Documentation
    </Button>
  </div>
)
```
