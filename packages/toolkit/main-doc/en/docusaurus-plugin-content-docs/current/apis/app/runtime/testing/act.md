---
title: act
---

Used to ensure that behaviors such as rendering, events, data fetching, etc. have been applied to the DOM.

## Usage

```ts
import { act } from '@modern-js/runtime/testing';
```

## Function Signature

`act` is the same as [react-dom/test-utils act function](https://reactjs.org/docs/testing-recipes.html#act).

## Example

```tsx
import ReactDOM from 'react-dom';
import { act } from '@modern-js/runtime/testing';
import { Foo } from '@/components/Foo';

describe('test act', () => {
  it('it should be foo', () => {
    const el = document.createElement('div');
    act(() => {
      ReactDOM.render(<Foo />, el);
    });

    expect(el.innerHTML).toBe('<div>Foo</div>');
  });
});
```
