---
sidebar_label: masterApp
---

# runtime.masterApp

* 类型： `Object`

:::caution 注意
需要先通过 `pnpm run new` 启用「微前端」 功能。
:::

## 示例

import EnableMicroFrontend from '@site-docs/components/enable-micro-frontend.md';
import MasterManifestAppConfig from '@site-docs/components/micro-master-manifest-config.md';

<EnableMicroFrontend />
<MasterManifestAppConfig />


### apps

当 `apps` 为对象类型的时候，表示子应用模块的信息 `Array<AppInfo>`

```ts
interface AppInfo {
  name: string;
  entry: string;
  activeWhen?: string | ()=> boolean;
}
```

- name: 子应用的名称。
- entry: 子应用的入口。
- activeWhen?: 子应用激活路径。

### 其他配置项

在 `masterApp` 配置下，开发者可以透传 Garfish 的配置项。

所有支持的配置项[点此查看](https://garfishjs.org/api/run/#%E5%8F%82%E6%95%B0)
