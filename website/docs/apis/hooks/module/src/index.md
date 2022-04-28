---
title: src/index.[tj]s
sidebar_position: 2
---

模块工程方案入口文件。

模块工程方案的导出支持一下集中类型：

- 一个函数或者类

```ts
export default function () {
  return 'hello world';
}
```

- 一个 React 组件

```ts
export default () => {
  return (
    <div>Hello World</div>
  );
}
```

- 一个 Module 对象或者 Module 工厂函数

```ts
import { model } from '@modern-js/runtime/model';

type State = {
  data: {
    name: string;
  }[];
};

export default model<State>('test').define({
  state: {
    data: [],
  },
  actions: {
    load: {
      fulfilled(state, payload) {
        return {data: payload};
      },
    }
  },
  effects: {
    async load() {
      ...
    },
  },
});

```

- 一个数据

```ts
export default {
  "test": 1,
};
```

当使用默认导出的方式导出模块时，支持导出以上任意一种类型。

当使用多个导出的方式导出模块时，支持同时导出以上多种类型。

模块工程方案还支持同时使用默认导出和多个导出。

模块工程方案支持导出的组件、Module 对象、Module 工厂、函数和类上通过静态属性的方式导出其他类型。
