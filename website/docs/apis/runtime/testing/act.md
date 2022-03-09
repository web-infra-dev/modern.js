---
title: act
sidebar_position: 4
---

:::info 补充信息
用于确保渲染、事件、数据获取等行为已经应用在 DOM 上。
```ts
import { act } from '@modern-js/runtime/testing';
```
:::

## API

`act` 和 [react-dom/test-utils act 函数](https://reactjs.org/docs/testing-recipes.html#act) 是一致的。

## 示例

```tsx
import ReactDOM from 'react-dom';
import { act } from '@modern-js/runtime/testing';
import { Foo } from '@/components/Foo';

describe('test act', () => {
  it('it should be foo', () => {
    const el = document.createElement("div");
    act(() => {
      ReactDOM.render(<Foo />, el);
    })

    expect(el.innerHTML).toBe('<div>Foo</div>');
  })
})
```
