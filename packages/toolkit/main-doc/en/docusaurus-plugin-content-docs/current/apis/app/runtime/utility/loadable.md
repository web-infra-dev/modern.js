---
title: loadable
---

Used to create Loadable component

## Usage

```ts
import loadable from '@modern-js/runtime/loadable';
```

## Function Signature

```ts
type Options = {
  resolveComponent?: (
    module: Module,
    props: Props,
  ) => React.ComponentType<Props>,
  fallback?: JSX.Element;
  ssr?: boolean;
}

function loadable(loadFn: Function, options?: Options) => LoadableComponent
```

### Input

#### loadFn

Used to load component.

```ts
import loadable from '@modern-js/runtime/loadable';

const OtherComponent = loadable(() => import('./OtherComponent'))
```

#### options.resolveComponent

Type: `(module: Module, props: Props) => React.ComponentType<Props>`

`module` is the component returned by `loadFn`, and `props` is the props parameter accepted by the component.

By default, we think that the default export of file is a react component, so we can render the component directly. But when the component is named export, or we need to dynamically determine which component needs to be rendered according to the `props`, we can use `resolveComponent`. Here is an example:

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

#### options.fallback

Whether to display fallback content during loading.

#### options.ssr

Whether to support SSR, the default value is `true`。

### Return Value

#### LoadableComponent

```ts
type LoadableComponent<Props> =
  React.ComponentType<
    Props & { fallback?: JSX.Element; }>
  & {
    preload(props?: Props): void;
    load(props?: Props): Promise<React.ComponentType<Props>>;
  }
```
