---
sidebar_position: 7
title: handleEffect
---

import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />

一个异步函数类型的 Effect，通常有三种需要处理的状态: 1.请求中；2.请求成功；3.请求处理失败。这些状态处理的方式，就是编写对应的 Action 函数(pending、fulfilled、rejected)。

借助 `handleEffect` API，我们可以生成默认的 Action 函数来处理异步请求各个阶段的不同结果。`handleEffect` 生成的 Action 返回的 State 的结构如下：

```ts
interface State {
  result: any; // 存储 fulfilled 状态的返回结果
  pending: boolean; // 请求是否结束
  error: string; // 请求失败的结果
}
```

## 类型

```ts
interface EffectActions {
  pending: Action;
  fulfilled: Action;
  rejected: Action;
}

interface Config {
  ns?: string;
  result?: string | false;
  error?: string | false;
  pending?: string | false;
  combineMode?: 'merge' | 'replace';
  omitResultNamespace?: boolean;
}

function handleEffect(config: Config): EffectActions;
```

## 参数

- ns：默认返回的 State 结构扁平地挂载到 Model 的 State 上，通过设置该参数可以将返回的 State 挂载到 `ns` 值命名的字段下。例如，`ns` 设置为 `data`，返回的 State 结构为：

```ts
interface State {
  data: {
    pending: boolean;
    result: any;
    error: string;
  }
}
```

- result：默认值为 `"result"`。该参数对应存储异步请求 fulfilled 状态结果的字段名称。例如，设置 `result` 为 `"items"`，返回的 State 结构为：

```ts
interface State {
  items: any; // 默认的 result -> items
  pending: boolean;
  error: string;
}
```

`result` 为 `false`，返回的 State 结构中不存在 `result`：

```ts
interface State {
  pending: boolean;
  error: string;
}
```

- pending：默认值为 `"pending"`。改变返回 State 中的 `pending` 字段名。用法同上。

- error： 默认值为 `"error"`。改变返回 State 中的 `error` 字段名。用法同上。

- combineMode：默认值为 `"merge"`。获取 fulfilled 状态的返回数据后，对 `result` 的处理方式：merge（合并）和replace（替换）。这里能自动处理的数据类型也仅限为简单的对象或者数组类型。
  - merge：前一次的数据与当前的数据合并。数据为数组类型，内部操作类似于 `[].concat(lastData, currentData)`；数据为对象类型，内部操作类似于 `{...lastData, ...curData}`。
  - replace：当前的数据直接替换之前的数据。

- omitResultNamespace：默认值为 `"false"`。当异步请求的结果为对象类型，希望把该结果直接挂载到 Model 的 State 上，而不是挂载到 `"result"` 上，可以设置为 true。例如：

```ts
// 一个异步请求得到的数据为一个对象：{user: 'xx', email: 'xx'}，
// 配置 handleEffect({ omitResultNamespace: true })
// 则得到的 State 结构如下：
{
  user: 'xx',
  email: 'xx',
  pending: false,
  error: null,
}
```


## 返回值

分别处理 pending、fulfilled、rejected 三种状态的 Action 组成的对象。


:::info 更多参考
[副作用管理](/docs/guides/features/model/manage-effects)
:::
