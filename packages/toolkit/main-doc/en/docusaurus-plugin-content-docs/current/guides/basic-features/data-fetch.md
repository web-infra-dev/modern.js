---
title: Fetch Data
sidebar_position: 3
---

Modern.js provides out of the box fetching data capabilities, developers can use these APIs to develop in CSR and SSR environments isomorphic.

It should be noted that these APIs do not help applications to initiate requests, but help developers better manage the relationship between data and routing.

## useLoader（旧版）

**`useLoader`** is an API in Modern.js old version. The API is a React Hook specially provided for SSR applications, allowing developers to fetch data in components.

:::tip
CSR don't need to use `useLoader` to fetch data.
:::

Here is the simplest example:

```tsx
import { useLoader } from '@modern-js/runtime';

export default () => {
  const { data } = useLoader(async () => {
    console.log('fetch in useLoader');

    // No real request is sent here, just a hard coding data is returned.
    // In a real project, the data obtained from the remote end should be returned.
    return {
      name: 'modern.js',
    };
  });

  return <div>Hello, {data?.name}</div>;
};
```

After the above code starts, visit the page. You can see that the log is printed at terminal, but not at console in browser.

This is because Modern.js server-side rendering, the data returned by the `useLoader` is collected and injected into the HTML of the response. If SSR rendering succeeds, the following code snippet can be seen in the HTML:

```html
<script>
window._SSR_DATA = {};
</script>
```

In this global variable, every piece of data is recorded, and this data will be used first in the process of rendering on the browser side. If the data does not exist, the `useLoader` function will be re-executed.

:::note
During the build phase, Modern.js will automatically generate a Loader ID for each `useLoader` and inject it into the JS bundle of SSR and CSR, which is used to associate Loader and data.
:::

Compared with `getServerSideProps` in the Next.js, get data in advance before rendering. Using `useLoader`, you can get the data required by the local UI in the component without passing the data layer by layer. Similarly, it will not add redundant logic to the outermost data acquisition function because different routes require different data requests. Of course, `useLoader` also has some problems, such as the difficulty of Treeshaking server-level code, and the need for one more pre-render at the server level.

Modern.js in the new version, a new Loader solution is designed. The new solution solves these problems and can cooperate with **nested routing** to optimize page performance.

:::note
Detailed APIs can be found at [useLoader](/docs/apis/app/runtime/core/use-loader).
:::

## Route Loader

:::note
Stay tuned.
:::
