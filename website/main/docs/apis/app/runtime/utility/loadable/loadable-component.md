---
title: LoadableComponent
sidebar_position: 3
---

`LoadableComponent` 是 `loadable` 或 `lazy` 函数返回的对象类型。

## LoadableComponent 类型

```ts
type LoadableComponent<Props> =
  React.ComponentType<
    Props & { fallback?: JSX.Element; }>
  & {
    preload(props?: Props): void;
    load(props?: Props): Promise<React.ComponentType<Props>>;
  }
```

### props

类型：`object`

`LoadableComponent` 组件可接收任意 props 参数，这些参数会转发给 loadFn。

### fallback

类型：`JSX.Element`

当组件尚未加载完成（即 loading 阶段）会显示 `fallback` 内容。

## LoadableComponent.preload

```ts
import loadable from '@modern-js/runtime/loadable'

const OtherComponent = loadable(() => import('./OtherComponent'))
OtherComponent.preload()
```

`preload` 接收的参数会全部传给 `loadFn`。

:::info 注
预加载脚本中函数始终不会返回一个 Promise 对象，如果你想等待组件加载完成，请使用 [load](#LoadableComponent.load) 函数
:::


## LoadableComponent.load

```ts
import loadable from '@modern-js/runtime/loadable'

const OtherComponent = loadable(() => import('./OtherComponent'))
OtherComponent.load().then(() => {
  console.log('Component is loaded!')
})
```

:::info 注
如果你无需等待组件加载完成，则使用 [preload](#LoadableComponent.preload) 即可。
:::
