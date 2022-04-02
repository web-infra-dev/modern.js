---
sidebar_position: 1
title: BFF 函数
---

在[一体化 Web 专题](/docs/guides/features/server-side/web/routes)中，介绍过 Modern.js 的 Serverless Web Development 开发方式，包括自动化路由、内置 Web Server、一体化 SSG/SSR/SPR 等。其中的 SSR 技术，可以称作 Serverless SSR，实现了 SSR 在开发、运行、部署全流程中的 Serverless。

这一专题中会详细介绍另一部分：Serverless BFF。跟 SSR 一样，能实现 BFF（Backends for Frontends）在开发、运行、部署全流程中的 Serverless。

在**前后端分离**概念出现后一段时间发展中，前端部分能够做的事越来越多，前端需要一些面向 UI 的数据接口，因此业界引入了 BFF 这一概念。

它主要为了解决的问题包括：

* 根据自身业务需求，对更底层 API 的聚合、映射、裁剪、代理。
* 对一些特定场景的数据进行缓存，提高性能，进而提升用户体验。
* 根据已有接口快速开发新产品。
* 与第三方系统对接，例如登陆鉴权。

Modern.js 提供了**一体化 BFF 方案**来进一步强化 BFF 能力，主要包括以下能力：

* 快速开发调试上线，在同一项目中运行、构建、部署 BFF 代码。
* 极简的纯函数调用，在前端直接 import BFF 函数，调用时能自动转换成 HTTP 请求。
* 无私有协议，遵循 RESTful API 规范，所有 BFF 接口都是标准化的。
* 完善的 TypeScript 支持。
* 满足用户使用偏好，支持多框架扩展写法。
* 接口调用安全，提供 schema 的接口定义方式。

## 一体化调用

Modern.js 允许可以在 `src` 目录下的 React 组件中直接引入并调用在 `api` 目录下定义好函数。

[开启 BFF 功能](/docs/guides/tutorials/c09-bff/9.2-enable-bff)之后，创建 `api/hello.ts` 文件，这里定义一个最简单的 BFF 函数：

```ts title="api/hello.ts"
export const get = async () => 'Hello Modern.js';
```

接着在 `src` 下的 `App.tsx` 中直接 import 函数调用：

```tsx title=src/App.tsx
import { useState, useEffect } from 'react';
import { get as hello } from '@api/hello';

export default () => {
  const [text, setText] = useState('');

  useEffect(() => {
    hello().then(setText);
  }, []);
  return <div>{text}</div>;
};
```

:::info 注
Modern.js 生成器已经在 `tsconfig.json` 中配置 `@api` 别名，因此可以直接通过别名的方式引入函数。
:::

在 `src/App.tsx` 中引入的函数，会自动转换成接口调用，不需要再去通过 fetch 去调用接口。

执行 `pnpm run dev` 打开 <http://localhost:8080/> 可以看到页面已经展示了 BFF 函数返回的内容，在Network，可以看到页面向 <http://localhost:8080/api/hello> 发送了请求：

![Network](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/hello-modern.png)

## 函数路由

Modern.js 中，BFF 函数对应的路由系统是基于文件系统实现的，也是一种**约定式路由**。

函数模式下 `api` 下的所有文件中的每个 BFF 函数都会映射为一个接口，框架模式下 `api/lambda` 下的所有文件中的每个 BFF 函数都会映射为一个接口。

以下的 `$BASENAME` 指的是 BFF 函数的[路由前缀](/docs/apis/config/bff/prefix)，可以在 `modern.config.js` 中进行配置，默认值为 `/api`。

:::info 注
你可以通过 [prefix](/docs/apis/config/bff/prefix) 设置公共路由的前缀。
:::

### 默认路由

以 `index.[jt]s` 命名的文件会被映射到上一层目录。

* `api/index.ts` -> `$BASENAME/`
* `api/user/index.ts` -> `$BASENAME/user`

### 嵌套路由

支持解析嵌套的文件，如果创建嵌套文件夹结构，文件仍会以相同方式自动解析路由。

* `api/hello.ts` -> `$BASENAME/hello`
* `api/user/list.ts` -> `$BASENAME/user/list`

### 动态路由

同样的，你可以通过创建命名带有 `[xxx]` 的文件夹或者文件来支持动态的命名路由参数。

* `api/user/[username]/info.ts` -> `$BASENAME/user/:username/info`
* `api/user/username/[action].ts` -> `$BASENAME/user/username/:action`

### 白名单

默认 `api/` 目录下所有文件都会当作 BFF 函数文件去解析，但以下文件不会被解析：

* 命名以 `_` 开头的文件。例如：`_utils.ts`。
* 命名以 `_` 开头的文件夹下所有文件。例如：`_utils/index.ts`、`_utils/cp.ts`。
* 测试文件。例如：`foo.test.ts`。
* TypeScript 类型文件。例如：`hello.d.ts`。
* `node_module` 下的文件。

## RESTful API

Modern.js 的 BFF 函数需要遵循 RESTful API 标准来定义, 遵循 HTTP Method 规范，并且不允许自由定义参数。

:::info 注
假设函数允许自由定义参数，产出的路由必然由**私有协议**进行调用（原因是无法区分请求参数与请求体），而无法实现任意的 RESTful API。

如果服务仅用于应用本身不存在问题，但它**不标准的接口定义**无法融入更大的体系。 在多个系统共同工作的情况下（例如 BFF 低码搭建），会导致其他系统也需要遵循**私有协议**。
:::

### 函数具名导出

Modern.js BFF 函数的导出名决定了函数对应接口的 Method，如`get`，`post`等。

例如，按照以下例子，可导出一个 GET 接口。

```ts
export const get = async () => {
  return {
    name: 'Modern.js',
    desc: '现代 web 工程方案',
  };
};
```

按照以下例子，则可导出一个 `POST` 接口

```ts
export const post = async () => {
  return {
    name: 'Modern.js',
    desc: '现代 web 工程方案',
  };
};
```

* MWA 中支持了 9 种 Method 定义，即：`GET`、`POST`、`PUT`、`DELETE`、`CONNECT`、`TRACE`、`PATCH`、`OPTION`、`HEAD`，即可以用这些 Method 作为函数导出的名字。

* 名字是大小不敏感的，就是说，如果是 `GET`，写成 `get`、`Get`、`GEt`、`GET`，都可以准确识别。而默认导出，即 `export default xxx` 则会被映射为 `Get`。

* 可以在一个文件中定义多个不同 Method 的函数，但如果定义多个相同 Method 的函数，则只有第一个会生效。

:::info 注
需要注意的是，定义的函数都应该是异步的，与函数调用时类型有关，后面会提到。
:::

### 函数参数规则

如上所述，为了满足 RESTful API 的设计标准，因此 Modern.js 中 BFF 函数需要遵循一定的入参规则。

Modern.js 函数定义分为普通函数与带有 schema 的函数，这一小节先介绍普通函数。

普通函数参数分为两块，分别是请求路径中的动态部分和请求选项 `RequestOption`。

#### Dynamic Path

动态路由会作为函数第一部分的入参，每个入参对应一段动态路由。例如以下示例，uid 会作为前两个参数传递到函数中：

```ts title="api/[level]/[id].ts"
export default async (level: number, id: number) => {
  const userData = await queryUser(level, uid);
  return userData
}
```

在调用时直接传入动态参数：

```ts title="App.tsx"
import { useState, useEffect } from 'react'
import { get as getUser } from '@api/[level]/[id]'

export default () => {
  const [name, setName] = useState('')

  useEffect(() => {
    getUser(6, 001).then(
      userData => setName(userData.name)
    )
  }, [])

  return <div>{name}</div>
}
```

#### RequestOption

Dynamic Path 之后的参数是包含 querystring、request body 的对象 `RequestOption`，这个字段用来定义 `data` 和 `query` 的类型。

在不存在动态路由的普通函数中，可以从第一个入参中获取传入的 `data` 和 `query`，例如：

```ts title="api/hello.ts"
import type { RequestOption } from '@modern-js/runtime/server'

export async function post(
  { query, data }: RequestOption<Record<string, string>, Record<string, string>>
) {
  // do somethings
}
```

当函数文件使用动态路由规则时，动态路由会在 `RequestOption` 对象参数前。

```ts title="api/[sku]/[id]/item.ts"
export async function post(
  sku: string,
  id: string,
  { data, query }: RequestOption<Record<string, string>, Record<string, string>>
) {
  // do somethings
}
```

调用时也按照函数定义，传入对应的参数即可：

```ts title="App.tsx"
import { post } from '@api/[sku]/[id]/item'

export default () => {
  const addSku = () => {
    post('0001'/* sku */, '1234' /* id */, {
      query: { /* ... */ },
      data: { /* ... */ },
    })
  }

  return <div onClick={addSku}>添加 SKU</div>
}
```

之前提到，定义的函数都应该是异步的，是因为在前端调用时会自动转换成 HTTP 接口调用，所以为了保持类型定义与实际调用体验统一，需要在定义 BFF 函数时将它设置为异步。
