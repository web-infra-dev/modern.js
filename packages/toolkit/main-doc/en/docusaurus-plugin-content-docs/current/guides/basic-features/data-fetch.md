---
title: Fetch Data
sidebar_position: 3
---

Modern.js provides out of the box fetching data capabilities, developers can use these APIs to develop in CSR and SSR environments isomorphic.

It should be noted that these APIs do not help applications to initiate requests, but help developers better manage the relationship between data and routing.

## Data loader(recommend)

Modern.js recommends the use of conventional routing for route management. With Modern.js' [conventional (nested) routing](/docs/guides/basic-features/routes#conventional-routing), each routing component (`layout.ts` or `page.ts`) can have a `loader` file with the same name that can be executed before the component renders, providing data to the routing component.

:::info
Modern.js v1 supports getting data by [useLoader](#useloaderold), which is no longer the recommended usage and it is not recommended to mix both except for migration process.
:::

### Basic example

A routing component such as `layout.ts` or `page.ts` can define a `loader` file with the same name. The `loader` file exports a function that provides the data required by the component, which is then get data by the `useLoaderData` function in the routing component, as in the following example:

```
.
└── routes
    ├── layout.tsx
    └── user
        ├── layout.tsx
        ├── layout.loader.ts
        ├── page.tsx
        └── page.loader.ts
```

Define the following code in the file:

```ts title="routes/user/page.tsx"
import { useLoaderData } from '@modern-js/runtime/router';
import type { ProfileData } from './page.loader.ts';

export default function UserPage() {
  const profileData = useLoaderData() as ProfileData;
  return <div>{profileData}</div>;
}
```

```ts title="routes/user/page.loader.ts"
export type ProfileData = {
  /*  some types */
};

export default async (): Promise<ProfileData> => {
  const res = await fetch('https://api/user/profile');
  return await res.json();
};
```

:::caution
Here the routing component and the `loader` file share a type, should use the `import type` syntax.
:::

In a CSR environment, the `loader` function is executed on the client side, and the browser API can be used within the `loader` function (but it is usually not needed and not recommended).

In an SSR environment, the `loader` function will only be executed on the server side, regardless of the first screen or the navigation on the client side, where any Node.js API can be called, and any dependencies and code used here will not be included in the client bundle.

:::info
In later versions, Modern.js may support `loader` functions running on the server side as well in CSR environments to improve performance and security, so here it is recommended to keep the loader as pure as possible and only do data fetching scenarios.
:::

When navigating on the client side, all loader functions under `/user` and `/user/profile` are executed (requested) in parallel based on Modern.js's [conventional routing](/docs/guides/basic-features/routes), i.e. when accessing `/user/profile`, the loader functions under `/user` and `/user/profile` are executed (requested) in parallel to improve client-side performance.

### `loader` function

The `loader` function has two input parameters：

##### `Params`

When a routing file is passed through `[]`, it is passed as a [dynamic route](/docs/guides/basic-features/routes#dynamic-route) and the dynamic route fragment is passed as an argument to the loader function：

```tsx
// routes/user/[id]/page.loader.tsx
import { LoaderArgs } from '@modern-js/runtime/router';

export default async ({ params }: LoaderArgs) => {
  const { id } = params;
  const res = await fetch(`https://api/user/${id}`);
  return res.json();
};
```

当访问 `/user/123` 时，`loader` 函数的参数为 `{ params: { id: '123' } }`。

#### `request`

`request` is a [Fetch Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) instance.

A common usage scenario is to obtain query parameters via `request`:

```tsx
// routes/user/[id]/page.loader.ts
import { LoaderArgs } from '@modern-js/runtime/router';

export default async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get('id');
  return queryUser(userId);
};
```

#### Return value

The return value of the `loader` function can be anything serializable, or it can be a [Fetch Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) instance：

```tsx
const loader = async (): Promise<ProfileData> => {
  return {
    message: 'hello world',
  };
};
export default loader;
```

By default, the response `Content-type` returned by `loader` is `application/json` and `status` is 200, which you can set by customizing `Response`:

```tsx
const loader = async (): Promise<ProfileData> => {
  const data = { message: 'hello world' };
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; utf-8',
    },
  });
};
```

### Request API

Modern.js does a polyfill of the `fetch` API to initiate requests, which is consistent with the browser's `fetch` API, but can also be used on the server side to initiate requests, meaning that both CSRs and SSRs can use the unified `fetch` API for data fetching：

```tsx
function loader() {
  const res = await fetch('https://api/user/profile');
}
```

### Error handling

In the `loader` function, errors can be handled by `throw error` or `throw response`. When an error is thrown in the `loader` function, Modern.js will stop executing the code in the current loader and switch the front-end UI to the defined [`ErrorBoundary`](/docs/guides/basic-features/routes#errorboundary) component.

```tsx
// routes/user/profile/page.loader.tsx
export default async function loader() {
  const res = await fetch('https://api/user/profile');
  if (!res.ok) {
    throw res;
  }
  return res.json();
}

// routes/user/profile/error.tsx
import { useRouteError } from '@modern-js/runtime/router';
const ErrorBoundary = () => {
  const error = useRouteError() as Response;
  return (
    <div>
      <h1>{error.status}</h1>
      <h2>{error.statusText}</h2>
    </div>
  );
};

export default ErrorBoundary;
```

### Get data from upper level components

In many cases, the child component needs to access the data in the ancestor's loader, and you can easily access the ancestor's data with `useRouteLoaderData`: `useRouteLoaderData`:

```tsx
// routes/user/profile/page.tsx
import { useRouteLoaderData } from '@modern-js/runtime/router';

export default function UserLayout() {
  // Get the data returned by the loader in routes/user/layout.loader.ts
  const data = useRouteLoaderData('user/layout');
  return (
    <div>
      <h1>{data.name}</h1>
      <h2>{data.age}</h2>
    </div>
  );
}
```

`userRouteLoaderData` takes one parameter `routeId`,When using conventional routing, Modern.js will automatically generate `routeId` for you. The value of `routeId` is the path of the corresponding component relative to `src/routes`, as in the example above, the child component wants to get the data returned by the loader in `routes/user/layout.tsx`, the value of `routeId` is `user/layout`.

In a multi-entry (MPA) scenario, the value of `routeId` needs to be added to the name of the corresponding entry, and the entry name is usually the entry directory name if not specified, such as the following directory structure:

```bash
.
└── src
    ├── entry1
    │     └── routes
    │           └── layout.tsx
    └── entry2
          └── routes
                └── layout.tsx
```

If you want to get the data returned by the loader in `entry1/routes/layout.tsx`, the value of `routeId` is `entry1_layout`.

### (WIP)Loading UI

:::info
This feature is currently experimental and the API may be adjusted in the future.
Currently, only CSR is supported, so stay tuned for Streaming SSR.
:::

Add the following code to `user/layout.tsx`:

```tsx title="routes/user/layout.tsx"
import {
  Await,
  defer,
  useLoaderData,
  Outlet
} from '@modern-js/runtime/router';

export const loader = () => {
  return defer({
    // fetchUserInfo 是一个异步函数，返回用户信息
    userInfo: fetchUserInfo(),
  })
}

export default function UserLayout() {
  const { userInfo } = useLoaderData() as {userInfo: Promise<UserInfo>};
  return (
    <div>
      <React.Suspense
        fallback={<p>Loading...</p>}
      >
        <Await resolve={userInfo} children={userInfo => (
          <div>
            <span>{userInfo.name}</span>
            <span>{userInfo.age}</span>
            <Outlet>
          </div>
        )}>
        </Await>
      </React.Suspense>
    </div>
  );
}
```

:::info
For specific usage of the Await component, see [Await](/docs/guides/basic-features/routes#await)

For specific usage of the defer function, see[defer](https://reactrouter.com/en/main/guides/deferred)
:::

### Wrong usage

1. Only serializable data can be returned in `loader`. In SSR environments, the return value of the `loader` function is serialized to a JSON string, which is then deserialized to an object on the client side. Therefore, no non-serializable data (such as functions) can be returned in the `loader` function.

:::warning
This restriction is not currently in place under CSR, but we strongly recommend that you follow it, and we may add it under CSR in the future.
:::

```ts
// This won't work!
export default () => {
  return {
    user: {},
    method: () => {},
  };
};
```

2. Modern.js will call the `loader` function for you, you shouldn't call it yourself in the component.

```tsx
// This won't work!
export default async () => {
  const res = fetch('https://api/user/profile');
  return res.json();
};

import loader from './page.loader.ts';
export default function RouteComp() {
  const data = loader();
}
```

3. You cannot import a `loader` file from a routing component, nor can you import variables in a routing component from a `loader` file:

```ts
// Not allowed
// routes/layout.tsx
import { useLoaderData } from '@modern-js/runtime/router';
import { ProfileData } from './page.loader.ts'; // should use "import type" instead

export const fetch = wrapFetch(fetch);

export default function UserPage() {
  const profileData = useLoaderData() as ProfileData;
  return <div>{profileData}</div>;
}

// routes/layout.loader.ts
import { fetch } from './layout.tsx'; // should not be imported from the routing component
export type ProfileData = {
  /*  some types */
};

export default async (): Promise<ProfileData> => {
  const res = await fetch('https://api/user/profile');
  return await res.json();
};
```

4. When run on the server side, the `loader` functions are packaged into a single bundle, so we do not recommend using `__filename` and `__dirname` for server-side code.

## useLoader(Old)

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
      name: 'Modern.js',
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
