---
sidebar_label: router
sidebar_position: 1
---

# runtime.router

:::info 适用的工程方案
* MWA
:::

* 类型： `Object`
* 默认值： 默认会根据当前入口访问路由设置 `historyOptions.basename`。

:::tip 提示

```ts
export interface BrowserHistoryBuildOptions {
    basename?: string | undefined;
    forceRefresh?: boolean | undefined;
    getUserConfirmation?: typeof getConfirmation | undefined;
    keyLength?: number | undefined;
}

export interface HashHistoryBuildOptions {
    basename?: string | undefined;
    hashType?: HashType | undefined;
    getUserConfirmation?: typeof getConfirmation | undefined;
}

export type RouterConfig =  {
      supportHtml5History: true;
      historyOptions: BrowserHistoryBuildOptions;
   }
  | {
      supportHtml5History: false;
      historyOptions: HashHistoryBuildOptions;
    }
```
:::

具体配置选项解释如下:

### supportHtml5History

* 类型： `Boolean`
* 默认值： `true`

值为 `true` 则使用 `BrowserRouter` 否则使用 `HashRouter`。

### historyOptions

* 类型： `BrowserHistoryBuildOptions | HashHistoryBuildOptions`
* 默认值： 默认会根据当前入口路由设置 basename。

historyOptions 具体配置可以参考: [history](https://github.com/remix-run/history/blob/v4/docs/Misc.md)
