---
title: Code Split
sidebar_position: 6
---

Code Split is a common way to optimizing front-end resource loading. This doc will introduce three methods supported by Modern.js:

- `import`
- `React.lazy`
- `loadable`

## import

use dynamic `import()`，`import` The JS modules pass to this API will be packaged into a separate JS file as a new packaging entry, for example:

```ts
import("./math").then(math => {
  console.log(math.add(16, 26));
});
```

The JS modules corresponding to the './math' path will be packaged in a separate JS file.

## loadable

use `loadable` API，for example：

```ts
import loadable from '@modern-js/runtime/loadable'

const OtherComponent = loadable(() => import('./OtherComponent'));

function MyComponent() {
  return <OtherComponent />
}
```

For detail, see [loadable API](/docs/apis/app/runtime/utility/loadable)。

:::info
SSR is supported out of the box by `loadable`.
:::

## React.lazy

The officially way provides by React to split component code.

:::note
React.lazy will not work in a non-streaming SSR environment.
:::

```ts
import React, { Suspense } from 'react';

const OtherComponent = React.lazy(() => import('./OtherComponent'));
const AnotherComponent = React.lazy(() => import('./AnotherComponent'));

function MyComponent() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <section>
          <OtherComponent />
          <AnotherComponent />
        </section>
      </Suspense>
    </div>
  );
}
```

For detail, see [React lazy](https://zh-hans.reactjs.org/docs/code-splitting.html#reactlazy)。
