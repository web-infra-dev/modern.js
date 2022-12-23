---
title: 别名
sidebar_position: 8
---

Modern.js 允许在 JS 和 CSS 中使用别名导入自定义目录下的模块，并内置了以下别名:

```js
{
  '@': '<appDirectory>/src',
  '@shared': '<appDirectory>/shared',
}
```

:::info 注
在开启可选功能时，生成器也会动态的添加内置别名，例如启用 BFF 时默认会添加 `@api` 别名。
:::

例如从 `src/App.tsx` 文件中导入 `src/common` 目录下的模块：

```bash
.
├── common
│   ├── styles
│   │   └── base.css
│   └── utils
│       └── index.ts
├── App.tsx
```

`src/App.tsx` 中写法如下：

```ts
import utils from '@/src/common/utils';
import '@/src/common/styles/base.css';
```

Modern.js 也提供了自定义别名的方式，以添加 `@common` 别名为例，对于 TypeScript 项目，只需要在项目根目录 `tsconfig.json` 下配置 `compilerOptions.paths` 如下：

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

JavaScript 项目可以在 `modern.config.js` 中配置 [`source.alias`](/docs/configure/app/source/alias)：

```typescript title="modern.config.ts"
export default defineConfig({
  source: {
    alias: {
      '@common': './src/common'
    }
  }
});
```

具体别名配置可以参考 【[API 资料 - source.alias](/docs/configure/app/source/alias)】。
