---
sidebar_label: Overview
sidebar_position: 1
---

# Overview

This section describes the configuration of the Runtime plugin.

## Configuration

### runtime

- Type: `Object`

The runtime is configured as follows:

#### Base

Configure in `modern.config.ts`:

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    state: true,
    router: true,
  },
});
```

#### DefineConfig

Configure use [`defineConfig`](/docs/apis/app/runtime/app/define-config) API:

:::info
When there is a function in the runtime configuration, it can only be configured in this way.
:::

```ts title="src/App.tsx"
import { defineConfig } from '@modern-js/runtime';

const App = () => {
  /** */
};

defineConfig(App, {
  router: {
    supportHtml5History: false,
  },
});

export default App;
```

:::info
Using runtime configuration, you can solve the problem that runtime plugin configuration needs to be at runtime to get specific content.

Runtime plugin runtime configuration and configuration directly in `modern.config.ts` are merged by default, and runtime configuration takes precedence.
:::

:::warning
defineConfig 中只能定义 Runtime 插件的具体配置内容，确认是否开启插件还需要通过 `package.json` 中的 `modernConfig` 或者 `modern.config.ts` 中的配置决定。
:::

### runtimeByEntries

- Type: `Object`

#### Introduce

Add the runtime configuration according to the entry. The option attribute is consistent with the runtime. The specified value will be replaced and merged with the content of the runtime attribute.

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    state: false,
  },
  runtimeByEntries: {
    entry1: {
      state: true, // { state: true }
    },
    entry2: {
      // { state: false, router: true }
      router: true,
    },
  },
});
```
