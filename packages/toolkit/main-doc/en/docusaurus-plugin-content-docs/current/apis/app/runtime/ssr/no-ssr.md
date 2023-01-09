---
title: NoSSR
---

The content wrapped by NoSSR will not be rendered at the server, nor will it be rendered during the client side hydrate. it will only be rendered immediately after the entire app is rendered.

## Usage

```tsx
import { NoSSR } from '@modern-js/runtime';

export default () => <NoSSR>...</NoSSR>;
```

## Example

In the following code, the `Time` component is used to display the current time. Since the time obtained by server-side rendering and client side hydrate are diff, React will throw an exception. For this case, you can use `NoSSR` to optimize:

```tsx
import { NoSSR } from '@modern-js/runtime';

function Time() {
  return (
    <NoSSR>
      <div>Time: {Date.now()}</div>
    </NoSSR>
  );
}
```

## Scene

In CSR, it is often necessary to render different content according to the browser UA, or a parameter of the current page URL. If the application switches directly to SSR at this time, it is very likely that the results will not meet the expectations.

Modern.js provides complete browser side information in the SSR context, which can be used to determine the rendering result of the component on the server side.

Even so, if there is too much logic in the application, or the developer wants to use the context later, or does not want some content to be rendered at the server side. developer can use the NoSSR component to exclude this part from server-side rendering.
