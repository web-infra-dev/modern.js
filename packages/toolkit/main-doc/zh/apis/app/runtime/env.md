---
sidebar_position: 1
title: 环境变量
---

Modern.js 内置了对环境变量的支持，包含内置的环境变量和自定义的环境变量。

## 内置的环境变量

### NODE_ENV

表示当前的执行环境，是**只读的**的环境变量，其值在不同的执行命令下具有不同的值：

- `production`：执行 `modern build`、`modern preview` 命令时的默认值。
- `test`：执行 `modern test` 命令时的默认值。
- `development`：执行 `modern dev` 命令时的默认值，同时也是其他所有情况下的默认值。

### MODERN_ENV

用于设置当前的执行环境，除了上述 NODE_ENV 对应的值之外，这里支持自定义环境名称，比如 `staging`、`boe` 等，Modern.js 会根据该环境变量对应的加载 env.{process.env.MODERN_ENV} 文件中设置的环境变量值。

当需要通过环境名称使用不同的配置时，可以把环境变量定义到对应的环境名称的 env 文件中。

MODERN_ENV 的优先级高于 NODE_ENV。

## 自定义环境变量

Modern.js 支持自定义的环境变量，以 `MODERN_` 开头的环境变量可以在代码中直接使用。

如果需要自动以任意名称的环境变量，需要在 [`source.define`](/docs/configure/app/source/define) 配置中声明后使用。

## 定义环境变量

环境变量支持通过 `shell` 和 `.env` 文件两种方式指定。

### 通过 `shell` 指定

在命令前添加自定义环境变量：

```shell
REACT_APP_FOO=123 BAR=456 pnpm run dev
```

### 通过 `.env` 文件指定

在项目根目录创建 `.env` 文件，其中添加自定义环境变量：

```env
REACT_APP_FOO=123
BAR=456
```

.env 文件支持后缀名后 NODE_ENV 或 MODERN_ENV 定义的环境名称，如 `.env.development`，可根据项目需求进行定义。Modern.js 会根据环境名称变量值读取对应的 env 文件。

## 使用环境变量

### JS/TS 代码内使用

通过 `process.env.*` 直接获取环境变量。

```js
console.log(process.env.NODE_ENV);
// "development"
```

### HTML 代码片段使用

```html title="config/html/head.ejs"
<meta name="env" content="<%=process.env.NODE_ENV %>" />
```
