---
sidebar_label: ssg
---

# output.ssg

- 类型： `boolean` | `object` | `function`
- 默认值： `undefined`

开启**自控式路由**或**约定式路由** SSG 功能的配置。

:::info 客户端路由
相关内容可以查看[路由](/docs/guides/basic-features/routes)。
:::

## 示例

### 单入口

当该配置设置为 `true` 时，将会默认开启所有入口的 SSG 功能。

对**自控式路由**而言，将会渲染入口的根路由。对**约定式路由**而言，将会渲染入口中每一条路由。

例如 `src/` 目录下有以下满足**约定式路由**的文件结构：

```bash
.
├── src
│   └── routes
│       ├── layout.tsx
│       ├── page.tsx
│       └── user
│           ├── layout.tsx
│           ├── page.tsx
│           └── profile
│               └── page.tsx
```

在 `modern.config.js` 中做以下设置：

```js
export default defineConfig({
  output: {
    ssg: true,
  },
});
```

执行 `pnpm build` 构建应用后。`dist/` 目录将会生成三张 HTML 分别对应三条路由（不开启 SSG 时只有一张 HTML），并且所有 HTML 都已经渲染。

而例如下面的**自控式路由**：

import SelfRouteExample from '@site-docs/components/self-route-example.md';

<SelfRouteExample />

同样使用上面的配置，在执行 `pnpm run build` 后，只有入口路由 `/` 会生成渲染后的 HTML。

### 多入口

`output.ssg` 也可以按照入口配置，配置生效的规则同样由入口路由方式决定。

例如以下目录结构：

```bash
。
├── src
│   ├── entryA
│   │   └── routes
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── user
│   │           ├── layout.tsx
│   │           ├── page.tsx
│   │           └── profile
│   │               └── page.tsx
│   └── entryB
│       └── App.tsx
```

默认情况下，所有约定式路由的入口，在设置 `output.ssg` 配置为 `true` 后都会在构建阶段渲染。可以配置 `false` 来取消指定入口的的默认行为，例如取消上述 entryA 入口在构建时的渲染：

```js
export default defineConfig({
  output: {
    ssg: {
      entryA: true,
      entryB: false,
    },
  },
});
```

### 配置路由

上述内容中提到，**自控式路由**默认只会开启入口路由的 SSG 配置。

可以在 `output.ssg` 中设置具体的路由，告知 Modern.js 开启这些客户端路由的 SSG 功能。例如上述 `src/App.tsx` 的文件内容为：


<SelfRouteExample />

在 `modern.config.js` 中这样设置后，`/about` 路由也会开启 SSG 功能：

```js
export default defineConfig({
  output: {
    ssg: {
      routes: ['/', '/about'],
    },
  },
});
```

Modern.js 将会自动根据入口拼接完整的 URL 并交给 SSG 插件完成渲染。

也可以为具体入口或路由配置请求头，例如：

```js
export default defineConfig({
  output: {
    ssg: {
      headers: {},
      routes: [
        '/',
        {
          url: '/about',
          headers: {},
        },
      ],
    },
  },
});
```

:::info
路由中设置的 `headers` 会覆盖入口中设置的 `headers`。
:::

### 阻止默认行为

默认情况下，**约定式路由**的路由会全部开启 SSG。Modern.js 提供了另一个字段，用来阻止默认的 SSG 行为。

例如以下目录结构，`/`、`/user`、`/user/profle` 三条路由都开启 SSG：

```bash
.
├── src
│   └── routes
│       ├── layout.tsx
│       ├── page.tsx
│       └── user
│           ├── layout.tsx
│           ├── page.tsx
│           └── profile
│               └── page.tsx
```

可以这样设置，禁用某一条客户端路由的默认行为：

```js
export default defineConfig({
  output: {
    preventDefault: ['/user'],
  },
});
```

### 添加动态路由参数

部分路由可能是动态的，例如自控式路由中的 `/user/:id` 或是约定式路由中 `user/[id]/page.tsx` 文件生成的路由。

可以在 `output.ssg` 中配置具体的参数，渲染指定参数的路由，例如：

```js
export default defineConfig({
  output: {
    ssg: {
      routes: [
        {
          url: '/user/:id',
          params: [
            {
              id: 'modernjs',
            },
          ],
        },
      ],
    },
  },
});
```

动态路由和 SSG 的组合，在根据 CMS 系统数据变更，实时生成静态页面时非常有用。
