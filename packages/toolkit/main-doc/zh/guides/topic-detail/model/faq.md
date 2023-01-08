---
sidebar_position: 13
title: 常见问题
---

# 常见问题

## 浏览器兼容性

Reduck 的编译构建产物默认使用 ES6 语法，如果你需要支持更低版本的浏览器，请将 `@modern-js-reduck` 命名空间下的所有包加入到应用的编译过程。

:::info 补充信息
Reduck 使用的 [`@babel/preset-env`](https://babeljs.io/docs/en/babel-preset-env) 的详细[配置](https://github.com/modern-js-dev/reduck/blob/main/common/config.js#L10~L17)。
:::

## 微前端子应用 Model 访问主应用 Model

微前端子应用 Model 访问主应用 Model 时，如果该 **Model** 在主应用尚未挂载，会自动挂载到子应用上。

示例：

```ts
import { useModel } from '@modern-js/runtime/model';
import parentModel from '@MasterApp/models/todoModel';

function SubModelApp() {
  const [state, actions] = useModel(parentModel);

  return <div>...</div>;
}
```

![微前端通信流程图](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/mf-communicate.svg)

为了避免意外降级挂载，建议将主应用所需要共享的 Model 预先挂载：

```ts
// App 是主应用的入口组件，sharedModel1、sharedModel2 是需要共享的 Model。
App.models = [sharedModel1, sharedModel2];
```
