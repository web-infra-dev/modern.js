---
title: source.entries
sidebar_label: entries
---

- 类型： `Object = { [ entryName: string ]: string | Object }`
- 默认值： 根据当前项目目录结构动态结算出的默认入口对象。

对于大部分场景，Modern.js 根据目录结构自动生成的入口能满足大部分业务需求。具体可参考[入口](/docs/guides/concept/entries)。

如需自定义构建入口时，可以通过该选项指定。

## String 类型

当值为 `string` 类型时，为入口的文件路径:

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    entries: {
      // 指定一个名称为 entry_customize 的新入口
      entry_customize: './src/home/test/index.js',
    },
  },
});
```

默认情况下，配置的入口等价于 `App.[jt]sx`，即指定的入口文件只需要导出应用的根组件。

例如以下目录结构：

```bash
.
├── src
│   └── entry
│       ├── chat.tsx
│       └── home.tsx
└── package.json
```

结合上面默认入口机制的内容，Modern.js 在分析上述目录结构时，不会得到任何默认入口。

在不想改变目录结构的情况下（如项目迁移），可以通过 `source.entries` 自定义入口：

```ts title="modern.config.js"
export default defineConfig({
  source: {
    entries: {
      home: './src/entry/home.tsx',
      chat: './src/entry/chat.tsx',
    },
  },
});
```

## Object 类型

当值为 `Object` 时，可配置如下属性：

- `entry`：`string`，入口文件路径。
- `disableMount`：`boolean = false`，关闭 Modern.js 生成入口代码的行为。

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    entries: {
      entry_customize: {
        // 入口文件路径
        entry: './src/home/test/App.jsx',
      },
      // 启用约定式路由
      entry_spa: {
        // 约定式路由的入口路径必须设置为目录
        entry: './src/about',
      },
    },
  },
});
```

默认情况下，配置的入口等价于 `App.[jt]sx`，如果希望该入口等价于构建模式下的入口，可以将属性 `disableMount` 设置为 `true`。

## 自定义入口和默认入口合并

在指定 `source.entries` 后，Modern.js 会将用户自定义的入口与分析目录结构得到的默认入口合并。合并规则为：

比较自定义入口设置的入口路径和默认入口路径，当入口路径一致时，自定义入口会覆盖默认入口。

例如以下目录结构:

```
.
├── src
│   ├── chat
│   │   └── App.jsx
│   └── home
│       └── index.js
└── package.json
```

Modern.js 分析 `src/` 目录，得到默认入口 `chat` 和 `home`。当用户在 `modern.config.js` 文件中配置如下时：

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    entries: {
      index: './src/home/index.js',
    },
  },
};
```

可以看到自定义入口 `index` 的路径和默认入口 `home` 的路径一致，在合并的过程中，`index` 会覆盖掉 `home`，最终入口如下：

- `chat -> ./src/chat/App.jsx`
- `index -> ./src/home/index.js`
