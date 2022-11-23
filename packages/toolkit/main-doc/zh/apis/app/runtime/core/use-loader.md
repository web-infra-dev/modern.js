---
title: useLoader
---

一个同构的 API，通常会用来做异步请求。当 SSR 的时候，服务端使用 `useLoader` 预加载数据，同时浏览器端也会复用这部分数据。

## 使用姿势

```ts
import { useLoader } from '@modern-js/runtime';
```

## 函数签名

```ts
type LoaderFn = (context: runtimeContext) => Promise<unknow>;
type Options = {
  onSuccess: (data: Record<string, any>) => void;
  onError: (error: Error) => void;
  initialData: Record<string, any>;
  skip: boolean;
  params: Record<string, any>;
  static: boolean;
}
type ReturnData = {
  data: Record<string, any>;
  loading: boolean;
  error: Error;
  reload: (params?: Record<string, any>) => Promise<any> | undefined;
  reloading: boolean;
}

function useLoader(loaderFn: LoaderFn, options: Options): ReturnData;
```

:::info
`runtimeContext` 类型可以参考 [useRuntimeContext](/docs/apis/app/runtime/core/use-runtime-context)。
:::

### 参数

- `loaderFn`：用于加载数据的函数，返回 Promise。
- `options`：可选配置项。
  - `onSuccess`：执行成功的回调。
  - `onError`：执行失败的回调。
  - `initialData`：首次执行前的初始数据，对应返回值中的 `data` 字段。
  - `skip`：当值为 `true` 时，函数不执行。
  - `params`：当 `params` 序列化结果发生改变时，函数会重新执行。同时，`params` 也会作为函数的第二个参数被传入。
  - `static`：当值为 `true` 时，`useLoader` 用于 [SSG](/docs/guides/advanced-features/ssg) 编译阶段数据的获取。

### 返回值

- `data`：执行成功时的返回数据。
- `loading`：表示函数是否处于执行过程中。
- `error`：函数执行失败时的错误信息。
- `reload`：调用后可以重新执行函数。
  - `params`：当值为 `undefined` 时，函数执行时将复用上次的值；否则会使用新的值重新执行函数。
- `reloading`：调用 `reload` 的执行过程中，`reloading` 值为 `true`。

## 示例

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
