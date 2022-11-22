---
sidebar_label: masterApp
---

# runtime.masterApp

* 类型： `Object`

:::info
First you need to enable the "micro frontend" function using [new command](/docs/apis/app/commands/new).
:::

## `manifest`

The main application adds sub-application information.

* Type: `modules: Array<{
        name: string;
        entry: string;
        activeWhen?: string;
      }> | string;`
* Default: `null`

### `modules`

When `modules` is an object type, it represents the information of the sub-application module.

- name: The name of the child application
- entry: The entry of the child application
- activeWhen?: The path of the child application

When  `modules` is `string`, it is a url address, and requesting this address can get the same data structure as the `modules` object format.

## `LoadingComponent`

* Type: `React.ComponentType | React.ElementType`
* Default: `null`

A transition animation to load when loading or switching child applications.

`LoadingComponent` needs to be configured with [defineConfig](/docs/apis/app/runtime/app/define-config).

```tsx
import { defineConfig } from '@modern-js/runtime';

function App() {
  ...
}

defineConfig(
  App,
  {
    masterApp: {
      LoadingComponent: () => {
        return <div>loading...</div>
      }
    }
  }
)
```
