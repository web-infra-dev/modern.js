---
title: loadable
sidebar_position: 1
---

:::info 补充信息
用于创建 `loadable 的组件`。
:::

```ts
import loadable from '@modern-js/runtime/loadable';
```

## API

```ts
<Props>(
  loadFn: Function,
  options?: {
    resolveComponent?: (
      module: Module,
      props: Props,
    ) => React.ComponentType<Props>,
    fallback?: JSX.Element;
    ssr?: boolean;
  }
) => LoadableComponent
```

### loadFn

类型：`function`

用于加载组件。

```ts
import loadable from '@modern-js/runtime/loadable';

const OtherComponent = loadable(() => import('./OtherComponent'))
```

### options.resolveComponent

类型：`(module: Module, props: Props) => React.ComponentType<Props>`

`module` 为 `loadFn` 返回的组件，`props` 是 loadable 返回的组件接受的 props 参数。默认的话，我们认为 `import` 的文件都是默认导出 react 组件，这时候直接渲染该组件即可。但当组件是具名导出的，或者我们需要根据具体的 `props` 动态判断需要渲染哪个组件的时候，可以使用 `resolveComponent` 来实现。下面是一个示例：

```ts title='component.js'
export const Apple = () => 'Apple!'
export const Orange = () => 'Orange!'
```

```ts title='loadable.js'
const LoadableApple = loadable(() => import('./components'), {
  resolveComponent: (components) => components.Apple,
})
const LoadableOrange = loadable(() => import('./components'), {
  resolveComponent: (components) => components.Orange,
})
const LoadableFruit = loadable(() => import('./components'), {
  resolveComponent: (components, props) => components[props.fruit],
})
```

### options.fallback

类型：`JSX.Element`

在 loading 阶段显示 fallback 内容。

### options.ssr

类型：`boolean`

默认值：`true`

如果是 `false`，则该组件不会再服务端渲染阶段处理，即不支持 ssr，默认值是 `true`。

### LoadableComponent（返回值类型）

[loadableComponent](./loadable-component.md)。

## loadable.lib

创建一个 `loadable 的库`。

```ts
import loadable from '@modern-js/runtime/loadable';
const Moment = loadable.lib(() => import('moment'))
```

```ts
<Props>(
  loadFn: Function,
  options?: {
    resolveComponent?: any,
    fallback?: any;
    ssr?: boolean;
  }
) => LoadableLibrary
```

### options

同 [options](#optionsresolvecomponent)。

### LoadableLibrary （返回值类型）

移架 [LoadableLibrary](./loadable-library.md)。

