---
sidebar_label: masterApp
---

# runtime.masterApp

- Type： `Object`

:::info
First you need to enable the "micro frontend" function using [new command](/docs/apis/app/commands/new).
:::

## Example

import EnableMicroFrontend from '@site-docs-en/components/enable-micro-frontend.md';
import MasterManifestAppConfig from '@site-docs-en/components/micro-master-manifest-config.md';

<EnableMicroFrontend />
<MasterManifestAppConfig />

### apps

When `apps` is an object, it represents the information of the child application module `Array<AppInfo>`.

```ts
interface AppInfo {
  name: string;
  entry: string;
  activeWhen?: string | ()=> boolean;
}
```

- name: The name of the module.
- entry: The entry of the module.

### Other Config

Under the `masterApp` configuration, developers can pass through the configuration items of Garfish.

All supported configuration items [see here](https://garfishjs.org/api/run/#%E5%8F%82%E6%95%B0).
