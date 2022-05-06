---
sidebar_label: 别名、环境变量和全局变量
sidebar_position: 6
---

# 别名、环境变量和全局变量

## 使用别名

Modern.js 允许在 JS 和 CSS 中使用别名导入自定义目录下的模块，并内置了以下别名:

```js
{
  '@': '<appDirectory>/src',
  '@shared': '<appDirectory>/shared',
}
```

:::info 注
在开启可选功能时，生成器也会动态的添加内置别名，例如启用 BFF 时默认会添加 `@api` 别名：
:::

`src/` 目录结构如下时，从 `src/App.tsx` 文件中导入 `src/common` 目录下的模块:

```bash
.
├── common
│   ├── styles
│   │   └── base.css
│   └── utils
│       └── index.ts
├── App.tsx
```

`src/App.tsx` 中写法如下:

```ts
import utils from '@/src/common/utils';
import '@/src/common/styles/base.css';
```

Modern.js 也提供了自定义别名的方式，以添加 `@common` 别名为例，对于 TypeScript 项目，只需要在项目根目录 `tsconfig.json` 下配置 `compilerOptions.paths` 如下:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": [
        "./src/*"
      ],
      "@/common/*": [
        "./src/common/*"
      ]
    }
  },
}
```

JavaScript 项目可以在 `modern.config.js` 中配置 [`source.alias`](/docs/apis/config/source/alias):

```js title="modern.config.js"
export default defineConfig({
  source: {
    alias: {
      '@common': './src/common'
    }
  }
});
```

具体别名配置可以参考 【[API 资料 - source.alias](/docs/apis/config/source/alias)】。


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

如果想在代码中使用除 `NODE_ENV` 以外的环境变量，可以在 [`source.envVars`](/docs/apis/config/source/env-vars) 配置指定, 如下:

```js title="modern.config.js"
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

```js title="modern.config.js"
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
