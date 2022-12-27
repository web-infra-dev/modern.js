---
title: 数据获取
sidebar_position: 3
---

Modern.js 中提供了开箱即用的数据获取能力，开发者可以通过这些 API，在 CSR 和 SSR 环境同构的进行开发。

需要注意的是，这些 API 并不帮助应用发起请求，而是帮助开发者更好地管理数据，提升项目的性能。

## Data Loader(推荐)

Modern.js 推荐使用约定式路由做路由的管理，通过 Modern.js 的[约定式（嵌套）路由](/docs/guides/basic-features/routes#约定式路由)，每个路由组件(`layout.ts` 或 `page.ts`)可以导出一个函数`loader`，该函数可以在组件渲染之前执行，为路由组件提供数据。

:::info
Modern.js v1 支持通过 [useLoader](#useloader旧版) 获取数据，这已经不是我们推荐的用法，除迁移过程外，不推荐两者混用。
:::

### 基础示例

每个路由组件可以导出一个 `loader` 函数，然后通过 `useLoaderData` 函数获得相应的数据:

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

在 CSR 环境下，`loader` 函数会在客户端执行，`loader` 函数内可以使用浏览器的 API（但通常不需要，也不推荐）。

在 SSR 环境下，不管是首屏，还是在客户端的导航，`loader` 函数只会在服务端执行，这里可以调用任意的 Node.js API，同时这里使用的任何依赖和代码都不会包含在客户端的 bundle 中。

:::info
在以后的版本中，Modern.js 可能会支持在 CSR 环境下，`loader` 函数也在服务端运行，以提高性能和安全性，所以这里建议尽可能地保证 loader 的纯粹，只做数据获取的场景。
:::

当在客户端导航时，基于 Modern.js 的[约定式路由](/docs/guides/basic-features/routes)，所有的 loader 函数会并行执行（请求），即当访问 `/user/profile` 时，`/user` 和 `/user/profile` 下的 loader 函数都会并行执行（请求），以提高客户端的性能。

### Loader 放在单独文件中

除了支持 `loader` 函数从前端组件中导出，Modern.js 也支持将 `loader` 函数放在单独的文件中， 将 `loader` 函数放在单独的文件中，可以无需留意[副作用](#副作用处理)相关注意事项，但可以要注意的是，路由组件如 `layout.ts` 和 loader 文件 `layout.loader.ts` 不能引入彼此的代码，如果需要相关类型可以使用 `import type`，可以见下面的示例：

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

如[基础示例](#基础示例)中的 `loader` 可以用以下代码替代：
```tsx
// routes/user/page.loader.tsx
type ProfileData = { /* some type declarations */ }

export const loader = async(): ProfileData => {
  const res = await fetch('https://api/user/profile');
  return await res.json();
}

// routes/user/page.tsx
import { useLoaderData } from '@modern-js/runtime/router';
// 这里只能使用 import type，导入类型
import type { ProfileData } from './page.loader';

export default function UserPage() {
  const profileData = useLoaderData() as ProfileData;
  return <div>{profileData}</div>;
}
```


### `loader` 函数


`loader` 函数有两个入参：
#### `Params`

当路由文件通过 `[]` 时，会作为[动态路由](/docs/guides/basic-features/routes#动态路由)，动态路由片段会作为参数传入 loader 函数：

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

`request` 是一个 [Fetch Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) 实例。

一个常见的使用场景是通过 `request` 获取查询参数：
```tsx
// routes/user/[id]/page.tsx
import { LoaderArgs } from '@modern-js/runtime/router';

export const loader = async({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("id");
  return queryUser(userId);
}
```

#### 返回值

`loader` 函数的返回值可以是任何可序列化的内容，也可以是一个 [Fetch Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) 实例：

```tsx
export const loader = async(): ProfileData => {
  return {
    message: 'hello world',
  }
}
```

默认情况下，`loader` 返回的响应 `Content-type` 是 `application/json`，`status` 为 200，你可以通过自定义 `Response` 来设置：
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

### 请求 API

Modern.js 对 `fetch` API 做了 polyfill, 用于发起请求，该 API 与浏览器的 `fetch` API 一致，但是在服务端也能使用该 API 发起请求，这意味着不管是 CSR 还是 SSR，都可以使用统一的 `fetch` API 进行数据获取：
```tsx
export async function loader(){
  const res = await fetch('https://api/user/profile');
}
```


### 错误处理

在 `loader` 函数中，可以通过 `throw error` 或者 `throw response` 的方式处理错误，当 `loader` 函数中有错误被抛出时，Modern.js 会停止执行当前 loader 中的代码，并将前端 UI 切换到定义的 [`ErrorBoundary`](/docs/guides/basic-features/routes#错误处理) 组件：
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

### 获取上层组件的数据

很多场景下，子组件需要获取到祖先组件 loader 中的数据，你可以通过 `useRouteLoaderData` 方便地获取到祖先组件的数据：
```tsx
// routes/user/profile/page.tsx
import { useRouteLoaderData } from '@modern-js/runtime/router';

export default function UserLayout() {
  // 获取 routes/user/layout.tsx 中 loader 返回的数据
  const data = useRouteLoaderData('user/layout');
  return (
    <div>
      <h1>{data.name}</h1>
      <h2>{data.age}</h2>
    </div>
  );
}
```

`userRouteLoaderData` 接受一个参数 `routeId`，在使用约定式路由时，Modern.js 会为你自动生成`routeId`，`routeId` 的值是对应组件相对于 `src/routes` 的路径，如上面的例子中，子组件想要获取 `routes/user/layout.tsx` 中 loader 返回的数据，`routeId` 的值就是 `user/layout`。

在多 entry（MPA） 场景下，`routeId` 的值需要加上对应 entry 的 name，entry name 非指定情况下一般是 entry 目录名，如以下目录结构：
```bash
.
└── src
    ├── entry1
    │   ├── layout.tsx
    └── entry2
        └── layout.tsx
```

如果想获取 `entry1/layout.tsx` 中 loader 返回的数据，`routeId` 的值就是 `entry1_layout`。


### (WIP)Loading UI

:::info
此功能目前是实验性质，后续 API 可能有调整。
目前仅支持 CSR，敬请期待 Streaming SSR。
:::

因为获取数据是异步的，在数据获取完成之前，常常需要展示一个 Loading UI，以下是一个基本的示例，假设有以下目录：
```bash
.
└── routes
    ├── layout.tsx
    └── user
        ├── layout.tsx
        └── page.ts
```

我们在 `user/layout.tsx` 中获取用户的详细数据，在获取数据之前，希望展示一个 Loading UI。

首先，在项目中在 `routes` 目录下增加一个 `loading.tsx` 组件，该 `loading` 组件会对子目录下的所有路由生效（如 user）：
```bash
.
└── routes
    ├── layout.tsx
    └── user
        ├── layout.tsx
        └── page.ts
```

:::info
loading 组件的具体用法，请查看[loading](/docs/guides/basic-features/routes#loading)
:::

然后，在 `user/layout.tsx` 中添加以下代码：
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
Await 组件的具体用法请查看 [Await](https://reactrouter.com/en/main/components/await)

defer 的具体用法请查看 [defer](https://reactrouter.com/en/main/guides/deferred)
:::


<!-- TODO 缓存相关 -->

### 副作用处理

如上面所述，Modern.js 会将服务端代码 `loader` 从客户端 bundle 中移除，有一些你需要注意的事项，如果不想受副作用的影响，可以使用[单独文件](#单独文件) 的方式定义 `loader`。

:::info
在 CSR 场景下，通常副作用对项目影响较小，但依然希望你能遵循以下约定。
:::

模块的副作用可以认为是在模块被加载时执行的代码，比如：
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

因为 `console.log` 在 `routes/user/page.tsx` 加载时，就会被执行，编译器不会移除它，`transformProfile` 就会打包到客户端的 bundle 中。

所以我们不推荐有任何代码在模块加载时执行，包括项目代码和使用的第三方模块，以下是一些我们不推荐的写法：

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

在 SSR 场景，通常你需要在 `loader` 函数中使用 Node.js 核心包和依赖，对于非 Node.js 核心包，需要使用一个特殊约定的文件做重新导出，如使用 `fs-extra`：

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


### 错误用法

1. `loader` 中只能返回可序列化的数据，在 SSR 环境下，`loader` 函数的返回值会被序列化为 JSON 字符串，然后在客户端被反序列化为对象。因此，`loader` 函数中不能返回不可序列化的数据（如函数）。

:::warning
目前 CSR 下没有这个限制，但我们强烈推荐你遵循该限制，且未来我们可能在 CSR 下也加上该限制。
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

2. Modern.js 会帮你调用 `loader` 函数，你不应该自己调用 `loader` 函数：
```ts
// This won't work!
export const loader = async () => {
  const res = fetch('https://api/user/profile');
  return res.json();
};

export default function RouteComp() {
  const data = loader();
}
```

3. 在服务端运行时，`loader` 函数会被打包为一个统一的 bundle，所以我们不推荐服务端的代码使用 `__filename` 和 `__dirname`。


## useLoader（旧版）

**`useLoader`** 是 Modern.js 老版本中的 API。该 API 是一个 React Hook，专门提供给 SSR 应用使用，让开发者能同构的在组件中获取数据。

:::tip
CSR 的项目没有必要使用 `useLoader` 获取数据。
:::

以下是一个最简单的例子：

```tsx
import { useLoader } from '@modern-js/runtime';

export default () => {
  const { data } = useLoader(async () => {
    console.log('fetch in useLoader');

    // 这里没有发送真实的请求，只是返回了一个写死的数据。
    // 真实项目中，应该返回从远端获取的数据。
    return {
      name: 'modern.js',
    };
  });

  return <div>Hello, {data?.name}</div>;
};
```

上述代码启动后，访问页面。可以看到在终端输出了日志，而在浏览器终端却没有打印日志。

这是因为 Modern.js 在服务端渲染时，在会收集 `useLoader` 返回的数据，并将数据注入到响应的 HTML 中。如果 SSR 渲染成功，在 HTML 中可以看到如下代码片段：

```html
<script>
window._SSR_DATA = {};
</script>
```

在这全局变量中，记录了每一份数据，而在浏览器端渲染的过程中，会优先使用这份数据。如果数据不存在，则会重新执行 `useLoader` 函数。

:::note
在构建阶段，Modern.js 会自动为每个 `useLoader` 生成一个 Loader ID，并注入到 SSR 和 CSR 的 JS Bundle 中，用来关联 Loader 和数据。
:::

相比于 Next.js 中的 `getServerSideProps`，在渲染前预先获取数据。使用 `useLoader`，可以在组件中获取局部 UI 所需要的数据，而不用将数据层层传递。同样，也不会因为不同路由需要不同数据请求，而在最外层的数据获取函数中添加冗余的逻辑。当然 `useLoader` 也存在一些问题，例如服务端代码 Treeshaking 困难，服务端需要多一次预渲染等。

Modern.js 在新版本中，设计了全新的 Loader 方案。新方案解决了这些问题，并能够配合**嵌套路由**，对页面性能做优化。

:::note
详细 API 可以查看 [useLoader](/docs/apis/app/runtime/core/use-loader)。
:::

