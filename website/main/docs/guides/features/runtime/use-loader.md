---
sidebar_position: 1
title: Loader 管理
---

## 什么是 Loader

开发 SSR 应用，服务端预加载数据是一个必不可少的流程，它通常包含以下 3 个阶段：

1. 服务端预先请求应用渲染所需要的数据，使用获取到的数据在服务端生成完整 HTML。
2. 服务端返回 HTML 的同时，把请求到的数据同步到客户端（一般是通过将数据序列化，插入到返回给客户端的 HTML 的 Script 脚本中）。
3. 客户端复用服务端预先请求到的数据，执行后续逻辑。

Modern.js 提出了 Loader 的概念，将上述行为进行抽象。通过 `useLoader` 这样一个同构的 API，处理 SSR 应用的数据请求，Modern.js 会自动处理上述三个流程。

## 简单的 useLoader 使用

```ts
function App() {
  const { data, loading, error } = useLoader(async () => {
    return fetch(url);
  });

  return ...;
}
```

`useLoader` 返回： `data`（成功时返回的数据）、`loading`（Loader 是否正在加载中）、`error`（失败时返回的错误信息）。

## 如何做服务端数据的同步

`useLoader` 是一个 Hook 函数，可以在任意 React 组件中使用，那么 `Modern.js` 是怎么去同步服务端预加载的数据到客户端呢?

服务端很容易把所有加载到的 Loader 执行一遍，并拿到返回的数据，难点在于如何在客户端运行的时候同步这份数据。
`Modern.js` 编译的时候会给每一个 Loader 生成一个唯一的 `id` ，用于数据同步的标记。如下是一个编译后的产物示例：

```ts
var loader = async () => {
  return fetch(url);
};

loader.id = 'id1';

const { data, loading, error } = useLoader(loader);
```

那么服务端运行完成后会产生如下结构的数据：

```ts
{
  'id1': {
    data: 'hello',
    error: null,
    loading: false
  }
}
```

客户端重新运行 Loader 的时候，会根据自身的 `id` 从服务端预先加载的数据中去查找，如果找不到对应数据，客户端会重新执行 Loader。

## useLoader 降级

在真实的业务场景中，服务端执行 `useLoader` 可能因为各种原因出现错误，此时就需要将失败了的 `useLoader` 降级到客户端重新执行。
当 `useLoader` 执行失败，返回的数据结构示例如下：

```ts
{
  'id1': {
    data: null,
    error: 'I was failed',
    loading: false
  }
}
```

当客户端执行时发现 `error` 字段不为空，认为该 `useLoader` 在服务端失败，会降级到客户端重新执行。

## 结合 SSG 使用

使用 [`SSG`](/docs/guides/features/server-side/web/ssg) 时，页面的请求会分为两种数据：

- 静态的，即不会变更的，我们希望在 SSG 编译阶段就加载这部分数据并生成到 HTML 中。
- 动态的，会频繁变更的，需要在客户端运行时再次请求这部分数据。

对于第一部分需要在 SSG 编译阶段使用的数据，我们只需要给 `useLoader` 加一个 `static` 的标识：

```tsx
function Home() {
  const { data: staticData } = useLoader(async () => {
    return fetch(url1);
  }, { static: true })

  const { data: dynamicData } = useLoader(async () => {
    return fetch(url2);
  })

  return ...
}
```

第一个 Loader 使用的静态数据 `staticData` 在编译阶段就会被加载加载，第二个 Loader 使用的动态数据 `dynamicData` 在客户端运行时才会被请求加载。


## Loader 缓存、重试

### 缓存

在实际业务场景中，一个同样功能的 `useLoader` 可能在多个不同的组件中使用。 Modern.js 支持 Loader 的缓存和去重能力，避免额外重复的 Loader 执行。

例如，我们有一个获取用户信息的 Loader：

```ts
function useUserInfoLoader(username) {
  return useLoader(
    async(context, _username) => {
      return fetch(userUrl, { params: { _username } })
    },
    {
      params: username
    }   // 第二个参数，起到 Loader ID 作用
  );
}
```

注意我们将 `username` 传给了 `useLoader` 的第二个参数的 `params`，这里的 `params` 起到 Loader ID 的作用。Modern.js 内部会将 `params` 序列化成一个 ID，作为 Loader 的唯一标识。`params` 作为 ID 的优先级高于编译时生成的 Loader ID。

当我们在不同组件中使用 `useUserInfoLoader` 的时候：

```tsx
function Home() {
  const { data } = useUserInfoLoader('bob');

  return ...;
}

function About() {
  const { data } = useUserInfoLoader('bob');
  const { data: data1 } = useUserInfoLoader('tom');

  return ...;
}

function App() {
  return <div>
    <Home />
    <About />
  </div>
}
```

`Home` 组件和 `About` 组件都执行了 `useUserInfoLoader('bob')`，根据上文我们知道 `'bob'` 最终会作为 Loader 的 ID，因为 ID 是相等的，所以 Modern.js 内部只会保留一个 Loader 实例，即只会请求一次 `'bob'` 的用户信息。

### 重试

Loader 过期之后，我们需要重新执行 Loader 以更新数据。

Modern.js 中提供了两种更新 Loader 的方式，**自动更新** 和 **手动更新**。


#### 自动更新

```tsx
function Home({ username }) {
  const { data, reloading } = useUserInfoLoader(username);

  return ...;
}
```

我们改造 `Home` 组件，接收了一个 `username` 字段作为 props。那么当 `username` 更新的时候，对应的 `UserInfoLoader` 是会重新执行的，也就是说重新请求新的 `username` 对应的用户信息。`useLoader` 会把 `params` 参数认为是自身的依赖，当 `params` 序列化后的值更新了的时候，对应 Loader 才会重新执行，更新 Loader 数据，否则沿用之前旧的数据。

我们可以根据 `reloading` 的值来判断当前的 Loader 是否处于正在更新的状态中。

:::info 注
- 当一个 Loader 更新的时候，该 Loader 所在的其它组件也会响应 Loader 更新，进行重新渲染。
:::

#### 手动更新

```tsx
function Home({ username }) {
  const { data, reloading, reload } = useUserInfoLoader(username);

  return <div>
    <div>{JSON.stringify(data)}</div>
    <button onClick={() => reload('kitten')}> reload </button>
  </div>
}
```

我们点击 `reload` 按钮，执行 `reload('kitten')` 函数，此时会触发 Loader 的重新执行，`'kitten'` 会作为新的参数传给 Loader 函数。

:::info 注
- 当需要用之前参数更新 Loader 时，可直接执行 `reload()`。
:::

## Dependent Loader

Loader 获取数据是异步的，当一个 Loader 的执行依赖另外一个 Loader 执行完成，我们可以使用 `skip` 参数实现。

```tsx
function Home() {
  const { data, loading } = useLoader(async () => {
    return new Promise(resolve => setTimeout(resolve, 1000))
  });


  const res = useLoader(async (context, data) => {
    return fetch(url, { body: data });
  }, { params: data, skip: loading || !data });
}
```

当第一个 Loader 没有返回的时候，`loading` 的值为 `true`，`data` 为空。我们通过 `loading || !data` 跳过第二个 Loader 的执行。
当第一个 Loader 成功执行完后，`loading || !data` 值转变为 `true`，第二个 Loader 便开始执行了。


:::info 补充信息
- 本章代码示例：[use-loader](https://github.com/modern-js-dev/modern-js-examples/tree/main/series/tutorials/runtime-api/use-loader)。
- 更多介绍，请参考【[useLoader API](/docs/apis/runtime/container/use-loader)】。
:::
