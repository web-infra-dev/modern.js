---
sidebar_position: 2
---

# AfterForged

`afterForged` function is the generator plugin time to live function, which is usually used to define operations such as installation dependency and Git. Professional operations will be performed after the onForged function is executed.

The method is available directly on the context.

Its type is defined as:

```ts
export type PluginAfterForgedFunc = (
  api: AfterForgedAPI,
  inputData: Record<string, unknown>,
) => Promise<void>;

export interface IPluginContext {
  afterForged: (func: PluginAfterForgedFunc) => void;
  ...
}
```

## func

The onForged parameter is a callback function, and the function parameters are `api` and `inputData`.

### api

A list of supported functions in `afterForged` time to live, specifically viewabl [Git API](/docs/guides/topic-detail/generator/plugin/api/git/isInGitRepo) 和 [NPM API](/docs/guides/topic-detail/generator/plugin/api/npm/install).

### inputData

Current user input, the user can be used to obtain the current input information and configuration information.
