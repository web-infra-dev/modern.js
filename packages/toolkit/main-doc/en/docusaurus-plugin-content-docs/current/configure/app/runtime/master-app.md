---
sidebar_label: masterApp
---

# runtime.masterApp

* Type： `Object`

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
