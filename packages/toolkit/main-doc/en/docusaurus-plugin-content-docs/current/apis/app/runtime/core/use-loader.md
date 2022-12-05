---
title: useLoader
---

Isomorphic API，usually used to make asynchronous requests。When SSR, the server level uses `useLoader` to prefetch the data, and the browser side also reuses this part of the data.

## Usage

```ts
import { useLoader } from '@modern-js/runtime';
```

## Function Signature

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
`runtimeContext` can refer to [useRuntimeContext](/docs/apis/app/runtime/core/use-runtime-context)。
:::

### Input

- `loaderFn`: function for loading data, returning a Promise.
- `options`: optional configuration.
  - `onSuccess`: successful callback.
  - `onError`: error callback.
  - `initialData`: the initial data before the first execution,.
  - `skip`: when the value is `true`, the function does not execute.
  - `params`: when the result of the `params` serialization changes，the function is re-executed。`params` is also passed in as the second argument of the function.
  - `static`: when the value is `true`, `useLoader` is used for [SSG](/docs/guides/advanced-features/ssg).

### Return Value

- `data`: return data on successful execution.
- `loading`: indicates whether the function is in execution.
- `error`: error message when function execution fails。
- `reload`: the function can be re-executed after the call.
  - `params`: when the value is `undefined`, the last value will be reused; otherwise, the function will be re-executed with the new value.
- `reloading`: during the execution of the call to `reload`, the value of `reloading` is `true`.

## Example

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
