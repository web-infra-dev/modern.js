---
title: useLoader
sidebar_position: 4
---

:::info 补充信息
一个同构的 API，通常会用来做异步请求。当 SSR 的时候，服务端使用 `useLoader` 预加载数据，同时浏览器端也会复用这部分数据。

```ts
import { useLoader } from "@modern-js/runtime";
```

:::

## API

`useLoader(loaderFn,[options]) => object`

### 参数

- loaderFn: `(context: any, params: Record<string, any>) => Promise`，用于加载数据的函数，返回 Promise。
- [options]: `object` ，可选配置项。
  - [onSuccess]: `(data: Record<string, any>) => void`，`loaderFn` 执行成功的回调。
  - [onError]: `(error: Error) => void`，`loaderFn` 执行失败的回调。
  - [initialData]: `Record<string, any>`， `loaderFn` 首次执行前的初始数据，对应返回值中的 `data` 字段。
  - [skip]: `boolean`，当值为 `true` 时， `loaderFn` 不执行。
  - [params]: `Record<string, any>`， 当 `params` 序列化结果发生改变时，`loaderFn` 会重新执行。同时，`params` 也会作为 `loaderFn` 的第二个参数被传入。
  - [static]: `boolean`，当值为 `true` 时，`useLoader` 用于 [SSG](/docs/guides/features/server-side/web/ssg) 编译阶段数据的获取。

### 返回值

- data: `Record<string, any>`， `loaderFn` 函数执行成功时的返回数据。
- loading: `boolean`，表示 `loaderFn` 是否处于执行过程中。
- error: `Error`，`loaderFn` 函数执行失败时的错误信息。
- reload: `(params?: Params) => Promise<any> | undefined`，调用该函数可以重新执行 `loaderFn`。
  - params?: `Record<string, any> | undefined`，当 `params` 为 `undefined`，`loaderFn` 执行时将复用上次的 `params` 参数；当 `params` 有值时，则会使用新的 `params` 参数重新执行 `loaderFn`。
- reloading: `boolean`，调用 `reload` 的执行过程中， `reloading` 值为 `true`。

## 示例

### 普通使用

```ts
function Container() {
  const { data, error, loading } = useLoader(
    async (context, params) => {
      console.log(params) // nicole
      return fetch(user);
    },
    {
      onSuccess: data => {
        console.log('I did success:(',  data);
      },
      onError: error => {
        console.log('I met error:)',  error);
      },
      initialData: { name: 'nicole', gender: 'female' },
      params: 'nicole'
    }
  );

  return ...;
}
```

:::info 相关内容
[Loader 管理](/docs/guides/features/runtime/use-loader)
:::
