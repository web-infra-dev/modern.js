---
title: LoadableLibrary
sidebar_position: 4
---

`lazy.lib` 和 `loadable.lib` 函数返回 `LoadableLibrary` 对象

## LoadableLibrary 类型

```ts
type LoadableLibrary = React.ComponentType<{
  fallback?: JSX.Element;
  children?: (module: Module) => React.ReactNode;
  ref?: React.Ref<Module>;
}>
```

### fallback

类型：`JSX.Element`

组件 `loading` 阶段显示 `fallback` 内容。

### children

库加载完成只有的回调。

```ts
import loadable from '@modern-js/runtime/loadable'
const Moment = loadable.lib(() => import('moment'))
function FromNow({ date }) {
  return (
    <div>
      <Moment fallback={date.toLocaleDateString()}>
        {({ default: moment }) => moment(date).fromNow()}
      </Moment>
    </div>
  )
}
```

### ref

类型：`React.Ref<Module>`

可以通过 `ref` 拿到所加载库的实例。

```ts
import loadable from '@modern-js/runtime/loadable'
const Moment = loadable.lib(() => import('moment'))
class MyComponent {
  moment = React.createRef()
  handleClick = () => {
    if (this.moment.current) {
      return alert(this.moment.current.default.format('HH:mm'))
    }
  }
  render() {
    return (
      <div>
        <button onClick={this.handleClick}>What time is it?</button>
        <Moment ref={this.moment} />
      </div>
    )
  }
}
```
