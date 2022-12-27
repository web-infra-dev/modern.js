---
title: Server-side rendering
sidebar_position: 3
---

In Modern.js, SSR also works out of the box. Developers do not need to write complex server level logic for SSR, nor do they need to care about the operation and maintenance of SSR, or create services. Modern.js have a comprehensive SSR degradation strategy to ensure that pages can run safely.

Enabling SSR is very easy, just set ['server.ssr'](/docs/configure/app/server/ssr) to `true`:

```json
{
  "server": {
    "ssr": true
  }
}
```

## SSR Data Fetch

Modern.js provides Data Loader, which is convenient for developers to fetch data under SSR and CSR. Each routing module, such as `layout.tsx` and `page.tsx`, can define its own Data Loader:

```ts title="src/routes/page.tsx"
export const loader = () => {
  return {
    message: 'Hello World',
  };
};
```

in the component, the data returned by the `loader` function can be get data through the Hooks API:

```tsx
export default () => {
  const data = useLoaderData();
  return <div>{data.message}</div>;
}
```

Modern.js break the traditional SSR development model and provide users with a user-friendly SSR development experience.

And it provides elegant degradation processing. Once the SSR request fails, it will automatically downgrade and restart the request on the browser side.

However, developers still need to pay attention to the fallback of data, such as `null` values or data returns that do not as expect. Avoid React rendering errors or messy rendering results when SSR.

:::info
When using Data Loader, data fetching happens before rendering, Modern.js still supports fetching data when the component is rendered. See [Data Fetch](/docs/guides/basic-features/data-fetch)。
:::

## Keep Rendering Consistent

In some businesses, it is usually necessary to display different UI displays according to the current operating container environment characteristics, such as [UA](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) information.

If the processing is not careful enough, the rendering results may do not meet the expectations at this time.

Here is an example to show the problem when SSR and CSR rendering are inconsistent, add the following code to the component:

```tsx
{
  typeof window !== 'undefined' ? (
    <div>
      browser content
    </div>
  ) : null;
}
```

After starting the app, visit the page and will find that the browser console throws a warning message:

```sh
Warning: Expected server HTML to contain a matching <div> in <div>.
```

This is caused by the inconsistency between the rendering result and the SSR rendering result when React executes the hydrate logic on the client side. Although the page performs normally, in complex applications, it is likely to cause problems such as DOM hierarchy confusion and style confusion.

:::info
For hydrate logic, please refer to [here](https://reactjs.org/docs/react-dom.html#hydrate).
:::

Applications need to maintain the consistency of SSR and CSR rendering results. If there are inconsistencies, it means that this part of the content does not need to be rendered in SSR.

Modern.js provide [`<NoSSR>`](/docs/apis/app/runtime/core/use-runtime-context) for such content that does not need to be rendered in SSR:

```ts
import { NoSSR } from '@modern-js/runtime/ssr';
```

Outside of elements that do not require SSR, wrap with a `NoSSR` component:

```tsx
<NoSSR>
  <div>
    client content
  </div>
</NoSSR>
```

After modifying the code, refresh page found that the previous Waring disappeared. Open the Network window of the browser developer tool to see that the returned HTML document does not contain the content of the `NoSSR` component package.

:::info
['useRuntimeContext'](/docs/apis/app/runtime/core/use-runtime-context) can get complete request information, which can be used to ensure that the rendering results of SSR and CSR are consistent.
:::

## Concerned Memory Leaks

:::warning
In the SSR, developers need to pay special attention to the problem of memory leaks. Even small memory leaks can affect services..
:::

In SSR, every request triggers the component rendering. So, you need to avoid defining any potentially growing global data, or subscribing to events globally, or creating streams that will not be destroyed.

For example, the following code, when using [redux-observable](https://redux-observable.js.org/), developers used to code like this:

```tsx
import { createEpicMiddleware, combineEpics } from 'redux-observable';

const epicMiddleware = createEpicMiddleware();
const rootEpic = combineEpics();

export default function Test() {
  epicMiddleware.run(rootEpic);
  return <div>Hello Modern.js</div>;
}
```

Create a Middleware instance `epicMiddleware` outside the component and call epicMiddleware.run inside the component.

On the browser side, this code does not cause any problems. But in SSR, the Middleware instance will never be destroyed. Every time the component is rendered and `rootEpic` is called, new event bindings are added internally, causing the entire object to continue to grow larger, which ultimately affects application performance.

Such problems in CSR are not easy to detect, so when switching from CSR to SSR, if you are not sure whether the application has such hidden dangers, you can press the application.

## Crop SSR Data

In order to keep the data requested in the SSR phase, it can be used directly on the browser side, Modern.js inject the data and state that collected during the rendering process into the HTML.

As a result, CSR applications often have a large amount of interface data and the state of the components is not crop. If SSR is used directly, the rendered HTML size may be too large.

At this time, SSR not only cannot bring an improvement in the user experience, but may have the opposite effect.

Therefore, when using SSR, **developers need to do reasonable weight loss for the application**:

1. Pay attention to the first screen, you can only request the data needed for the first screen in SSR, and render the rest on the browser side.
2. Removes the data independent with render from the data returned by the interface.

## Serverless Pre-render

Modern.js provide Serverless Pre-rendering(SPR) to improve SSR performance.

SPR uses pre-rendering and caching to provide the responsive performance of static Web for SSR pages. It allows SSR applications to have the responsiveness and stability of static Web pages, while keeping data dynamically updated.

Using SPR in the Modern.js is very simple, just add the `<PreRender>` component, and the page where the component is located will automatically open SPR.

This mock a component that uses the `useLoaderData` API, and the request in the Data Loader takes 2s.

```jsx
import { useLoaderData } from '@modern-js/runtime/router';

export const loader = async () => {
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, 2000);
  });

  return {
    message: 'Hello Modern.js',
  };
};

export default () => {
  const data = useLoaderData();
  return <div>{data?.message}</div>;
};
```

After executing the `dev` command and opening the page, it is obvious that the page needs to wait 2s before returning.

The next is to use the `<PreRender>` component, which can be exported directly from `@modern-js/runtime/ssr `:

```ts
import { PreRender } from '@modern-js/runtime/ssr';
```

Use the `PreRender` component in the routing component and set the parameter `interval` to indicate that the expiration time of the rendering result is 5s:

```tsx
<PreRender interval={5} />
```

After modification, execute `pnpm run build && pnpm run serve` to start the application and open the page.

When open page for the first time, it is no different from the previous rendering, and there is also a 2s delay.

Refresh page, and the page opens instantly, but at this time, the page data has not changed due to the refresh, because the cache has not expired.

Wait 5s, refresh the page again, the data of the page is still unchanged. Refresh the page again The data changes, but the page still responds almost instantaneously.

This is because in the previous request, the SPR has asynchronously obtained the new rendering result in the background, and the page requested this time is the version that has been cached in the server.

It is conceivable that when `interval` is set to 1, users can have the responsive experience of a static page.

:::info
For more detail, see [`<PreRender>`](/docs/apis/app/runtime/ssr/pre-render)。
:::

## Treeshaking

When SSR is enabled, Modern.js will use the same entry to build both the SSR Bundle and the CSR Bundle. Therefore, the Web API in the SSR Bundle, or the Node API in the CSR Bundle, can lead to runtime errors.

Web API into a component is usually to do some global listening, or to get browser-related data, such as:

```tsx
document.addEventListener('load', () => {
  console.log('document load');
});
const App = () => {
  return <div>Hello World</div>
}
export default App;
```

The Node API is introduced in the component file, usually because of the use of Data Loader, for example:

```ts
import fse from 'fs-extra';
export const loader = () => {
  const file = fse.readFileSync('./myfile');
  return {
    ...
  };
};
```

### Use Environment Variables

For the first case, we can directly use Modern.js built-in environment variables `MODERN_TARGET` to remove useless code at build time:

```ts
if (process.env.MODERN_TARGET === 'browser') {
  document.addEventListener('load', () => {
    console.log('document load');
  });
}
```

:::note
For more information, see [environment variables](/docs/guides/basic-features/env-vars).
:::

### Use File Suffix

In the second case, the Treeshaking method does not guarantee that the code is completely separated. Modern.js also supports the packaging file of SSR Bundle and CSR Bundle products through the file suffixed with `.node.`.

For example, the import of `fs-extra` in the code, when it is directly referenced to the component, will cause the CSR to load an error. You can create `.ts` and `.node.ts` files of the same name as a layer of proxy:

```ts title="compat.ts"
export { readFileSync } from 'fs-extra';
```

```ts title="compat.node.ts"
export const readFileSync: any = () => {};
```

use `./compat` directly into the file. At this time, files with the `.node.ts` suffix will be used first in the SSR environment, and files with the `.ts` suffix will be used in the CSR environment.

```ts title="App.tsx"
import { readFileSync } from './compat'

export const loader = () => {
  const file = readFileSync('./myfile');
  return {
    ...
  };
};
```

### Independent File

Both of the above methods will bring some burden to the developer. Modern.js based on [Nested Routing](/docs/guides/basic-features/routes) developed and designed [Data Fetch](/docs/guides/basic-features/data-fetch) to separate CSR and SSR code。

## Remote Request

When initiating remote requests in SSR, developers sometimes use request tools. Some interfaces need to pass user cookies, which developers can get through the ['useRuntimeContext'](/docs/guides/basic-features/data-fetch#route-loader) API to achieve.

It should be noted, the request header of the HTML request is obtained, which may not be applicable to remote requests, so **must not** pass through all request headers.

In addition, some backend interfaces, or general gateways, will verify according to the information in the request header, and full pass-through is prone to various problems that are difficult to debug. It is recommended that **pass-through on demand**.

Be sure to filter the `host` field if you really need to pass through all request headers.

## Stream SSR

Modern.js supports streaming rendering in React 18, the default rendering mode can be modified with the following configuration:

```json
{
  "server": {
    "ssr": {
      "mode": "stream"
    }
  }
}
```

:::note
At present Modern.js built-in data fetch does not support streaming rendering. If app need it, developers can build it according to the demo of React Stream SSR.
:::
