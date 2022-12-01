---
sidebar_position: 3
---

# enableFunc

Enable functionality to support application and module engineering scenarios.

This method is available on the `onForged` API parameter.

Its type is defined as:

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

The function name is passed according to the functions supported by the different engineering solutions.

## params

For other parameters when the function is enabled, please refer to[MWA New Command](/docs/guides/topic-detail/generator/config/mwa)和[Module New Command](/docs/guides/topic-detail/generator/config/module).
