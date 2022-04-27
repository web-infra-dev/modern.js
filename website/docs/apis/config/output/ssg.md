---
sidebar_label: ssg
---
# output.ssg

:::info 适用的工程方案
* MWA
:::

* 类型： `boolean` | `object` | `function`
* 默认值： `undefined`

开启**自控式路由**或**约定式路由** SSG 功能的配置。

:::info 客户端路由
相关内容可以查看[自控式路由](/docs/guides/tutorials/c08-client-side-routing/8.1-code-based-routing)或[约定式路由](/docs/guides/tutorials/c08-client-side-routing/8.2-file-based-routing)。
:::

## 示例

### 单入口

当该配置设置为 `true` 时，将会默认开启所有入口的 SSG 功能。

对**自控式路由**而言，将会渲染入口路由。对**约定式路由**而言，将会渲染入口中每一条客户端路由。

例如 `src/` 目录下有以下满足**约定式路由**的文件结构：

```bash
.
├── pages/
│   ├── user/
│   │   └── info.tsx
│   ├── home.tsx
│   └── index.tsx
├── .eslintrc.json
```

在 `modern.js.config` 中做以下设置：

```js
module.exports = {
  output: {
    ssg: true,
  },
};
```

执行 `pnpm build` 构建应用后。`dist/` 目录将会生成三张 HTML 分别对应三条路由（不开启 SSG 时只有一张 HTML 对应主入口），并且可以看到所有 HTML 都已经是渲染之后的。

而例如下面的**自控式路由**：

```ts title="App.tsx"
import { Switch, Route } from '@modern-js/runtime/router';

export default () => (
  <Switch>
    <Route path="/" exact={true}>
      <div>Home</div>
    </Route>
    <Route path="/foo" exact={true}>
      <div>Foo</div>
    </Route>
  </Switch>
);
```

同样使用上面的配置，在执行 `pnpm build` 后，只有入口路由 `/` 会生成渲染后的 HTML。

### 多入口

`output.ssg` 也可以按照入口配置，配置生效的规则同样由入口路由方式决定。

例如以下目录结构：

```bash
.
├── src/
│   ├── contacts/
│   │   └── App.tsx
│   ├── landing-page/
│   │   └── pages/
│   │       ├── [user].tsx
│   │       ├── docs.tsx
│   │       └── index.tsx
```

默认情况下，所有约定式路由的入口，在设置 `output.ssg` 配置后都会在构建阶段渲染，可以配置 `false` 来取消指定入口的的默认行为，例如取消上述 landing-page 入口在构建时的渲染：

```js
module.exports = {
  output: {
    ssg: {
      contacts: true,
      'landing-page': false,
    },
  },
};
```

### 配置路由

上述内容中提到，**自控式路由**默认只会开启入口路由的 SSG 配置。

可以在 `output.ssg` 中设置具体的路由，告知 Modern.js 开启这些客户端路由的 SSG 功能。例如上述 `contacts/App.tsx` 的文件内容为：

```ts title="contacts/App.tsx"
import { Switch, Route } from '@modern-js/runtime/router';

export default () => (
  <Switch>
    <Route path="/" exact={true}>
      <div>Home</div>
    </Route>
    <Route path="/foo" exact={true}>
      <div>Foo</div>
    </Route>
  </Switch>
);
```

在 `modern.config.js` 中这样设置后，`/foo` 路由也会开启 SSG 功能：

```js
module.exports = {
  output: {
    ssg: {
      contacts: {
        routes: ['/', '/foo'],
      },
    },
  },
};
```

Modern.js 将会自动根据入口拼接完整的 URL 并交给 SSG 插件完成渲染。

也可以为具体入口或路由配置请求头，例如：

```js
module.exports = {
  output: {
    ssg: {
      contacts: {
        headers: {},
        routes: [
          '/',
          {
            url: '/foo',
            headers: {},
          },
        ],
      },
    },
  },
};
```

:::info
路由中设置的 `headers` 会覆盖入口中设置的 `headers`。
:::

### 阻止默认行为

**约定式路由**也可以通过配置的方式来开启指定路由的 SSG。

但因为默认行为的不同，这里为**约定式路由**提供了另一个字段，用来阻止默认的 SSG 行为。

例如以下目录结构，除了 `/docs4` 外的所有 landing-page 入口中的路由都开启 SSG：

```bash
.
├── src/
│   ├── contacts/
│   │   └── App.tsx
│   ├── landing-page/
│   │   └── pages/
│   │       ├── [user].tsx
│   │       ├── docs.tsx
│   │       ├── docs1.tsx
│   │       ├── docs2.tsx
│   │       ├── docs3.tsx
│   │       ├── docs4.tsx
│   │       └── index.tsx
```

可以这样设置，禁用某一条客户端路由的默认行为：

:::info 注
该配置仅在渲染动态路径的约定式路由时使用。
:::

```js
module.exports = {
  output: {
    'landing-page': {
      preventDefault: ['/docs4'],
    },
  },
};
```

### 添加动态路由参数

部分路由可能是动态的，例如自控式路由中的 `/user/:id` 或是约定式路由中 `user/[id].ts` 文件生成的路由。

可以在 `output.ssg` 中配置具体的参数，渲染指定参数的路由，例如：

```js
module.exports = {
  output: {
    ssg: {
      'landing-page': {
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
  },
};
```
