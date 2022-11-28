---
sidebar_position: 3
---

# enableFunc

启用功能，支持应用和模块工程方案。

该方法可在 `onForged` 生命周期的 api 参数上获取。

其类型定义为：

```ts
export enum ActionFunction {
  UnBundle = 'unbundle',
  TailwindCSS = 'tailwindcss',
  BFF = 'bff',
  MicroFrontend = 'micro_frontend',
  I18n = 'i18n',
  Test = 'test',
  E2ETest = 'e2e_test',
  Doc = 'doc',
  Storybook = 'storybook',
  RuntimeApi = 'runtimeApi',
  SSG = 'ssg',
  Polyfill = 'polyfill',
  Deploy = 'deploy',
}
export type ForgedAPI = {
  enableFunc: (
    func: ActionFunction,
    params?: Record<string, unknown> | undefined,
  ) => Promise<void>;
  ...
};
```

## func

功能名称，根据不用的工程方案支持的功能进行传值。

## params

启用功能时其他参数，详细参考[应用 New 命令](/docs/guides/topic-detail/generator/config/mwa#new-命令)和[模块 New 命令](/docs/guides/topic-detail/generator/config/module#new-命令)。
