---
title: 创建项目
---

从这一章节开始，我们将进入实战教程部分。在实战教程中，我们将会从环境准备开始，从简单到复杂，一步一步搭建一个真实的项目。

## 环境准备

import Prerequisites from '@site-docs/components/prerequisites.md'

<Prerequisites />

## 初始化项目

我们创建新的目录，通过命令行工具初始化项目：

```bash
mkdir myapp && cd myapp
npx @modern-js/create
```

import InitApp from '@site-docs/components/init-app.md'

<InitApp />

## 调试项目

import DebugApp from '@site-docs/components/debug-app.md'

<DebugApp />

## 修改代码

我们将原本的示例代码删除，替换成一个简单的联系人列表：

```tsx title="src/routes/page.tsx"
const getAvatar = (users: Array<{ name: string; email: string }>) =>
  users.map(user => ({
    ...user,
    avatar: `https://avatars.dicebear.com/v2/identicon/${user.name}.svg`,
  }));

const mockData = getAvatar([
  { name: 'Thomas', email: 'w.kccip@bllmfbgv.dm' },
  { name: 'Chow', email: 'f.lfqljnlk@ywoefljhc.af' },
  { name: 'Bradley', email: 'd.wfovsqyo@gpkcjwjgb.fr' },
  { name: 'Davis', email: '"t.kqkoj@utlkwnpwk.nu' },
]);

function App() {
  return (
    <ul>
      {mockData.map(({ name, avatar, email }) => (
        <li key={name}>
          <img src={avatar} width={60} height={60} /> ---
          <span>{name}</span> ---
          <span>{email}</span>
        </li>
      ))}
    </ul>
  );
}

export default App;
```

删除多余的 css 文件，保持目录没有多余的文件：

```bash
rm src/routes/index.css
```

因为框架默认支持 [HMR](https://webpack.js.org/concepts/hot-module-replacement/)，可以看到 `http://localhost:8080/` 里的内容会自动更新为：

![result](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvt/ljhwZthlaukjlkulzlp/screenshot-20221214-141909.png)

此刻的页面还没有样式。下一章节将展开这部分的内容。

## 开启 SSR

接下来，我们修改项目中的 `modern.config.ts`，开启 SSR 能力：

```ts
import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  server: {
    ssr: true,
  },
  plugins: [AppToolsPlugin()],
});
```

重新执行 `pnpm run dev`，可以发现项目已经在服务端完成了页面渲染。
