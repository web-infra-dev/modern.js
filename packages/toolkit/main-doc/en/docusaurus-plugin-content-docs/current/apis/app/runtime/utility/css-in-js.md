---
title: CSS-In-JS API
---

Use Style Component to write CSS.

## Usage

```ts
import styled from '@modern-js/runtime/styled';
```

## Function Signature

see [styled-component API](https://styled-components.com/docs/api)。

## Example

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

function ButtonExample() {
  return (
    <>
      <Button>I'm purple.</Button>
      <br />
      <TomatoButton>I'm red.</TomatoButton>
    </>
  );
}
```
