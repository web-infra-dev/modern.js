---
title: 环境变量
sidebar_position: 7
---

## 使用环境变量

默认情况下，在前端代码中可以直接使用 `NODE_ENV` 环境变量，如下:

```js
if (process.env.NODE_ENV === 'development') {
  // do something
}
```

执行 `dev` 命令之后可以看到构建产物如下:

```js
if (true) {
  // do something
}
```

同样在自定义的 HTML 模板中，也可以直接使用环境变量。如 `config/html/head.html`:

```js
<meta name="test" content="<process.env.NODE_ENV>">
```

如果想在代码中使用除 `NODE_ENV` 以外的环境变量，可以在 [`source.define`](/docs/configure/app/source/define) 配置指定, 如下:
```typescript title="modern.config.ts"
export default defineConfig({
  source: {
    envVars: ['VERSION']
  }
})
```

`VERSION` 环境变量需要在编译之前设置好, 可以在执行命令时添加:

```bash
// linux, macOS
$ VERSION=1.0.0 npm run dev

// windows
$ set VERSION=1.0.0&&npm run dev
```

Modern.js 也支持在 `.env` 文件中定义环境变量：

```js title=".env"
VERSION=1.0.0
```

更多文件格式：

* `.env`：默认加载。
* `.env.development`、`.env.test`、`.env.production`：针对具体环境设置环境变量，会覆盖 `.env` 中的设置。


## 使用全局变量

Modern.js 支持在编译时设置代码中使用到的全局变量:

```typescript title="modern.config.ts"
export default defineConfig({
  source: {
    globalVars: {
      VERSION: '1.0.0'
    }
  }
})
```

在代码中可以直接使用:

```ts title="App.tsx"
/* TS 应用中，需要声明该变量 */
declare const VERSION: string;

const a = VERSION;
```
