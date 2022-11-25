---
title: 环境变量
sidebar_position: 7
---

Modern.js 提供了对环境变量的支持，包含内置的环境变量和自定义的环境变量。

## 内置的环境变量

### NODE_ENV

表示当前的执行环境，是**只读的**的环境变量，其值在不同的执行命令下具有不同的值：

- `production`：执行 `modern build`、`modern preview` 命令时的默认值。
- `test`：执行 `modern test` 命令时的默认值。
- `development`：执行 `modern dev` 命令时的默认值，同时也是其他所有情况下的默认值。

### MODERN_ENV

手动设置当前的执行环境。除了上述 NODE_ENV 对应的值之外，这里支持自定义环境名称，例如 `staging`、`boe` 等。

:::tip
MODERN_ENV 的优先级高于 NODE_ENV。
:::

## 自定义环境变量

环境变量支持通过 `shell` 和 `.env` 文件两种方式指定。

### 通过 `shell` 指定

在命令前添加自定义环境变量：

```shell
REACT_APP_FOO=123 BAR=456 pnpm run dev
```

### 通过 `.env` 文件指定

在项目根目录创建 `.env` 文件，并添加自定义环境变量，这些环境变量会默认添加到启动项目的 Node.js 进程中，例如：

```env
REACT_APP_FOO=123
BAR=456
```

`.env` 文件遵循以下规则加载规则：

* `.env`：默认加载。
* `.env.{ MODERN_ENV | NODE_ENV }`：针对具体环境设置环境变量，会覆盖 `.env` 中的设置。

当需要根据环境使用不同的配置时，可以把环境变量定义到对应环境名称的 `.env` 文件中，并在启动项目时手动设置执行环境。例如使用以下命令启动项目时，将会加载 `.env` 和 `.env.staging`:

```shell
MODERN_ENV=staging pnpm run dev
```

## 使用环境变量

### 约定命名

在前端代码中可以直接使用 `NODE_ENV` 环境变量。另外，以 `MODERN_` 开头的自定义环境变量，也可以在代码中直接使用。

例如:

```js
if (process.env.NODE_ENV === 'development') {
  // do something
}
```

执行 `pnpm run dev` 命令之后可以看到如下构建产物:

```js
if (true) {
  // do something
}
```

同样在自定义的 HTML 模板中，也可以直接使用这类环境变量。如 `config/html/head.html`:

```js
<meta name="test" content="<process.env.NODE_ENV>">
```

### 任意命名

如果需要在代码中使用任意名称的环境变量，可以在 [`source.globalVars`](/docs/configure/app/source/global-vars) 配置指定, 例如:

```typescript title="modern.config.ts"
export default defineConfig({
  source: {
    globalVars: {
      'process.env.VERSION': process.env.VERSION,
    }.
  },
});
```

此时，在代码中的 `process.env.VERSION`，将会被替换为环境变量中 `VERSION` 的值。

:::note
`source.globalVar` 也支持将其他表达式或字符串替换为指定的值，不仅限于环境变量。
:::
