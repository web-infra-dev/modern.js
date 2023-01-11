---
title: 添加应用入口
---

上一个章节中，我们基本完成了联系人列表应用的开发，介绍了 Modern.js 中部分功能的用法，以及推荐的最佳实践。

这一章节中，我们将介绍如何为应用添加新的入口。

## 新建入口

一个完整的项目可能需要多个入口，Modern.js 支持自动创建新入口，前面的章节中提到过，`pnpm run new` 可以启用可选功能。

我们也可以通过它来创建新的工程元素，在项目根目录下执行 `pnpm run new`：

```bash
? 请选择你想要的操作 创建工程元素
? 创建工程元素 新建「应用入口」
? 请填写入口名称 (entry) landing-page
```

创建完成，项目会变成这样：

```bash
.
├── README.md
├── modern.config.ts
├── node_modules
├── package.json
├── pnpm-lock.yaml
├── src
│   ├── modern-app-env.d.ts
│   ├── landing-page
│   │   └── routes
│   │       ├── index.css
│   │       ├── layout.tsx
│   │       └── page.tsx
│   └── myapp
│       ├── components
│       │   ├── Avatar
│       │   │   └── index.tsx
│       │   └── Item
│       │       └── index.tsx
│       ├── containers
│       │   └── Contacts.tsx
│       ├── models
│       │   └── contacts.ts
│       ├── routes
│       │   ├── archives
│       │   │   └── page.tsx
│       │   ├── layout.tsx
│       │   └── page.tsx
│       └── styles
│           └── utils.css
└── tsconfig.json
```

可以看到联系人列表应用的文件，都被自动重构到 `src/myapp/` 里。

同时新建了一个 `src/landing-page/`，里面同样有 `routes/*`（`pnpm run new` 命令只做了这些事，所以你也可以很容易的手动创建新入口或修改入口）

执行 `pnpm run dev`，显示：

![design](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c08-entries-myapp.png)

访问 `http://localhost:8080/`，可以像之前一样看到应用程序。

访问 `http://localhost:8080/landing-page`，可以看到刚创建的新入口 `landing-page` 的页面（Modern.js 自动生成的默认页面）。

Modern.js 框架的设计原则之一是【[约定优于配置（Convention over Configuration）](https://en.wikipedia.org/wiki/Convention_over_configuration)】，多数情况下可以按约定直接写代码，不需要做任何配置，这里 `src/` 中的目录结构就是一种约定：

`src/myapp/` 和 `src/landing-page/` 被自动识别为两个应用入口：myapp 和 landing-page。

其中 `src/myapp/` 的目录名跟项目名（`package.json` 里的 `name`）一致，会被认为是项目**主入口**，项目 URL 的根路径（开发环境里默认是 `http://localhost:8080/`）会自动指向主入口。

其他入口的 URL，是在根路径后追加入口名，比如 `http://localhost:8080/landing-page`。

接下来，我们把 `src/myapp/` 重命名为 `src/contacts/`：

```bash
mv src/myapp src/contacts
```

再次执行 `pnpm run dev`，结果变成：

![design](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/tutorials/c08-entries-contacts.png)

现在不再有主入口，联系人列表现在是一个普通入口，需要用 `http://localhost:8080/contacts` 访问。

## 按入口修改配置

我们可以在 Modern.js 配置文件里，自己写代码来控制项目的配置。

现在，修改 `modern.config.ts` 里面添加内容：

```ts
import appTools, { defineConfig } from '@modern-js/app-tools';
import tailwindcssPlugin from '@modern-js/plugin-tailwindcss';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  server: {
    ssr: true,
    ssrByEntries: {
      'landing-page': false,
    },
  },
  plugins: [appTools(), tailwindcssPlugin()],
});
```

执行 `pnpm run dev`，再用浏览器打开 `view-source:http://localhost:8080/landing-page`，可以看到 `landing-page` 网页内容是通过 js 动态加载的，且此页面的 SSR 功能被关闭。

如果注释掉 `ssrByEntries` 和它的值，landing-page 的 SSR 功能就恢复开启了。

还有一些时候，需要一些更复杂的逻辑来做设置，比如需要 JS 变量、表达式、导入模块等，例如在只在开发环境里开启 SSR：

```js
export default defineConfig({
  server: {
    ssrByEntries: {
      'landing-page': process.env.NODE_ENV !== 'production',
    },
  },
};
```

到底为止，我们的联系人列表应用的雏形就基本完成了 👏👏👏。

## 下一步

接下来你可以通过了解[指南](/docs/guides/get-started/quick-start)、[配置](/docs/configure/app/usage) 等更多教程，进一步完善你的应用。
