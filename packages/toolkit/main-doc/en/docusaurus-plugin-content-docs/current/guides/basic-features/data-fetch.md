---
title: Fetch Data
sidebar_position: 3
---

Modern.js provides out of the box fetching data capabilities, developers can use these APIs to develop in CSR and SSR environments isomorphic.

It should be noted that these APIs do not help applications to initiate requests, but help developers better manage the relationship between data and routing.

## Data loader(recommend)

Modern.js recommends the use of conventional routing for route management. With Modern.js' [conventional (nested) routing](/docs/guides/basic-features/routes#conventional-routing), each routing component (`layout.ts` or `page.ts`) can export a function `loader` that can be executed before the component renders, providing data to the routing component.

:::info
Modern.js v1 supports getting data by [useLoader](#useloaderold), which is no longer the recommended usage and it is not recommended to mix both except for migration process.
:::

### Basic example

Each routing component can export a `loader` function and get the  data via the `useLoaderData` function:

```ts
// routes/user/page.tsx
import { useLoaderData } from '@modern-js/runtime/router';

export const loader = async(): ProfileData => {
  const res = await fetch('https://api/user/profile');
  return await res.json();
}

export default function UserPage() {
  const profileData = useLoaderData() as ProfileData;
  return <div>{profileData}</div>;
}
```

In a CSR environment, the `loader` function is executed on the client side, and the browser API can be used within the `loader` function (but it is usually not needed and not recommended).

In an SSR environment, the `loader` function will only be executed on the server side, regardless of the first screen or the navigation on the client side, where any Node.js API can be called, and any dependencies and code used here will not be included in the client bundle.

:::info
In later versions, Modern.js may support `loader` functions running on the server side as well in CSR environments to improve performance and security, so here it is recommended to keep the loader as pure as possible and only do data fetching scenarios.
:::

When navigating on the client side, all loader functions under `/user` and `/user/profile` are executed (requested) in parallel based on Modern.js's [conventional routing](/docs/guides/basic-features/routes), i.e. when accessing `/user/profile`, the loader functions under `/user` and `/user/profile` are executed (requested) in parallel to improve client-side performance.

### Loader is defined in a separate file

In addition to supporting the export of `loader` functions from front-end components, Modern.js also supports placing `loader` functions in a separate file, by defining the `loader` function in a separate file, there is no need to pay attention to [side effect](#side-effects) related considerations, but it is important to note that routing components such as `layout.ts` and the loader file `layout.loader.ts` cannot introduce each other's code, if you need the related types you can use `import type`, you can see the following example:

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

For example, `loader` in [basic example](#basic-example) can be replaced with the following code:

```tsx
// routes/user/page.loader.tsx
type ProfileData = { /* some type declarations */ }

export const loader = async(): ProfileData => {
  const res = await fetch('https://api/user/profile');
  return await res.json();
}

// routes/user/page.tsx
import { useLoaderData } from '@modern-js/runtime/router';
// here you can only use import type
import type { ProfileData } from './page.loader';

export default function UserPage() {
  const profileData = useLoaderData() as ProfileData;
  return <div>{profileData}</div>;
}
```

### `loader` function

The `loader` function has two input parameters：

##### `Params`

When a routing file is passed through `[]`, it is passed as a [dynamic route](/docs/guides/basic-features/routes#dynamic-route) and the dynamic route fragment is passed as an argument to the loader function：

```tsx
// routes/user/[id]/page.tsx
import { LoaderArgs } from '@modern-js/runtime/router';

export const loader = async({ params }: LoaderArgs) => {
  const { id } = params;
  const res = await fetch(`https://api/user/${id}`);
  return res.json();
}
```

当访问 `/user/123` 时，`loader` 函数的参数为 `{ params: { id: '123' } }`。

#### `request`

`request` is a [Fetch Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) instance.

A common usage scenario is to obtain query parameters via `request`:
```tsx
// routes/user/[id]/page.tsx
import { LoaderArgs } from '@modern-js/runtime/router';

export const loader = async({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("id");
  return queryUser(userId);
}
```

#### Return value

`loader` 函数的返回值可以是任何可序列化的内容，也可以是一个 [Fetch Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 实例：

```tsx
export const loader = async(): ProfileData => {
  return {
    message: 'hello world',
  }
}
```

By default, the response `Content-type` returned by `loader` is `application/json` and `status` is 200, which you can set by customizing `Response`:

```tsx
export const loader = async(): ProfileData => {
  const data = {message: 'hello world'};
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json; utf-8",
    },
  });
}
```

### Request API

Modern.js does a polyfill of the `fetch` API to initiate requests, which is consistent with the browser's `fetch` API, but can also be used on the server side to initiate requests, meaning that both CSRs and SSRs can use the unified `fetch` API for data fetching：

```tsx
export async function loader(){
  const res = await fetch('https://api/user/profile');
}
```

### Error handling

In the `loader` function, errors can be handled by `throw error` or `throw response`. When an error is thrown in the `loader` function, Modern.js will stop executing the code in the current loader and switch the front-end UI to the defined [`ErrorBoundary`](/docs/guides/basic-features/routes#errorboundary) component.

```tsx
// routes/user/profile/page.tsx
export async function loader(){
  const res = await fetch('https://api/user/profile');
  if(!res.ok){
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
  // Get the data returned by the loader in routes/user/layout.tsx
  const data = useRouteLoaderData('user/layout');
  return (
    <div>
      <h1>{data.name}</h1>
      <h2>{data.age}</h2>
    </div>
  );
}
```

`userRouteLoaderData` takes one parameter `routeId`,When using conventional routing, Modern.js will automatically generate `routeId` for you. The value of `routeId` is the path of the corresponding component relative to `src/routes`, as in the example above, the child component wants to get the data returned by the loader in `routes/user/layout.tsx`, the value of `routeId` is  `user/layout`.

In a multi-entry (MPA) scenario, the value of `routeId` needs to be added to the name of the corresponding entry, and the entry name is usually the entry directory name if not specified, such as the following directory structure:
```bash
.
└── src
    ├── entry1
    │   ├── layout.tsx
    └── entry2
        └── layout.tsx
```

If you want to get the data returned by the loader in `entry1/layout.tsx`, the value of `routeId` is `entry1_layout`.

### (WIP)Loading UI

:::info
This feature is currently experimental and the API may be adjusted in the future.
Currently, only CSR is supported, so stay tuned for Streaming SSR.
:::

Because fetching data is asynchronous, it is often necessary to display a loading UI before the data fetching is complete, and the following is a basic example, assuming the following directory structure:

```bash
.
└── routes
    ├── layout.tsx
    └── user
        ├── layout.tsx
        └── page.ts
```

We get the user's detailed data in `user/layout.tsx` and want to show a loading UI before getting the data.

First, add a `loading.tsx` component to the `routes` directory in your project, which will take effect for all routes in the subdirectory (e.g. user):
```bash
.
└── routes
    ├── layout.tsx
    └── user
        ├── layout.tsx
        └── page.ts
```

:::info
For specific usage of the loading component, see [loading](/docs/guides/basic-features/routes#loading)
:::

Then, add the following code to `user/layout.tsx`:

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
      <Await resolve={userInfo} children={userInfo => (
        <div>
          <span>{userInfo.name}</span>
          <span>{userInfo.age}</span>
          <Outlet>
        </div>
      )}>
      </Await>
    </div>
  );
}
```

:::info
For specific usage of the Await component, see [Await](/docs/guides/basic-features/routes#await)

For specific usage of the defer function, see[defer](https://reactrouter.com/en/main/guides/deferred)
:::

### Side Effects

As mentioned above, Modern.js removes the server-side code `loader` from the client bundle, there are some things you need to be aware of, if you don't want to suffer from side effects, you can define `loader` in a [separate file](#loader-is-defined-in-a-separate-file).

:::info
In CSR scenarios, the side effects usually have less impact on the project, but you are still expected to follow the following conventions.
:::

Side effects of a module can be thought of as code that is executed when the module is loaded, such as:

```tsx
// routes/user/page.tsx
import { useLoaderData } from '@modern-js/runtime/router';
// highlight-next-line
import { transformProfile } from "./utils";
// highlight-next-line
console.log(transformProfile);

export const loader = async(): ProfileData => {
  const res = await fetch('https://api/user/profile');
  const data = await res.json();
  return transformProfile(data);
}

export default function UserPage() {
  const profileData = useLoaderData() as ProfileData;
  return <div>{profileData}</div>;
}
```

Since `console.log` is executed when `routes/user/page.tsx` is loaded, the compiler does not remove it and `transformProfile` is bundled into the client bundle.

So we do not recommend having any code executed when the module is loaded, including project code and third-party modules used, and the following are some of the ways we do not recommend writing.

```tsx
// routes/user/page.tsx
export default function UserPage() {
  return <div>profile</div>;
}

UserPage.config = {}
```

```tsx
// routes/init.ts
document.title = 'Modern.js';

// routes/layout.tsx
import "./init.ts";

export default function Layout() {
  return <></>
}
```

In SSR scenarios, you usually need to use Server Side packages  in the `loader` function, and for non-Node.js core packages, you need to do a re-export using a specially agreed file, such as using `fs-extra`:

```tsx
// routes/user/avatar.tsx
import { useLoaderData } from '@modern-js/runtime/router';
import { readFile } from './utils.server';

type ProfileData = { /* some type declarations */ }

export const loader = async(): ProfileData => {
  const profile = await readFile('profile.json');
  return profile;
}

export default function UserPage() {
  const profileData = useLoaderData() as ProfileData;
  return <div>{profileData}</div>;
}

// routes/user/utils.server.ts
export * from 'fs-extra';
```

### Wrong usage

1. Only serializable data can be returned in `loader`. In SSR environments, the return value of the `loader` function is serialized to a JSON string, which is then deserialized to an object on the client side. Therefore, no non-serializable data (such as functions) can be returned in the `loader` function.

:::warning
This restriction is not currently in place under CSR, but we strongly recommend that you follow it, and we may add it under CSR in the future.
:::

```ts
// This won't work!
export const loader = () => {
  return {
    user: {},
    method: () => {

    }
  }
}
```

2. Modern.js will call the `loader` function for you, you shouldn't call it yourself in the component.

```tsx
// This won't work!
export const loader = async () => {
  const res = fetch('https://api/user/profile');
  return res.json();
};

export default function RouteComp() {
  const data = loader();
}
```

3. When run on the server side, the `loader` functions are packaged into a single bundle, so we do not recommend using `__filename` and `__dirname` for server-side code.


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
