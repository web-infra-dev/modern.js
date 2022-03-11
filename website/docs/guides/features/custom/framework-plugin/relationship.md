---
sidebar_position: 4
---

# 插件之间的关系

Modern.js 的插件系统还提供了排序的功能。在 `createPlugin` 函数的参数中，第二个参数是一个对象，用于控制插件顺序、互斥等能力，对象中可用的字段如下：

* `name`: `string`，设置当前插件的名字
* `pre`: `string[]`，这些插件最终会调整到当前插件前面
* `post`: `string[]`，这些插件最终会调整到当前插件后面
* `rivals`: `string[]`，遇到有这些名字的插件会报错
* `required`: `string[]`，添加的插件列表中没有这些名字的插件会报错

通过以上这几个参数可以实现插件的前置、后置、互斥、必需排序。

## 排序

Modern.js 的插件通过两个参数来实现了插件排序的功能：`pre`、`post`。

### 前置

默认的插件会按照他的添加顺序执行，但如果添加了 `pre` 字段，比如有下面两个插件：

```ts title=foo.ts
const foo = createPlugin(
  () => { /** do something */ },
  {
    name: 'plugin-foo'
  }
)
```

```ts title=bar.ts
const bar = createPlugin(
  () => { /** do something */ },
  {
    name: 'plugin-bar',
    pre: ['plugin-foo']
  }
)
```

`bar` 插件中把 `plugin-foo` 添加到了 `pre` 字段，无论它们的添加顺序是怎样的都会是 `foo` 插件的执行是在 `bar` 插件之前。

### 后置

同样的，有下面两个插件：

```ts title=foo.ts
const foo = createPlugin(
  () => { /** do something */ },
  {
    name: 'plugin-foo'
  }
)
```

```ts title=bar.ts
const bar = createPlugin(
  () => { /** do something */ },
  {
    name: 'plugin-bar',
    post: ['plugin-foo']
  }
)
```

`bar` 插件中把 `plugin-foo` 添加到了 `post` 字段，无论它们的添加顺序是怎样的都会是 `foo` 插件的执行是在 `bar` 插件之后。

## 互斥

有下面两个插件：

```ts title=foo.ts
const foo = createPlugin(
  () => { /** do something */ },
  {
    name: 'plugin-foo'
  }
)
```

```ts title=bar.ts
const bar = createPlugin(
  () => { /** do something */ },
  {
    name: 'plugin-bar',
    rivals: ['plugin-foo']
  }
)
```

`bar` 插件中把 `plugin-foo` 添加到了 `rivals` 字段，如果同时添加了 `foo` 插件和 `bar` 插件就会报错。

## 必需

有下面两个插件：

```ts title=foo.ts
const foo = createPlugin(
  () => { /** */ },
  {
    name: 'plugin-foo'
  }
)
```

```ts title=bar.ts
const bar = createPlugin(
  () => { /** */ },
  {
    name: 'plugin-bar',
    required: ['plugin-foo']
  }
)
```

`bar` 插件中把 `plugin-foo` 添加到了 `required` 字段，如果同时添加了 `foo` 插件和 `bar` 插件，就会报错。
