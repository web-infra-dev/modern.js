---
title: renderApp
---

The `render` function is used to test normal components, and the `renderApp` function is used to test App components.

## Usage

```ts
import { renderApp } from '@modern-js/runtime/testing';
```

App components refer to components that contain some Modern.js contexts, such as App root components, Containers using Models, etc.

For the testing of such components, you can use the `renderApp` function, which will automatically wrap the context information according to the current `modern.config.js`.

## Function Signature

`renderApp` is the same as [render](./render.md).

## Example

```ts
import { renderApp } from '@modern-js/runtime/testing';
import App from './App';

describe('test', () => {
  it('test App', () => {
    const { getByText } = renderApp(<App />);
    expect(getByText('Hello Modern!')).toBeInTheDocument();
  });
});
```
