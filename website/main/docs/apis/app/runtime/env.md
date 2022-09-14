---
sidebar_position: 1
---

# 环境变量

Modern.js 默认提供了下列环境变量：

- `NODE_ENV`：表示当前的执行环境。
- `PORT`：表示应用运行的端口。

## NODE_ENV

表示当前的执行环境，是**只读的**的环境变量，其值在不同的执行命令下具有不同的值：

- `production`：执行 `modern build` 命令时的默认值。
- `test`：执行 `modern test` 命令时的默认值。
- `development`：执行 `modern dev` 命令时的默认值，同时也是其他所有情况下的默认值。

## 自定义环境变量

除了上述默认提供的环境变量，还可以通过 `shell` 或 `.env` 文件自定义环境变量。

### 通过 `shell` 指定

在命令前添加自定义环境变量：

```shell
FOO=123 BAR=456 pnpm run dev
```

### 通过 `.env` 文件指定

在项目根目录创建 `.env` 文件，其中添加自定义环境变量：

```env
FOO=123
BAR=456
```

更多文件格式：

- `.env`：默认文件。
- `.env.development`：当 `NODE_ENV` 值为 `development` 时，读取该文件。
- `.env.production`：当 `NODE_ENV` 值为 `production` 时，读取该文件。
- `.env.test`：当 `NODE_ENV` 值为 `test` 时，读取该文件。

### 优先级

- 当 `.env.*` 与 `.env` 同时存在，`.env.*` 会和 `.env` 进行合并，相同名称的环境变量以 `.env.*` 为准。
- 通过 `.env` 设置的环境变量，优先级高于 `shell` 指定的环境变量。

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
