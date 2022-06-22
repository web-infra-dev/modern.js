---
sidebar_position: 2
title: 子应用调试
---

根据研发的不同阶段，我们将子应用调试分为如下两种方式：

1. 使用本地主应用调试。
2. 使用线上主应用调试。

## 使用本地主应用调试

项目初期，主应用未部署，可以使用本地分别启动主应用、子应用的方式进行调试。

### 主应用

#### 配置

```js title="modern.config.js"
export default defineConfig({
  runtime: {
    router: true,
    masterApp: {
      manifest: {
        modules: [
          {
            name: 'Dashboard',
            entry: 'http://localhost:8081',
          },
        ],
      },
    },
  },
});
```

假设本地的子应用的名字为 `DashBoard` 且启动服务的地址为 `http://localhost:8081`。配置 `runtime.masterApp.modules` 字段指定子应用的相关信息。

#### 加载子应用

使用 [useModuleApps](/docs/apis/runtime/app/use-module-apps) API 获取子应用组件，并加载子应用。

```tsx title=App.tsx
import { useModuleApps } from '@modern-js/plugin-garfish';

function App() {
  const { Dashboard } = useModuleApps();

  return (
    <div>
      Master APP
      <Route path="/dashboard">
        <Dashboard />
      </Route>
    </div>
  );
}
```

### 子应用

#### 配置

```js title="modern.config.js"
export default defineConfig({
  deploy: {
    microFrontend: true,
  },
});
```

当 `deploy.microFrontend` 字段配置为 true 的时候，Modern.js 将认为当前应用是一个微前端子应用，并将其编译为符合 Garfish 子应用规范的产物。

#### 子应用代码

子应用在代码层面和 MWA 是完全一致的。

```tsx title=src/App.tsx
function App() {
  return <div>dashboard</div>;
}
```

:::info 注
目前不支持在子应用中使用 BFF 功能。
:::

然后分别启动主应用和子应用（执行 `pnpm dev`），主应用访问 `8080` 端口，子应用访问 `8081` 端口。浏览器打开 `http://localhost:8080/dashboard` 就能看到加载了 `Dashboard` 子应用的效果了。

## 使用线上主应用调试

当主应用项目部署之后，Modern.js 提供了用线上主应用调试本地子应用的方式。

:::info 注
本小节所用线上地址均是虚构，只为演示方便。
:::

### 主应用

#### 配置

```js title="modern.config.js"
export default defineConfig({
  server: {
    enableMicroFrontendDebug: true,
  },
  runtime: {
    router: true,
    masterApp: {
      manifest: {
        modules: [
          {
            name: 'Dashboard',
            entry: 'http://modern-js.dev/dashboard',
          },
        ],
      },
    },
  },
});
```

:::info 注
`enableMicroFrontendDebug` 会在线上开启 微前端 Debug 模式，如担心安全隐患，可只在线上测试环境开启，线上正式环境关掉该配置。
:::

### 子应用

#### 配置

```js title="modern.config.js"
export default defineConfig({
  deploy: {
    microFrontend: true,
  },
});
```

本地启动子应用，其端口为 `8080`。

### Query 模式调试

访问主应用地址 `http://master.example.com/` 并在 URL 后加上 Query `?__debug__micro-frontend-debug-name=TableList&__debug__micro-frontend-debug-entry=http://localhost:8080`。

此时访问主应用后，服务端注入的子应用模块信息将被替换为我们 Query 里的信息。即 `TableList` 子应用 `entry` 为 `http://localhost:8080`。线上主应用切换到 `/tablelist` 路由后将会加载本地的子应用。

![query-debug](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/query-debug.png)

### Header 模式调试（推荐）

Query 调试时，当路透跳转的时候，Query 参数会丢失，reload 页面后，服务端返回的子应用信息里将不会注入本地的子应用信息。可以使用 Header 模式来调试，获取更稳定的调试开发体验。

#### 环境要求

[ModHeader](https://modheader.com/install) 是用于 Mock 浏览器请求/返回 Header 的浏览器插件。使用 ModHeader 支持的浏览器（Chrome、Firefox、Opera、Edge），并安装 ModHeader 插件。

#### 配置 Header

配置如下 Header:

- `x-micro-frontend-module-name TableList`
- `x-micro-frontend-module-entry http://localhost:8080`

访问主应用地址如下所示

![header-debug](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/header-debug.png)

可以看到此时服务端返回的 `TableList` 子应用信息是 Header 里面指定的本地域名 `http://localhost:8080`
