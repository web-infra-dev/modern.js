---
title: CSS-In-JS API
---

使用 Style Component 来编写组件 CSS。

## 使用姿势

```ts
import styled from '@modern-js/runtime/styled';
```

## 函数签名

请看 [styled-component API](https://styled-components.com/docs/api)。

## 示例

```tsx
import styled from '@modern-js/runtime/styled';

const Button = styled.button`
  background: palevioletred;
  border-radius: 3px;
  border: none;
  color: white;
`;

const TomatoButton = styled(Button)`
  background: tomato;
`;

function ButtonExample(){
  return (
    <>
      <Button>I'm purple.</Button>
      <br />
      <TomatoButton>I'm red.</TomatoButton>
    </>
  );
};
```
