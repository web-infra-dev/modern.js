---
title: cleanup
sidebar_position: 3
---

:::info 补充信息
用于卸载掉当前已渲染的所有组件。
```ts
import { cleanup } from '@modern-js/runtime/testing';
```
:::

## API

`cleanup() => void`

## 示例

:::info 注
请注意，如果你使用的测试框架支持 afterEach，并且它被注入到你的测试环境中（如mocha、Jest和Jasmine），**会默认在 afterEach 钩子里执行 `cleanup`**。否则，你将需要在每次测试后进行手动清理。
:::

例如，如果你使用[ava](https://github.com/avajs/ava)测试框架，那么你需要像这样使用test.afterEach钩子。

```tsx
import { cleanup, render } from '@modern-js/runtime/testing';
import test from 'ava'

test.afterEach(cleanup)

test('renders into document', () => {
  render(<div />)
  // ...
})

// ... more tests ...
```
