---
sidebar_position: 3
---

# 插件之间的关系

Modern.js 的插件配置对象提供了一系列的字段，用于控制插件顺序、互斥等能力，可用的字段如下：

- `name`: `string`，设置当前插件的名称。
- `pre`: `string[]`，这些插件最终会调整到当前插件前面。
- `post`: `string[]`，这些插件最终会调整到当前插件后面。
- `rivals`: `string[]`，互斥插件，遇到这些插件时会报错。
- `required`: `string[]`，必需插件，插件列表中没有对应的插件时会报错。
- `usePlugin`: `CliPlugin[]`，注册其他插件。

通过以上参数可以实现插件的前置、后置、互斥、必需等逻辑。

## 插件排序

Modern.js 的插件通过 `pre`、`post` 参数来实现了插件排序的功能。

### 前置插件

默认情况下，插件会按照添加顺序依次执行，通过 `pre` 字段可以声明前置执行的插件。

比如有下面两个插件：

```ts title=foo.ts
const foo = {
  name: 'plugin-foo',
};
```

```ts title=bar.ts
const bar = {
  name: 'plugin-bar',
  pre: ['plugin-foo'],
};
```

`bar` 插件在 `pre` 字段中配置了 `foo` 插件，因此 `foo` 插件一定会在 `bar` 插件之前执行。

### 后置插件

同样的，通过 `post` 字段可以声明后置执行的插件。

```ts title=foo.ts
const foo = {
  name: 'plugin-foo',
};
```

```ts title=bar.ts
const bar = {
  name: 'plugin-bar',
  post: ['plugin-foo'],
};
```

`bar` 插件在 `post` 字段中配置了 `foo` 插件，因此 `foo` 插件一定会在 `bar` 插件之后执行。

## 互斥插件

通过 `rivals` 字段可以声明插件间的互斥关系。

有下面两个插件：

```ts title=foo.ts
const foo = {
  name: 'plugin-foo',
};
```

```ts title=bar.ts
const bar = {
  name: 'plugin-bar',
  rivals: ['plugin-foo'],
};
```

`bar` 插件在 `rivals` 字段中配置了 `foo` 插件，因此同时添加了 `foo` 插件和 `bar` 插件就会报错。

## 必需插件

通过 `required` 字段可以声明插件间的依赖关系。

有下面两个插件：

```ts title=foo.ts
const foo = {
  name: 'plugin-foo',
};
```

```ts title=bar.ts
const bar = {
  name: 'plugin-bar',
  required: ['plugin-foo'],
};
```

`bar` 插件在 `required` 字段中配置了 `foo` 插件，因此使用 `bar` 插件时，如果未配置 `foo` 插件就会报错。

## 注册插件

当插件之间存在依赖关系时，我们也可以在一个插件中通过 `usePlugin` 主动注册另一个插件：

```ts title=foo.ts
const foo = () => ({
  name: 'plugin-foo',
});

const bar = () => ({
  name: 'plugin-bar',
  usePlugin: [foo()],
});
```

当使用者配置了 `bar` 插件时，`foo` 插件也会自动注册生效，使用者就不需要去额外注册 `foo` 插件了。
