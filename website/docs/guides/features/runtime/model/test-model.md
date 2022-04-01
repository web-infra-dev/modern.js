---
sidebar_position: 9
title: 测试 Model
---

好的测试对代码的稳健性至关重要。下面以 【[Model 介绍](/docs/guides/features/runtime/model/model-introduction)】 的 `countModel` 为例，演示如何对 Model 写单元测试。

使用测试功能，需要先开启该功能。在项目根目录下，执行 `pnpm run new`，进行如下选择：

```bash
? 请选择你想要的操作： 启用可选功能
? 启用可选功能： 启用「单元测试 / 集成测试」功能
```

即可开启测试功能支持。

新增 `count.test.ts` 文件，代码如下：

```ts
import { createStore } from '@modern-js/runtime/testing';
import countModel from './count';

describe('test model', () => {
  it('count value should plus one after add', () => {
    const store = createStore();
    const [state, { add }] = store.use(countModel);

    expect(state).toEqual({value: 1})

    add();

    expect(store.use(countModel)[0]).toEqual({value: 2})
  })
});
```
:::info 注
这里使用的 `createStore` 是从 `@modern-js/runtime/testing` 导入的，内部会使用 [`runtime.state`](/docs/apis/config/runtime/state) 的配置去创建 `store`。
:::

在测试用例里，我们新建一个 `store` 来挂载 `countModel`，通过 `store.use` 获取 `countModel` 的 State 和 Actions。然后调用 `add` Action 更新状态， 并断言更新后的状态值。

执行 `pnpm run test` 命令，触发测试用例的执行。

