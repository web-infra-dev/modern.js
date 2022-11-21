---
sidebar_label: masterApp
sidebar_position: 4
---

# runtime.masterApp

* 类型： `Object`

:::info
使用该配置首先需要使用 [new 命令](/docs/apis/app/commands/new)启用「微前端」功能。
:::
## `manifest`

主应用添加子应用信息。

- 类型：`modules: Array<{
        name: string;
        entry: string;
        activeWhen?: string;
      }> | string;`
- 默认值：`null`

### `modules`

当 `modules` 为对象类型的时候，表示子应用模块的信息。

- name: 子应用的名称。
- entry: 子应用的入口。
- activeWhen?: 子应用激活路径。

当 `modules` 为 `string` 时，是一个 url 地址，请求该地址可以拿到和 `modules` 对象格式一样的数据结构。

## `LoadingComponent`

- 类型: `React.ComponentType | React.ElementType`
- 默认值 `null`

当加载或切换子应用的时候，加载的过渡动画。

`LoadingComponent` 需要通过 [defineConfig](/docs/apis/app/runtime/app/define-config) 配置。

```tsx
import { defineConfig } from '@modern-js/runtime';

function App() {
  ...
}

defineConfig(
  App,
  {
    masterApp: {
      LoadingComponent: () => {
        return <div>loading...</div>
      }
    }
  }
)
```
