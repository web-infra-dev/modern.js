---
sidebar_position: 6
title: Auto actions
---


import ReduckTip from '@site/docs/components/reduck-tip.md'

<ReduckTip />

Reduck 可以根据 State 的类型，自动生成相应的 Actions，为修改 State 提供便利。

:::tip 提示
可通过 [`runtime.state.autoActions`](/docs/apis/app/config/runtime/state#autoactions) 关闭 auto actions 功能。
:::

## 示例

### 基础数据类型

State 类型为 `string`、`number`、`boolean`、`null` 时，生成 `setState` Action。

```tsx title="示例"
const fooModel = model('foo').define({
  state: 1,
});

function App() {
  const [state, actions] = useModel(fooModel);

  return (
    <div>
      <div>State: {state}</div>
      <button
        type="button"
        onClick={() => {
          // 调用自动生成的 setState Action
          actions.setState(state + 1);
        }}
      >
        add
      </button>
    </div>
  );
}
```

### 数组 Array

State 类型为 Array 时，生成下列 Actions：

- `push`：将一个或多个元素添加到数组的末尾。
- `pop`：从数组中删除最后一个元素。
- `shift`：从数组中删除第一个元素。
- `unshift`：将一个或多个元素添加到数组的开头。
  - 语法：`arr.unshift(element1, ..., elementN)`
  - `elementN`：要添加到数组开头的元素或多个元素。
- `filter`：过滤元素。
<!-- 语义与原生方法不同，待修改 API -->
- `concat`：拼接数组。
<!-- 语义与原生方法不同，待修改 API -->
- `splice`：通过删除或替换现有元素或者原地添加新的元素来修改数组，并以数组形式返回修改后的数组（注意和原生 `splice` 返回值不同）。
  - 语法：`splice(start[, deleteCount[, item1[, item2[, ...]]]])`
  - `start`：指定修改的开始位置（从0计数）。
  - `deleteCount`：可选，整数，表示要移除的数组元素的个数。
  - `item, item2, ...`：可选，要添加进数组的元素，从 start 位置开始。如果不指定，则 `splice` 将只删除数组元素。

```tsx title="示例"
const fooModel = model('foo').define({
  state: [1, 2, 3],
});

function App() {
  const [state, actions] = useModel(fooModel);

  useEffect(() => {
    actions.push(4);
    actions.pop();
    actions.shift(0);
    actions.unshift();
    actions.filter(val => val <= 2);
    actions.splice(0, 1, 1, 2);
  }, []);

  return (
    <div>
      <div>State: {state}</div>
    </div>
  );
}
```

### 简单对象 PlainObject

State 类型为 PlainObject 时，根据 State 包含的属性名，生成 `set${key}`（小驼峰命名）Actions。

```tsx title="示例"
const fooModel = model('foo').define({
  state: {
    a: 1,
    b: { value: 1 },
    c: 'c',
  },
});

function App() {
  const [state, actions] = useModel(fooModel);

  useEffect(() => {
    actions.setA(2);
    actions.setB({ value: 2 });
    actions.setC('d');
  }, []);

  return (
    <div>
      <div>State: {state}</div>
    </div>
  );
}
```
