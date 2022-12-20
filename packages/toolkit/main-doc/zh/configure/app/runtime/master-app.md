---
sidebar_label: masterApp
---

# runtime.masterApp

* 类型： `Object`

:::info
使用该配置首先需要使用 [new 命令](/docs/apis/app/commands/new)启用「微前端」功能。
:::


## 启用

在当前应用工程根目录执行 `pnpm run new`, 并选择 **启用「微前端」功能**

```bash
$ pnpm run new
? 请选择你想要的操作 启用可选功能
? 启用可选功能 (Use arrow keys)
❯ 启用「微前端」功能
```

## 示例

import EnableMicroFrontend from '@site-docs/components/enable-micro-frontend.md';

<EnableMicroFrontend />

## `manifest`

```ts
interface Manifest {
  getAppList?: ()=> Array<AppInfo>
}
```

#### `getAppList?`

通过 `getAppList` 配置，可以自定义如何获取远程列表数据

```ts
type GetAppList = ()=> Promise<Array<AppInfo>>;
```


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
