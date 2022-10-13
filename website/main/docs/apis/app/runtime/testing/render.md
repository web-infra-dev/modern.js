---
title: render
sidebar_position: 1
---

:::info 补充信息
用于在测试用例中渲染组件，完成测试。
```ts
import { render } from '@modern-js/runtime/testing';
```
:::


## API

`render(ui, [options]) => RenderResult`

### 参数

- ui: `React.ReactElement<any>`，需要被渲染的 React 组件。
- [options]: `object`，render 可选配置。
  - container: `DOMElement`，表示组件所要挂载到的 DOM 节点，默认是会创建一个 `div` 元素，并自动添加到 `document.body` 上。这个 `div` 元素就是组件要挂载的节点。默认值是 `document.body.append(document.createElement('div'))`。
  - baseElement: `DOMElement`，用于指定 `queries` 中使用到的 `basename`。如果指定了 `container`, 则默认值为 `container` 的值，否则就是 `document.body`。
  - hydrate: `boolean`，如果设置为 `true`，则会使用 [ReactDOM.hydrate](https://reactjs.org/docs/react-dom.html#hydrate) 渲染组件。默认值为 `false`。
  - wrapper: `React.ComponentType<{children: ReactNode}>`，是一个 react 组件，可用于自定义渲染逻辑。
  - queries: `any`，自定义一些自己的 `queries`。


### 返回值

- {...queries}: `any`, 所有可用的 [queries](https://testing-library.com/docs/queries/about/)。
- container: `DOMElement`，`container` 是挂载 React 组件的 DOM 节点。
- baseElement: `DOMElement`。
- debug: `function`。
- rerender: `function`，如果想测试一个已渲染的组件在其 props 更新时的一些场景，可以使用 rerender 来现实。
- unmount: `function`，会卸载掉已渲染的组件。如果想测试组件卸载后的情况（如，绑定的事件是否在 unmount 阶段被卸载掉），那么这个 API 是很帮助的。
- asFragment: `function`，返回当前渲染的组件的 [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment) 对象。可用于测试 react 事件触发后 DOM 结构的响应。


## 示例

```ts
import { render } from '@modern-js/runtime/testing';

test('renders a message', () => {
  const { container, getByText } = render(<Greeting />)
  expect(getByText('Hello, world!')).toBeInTheDocument()
  expect(container.firstChild).toMatchInlineSnapshot(`
    <h1>Hello, World!</h1>
  `)
})
```
