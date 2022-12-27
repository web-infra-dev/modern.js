---
sidebar_position: 1
title: 一体化调用
---

Modern.js 允许在 React 组件中直接调用 `api/` 目录下满足一定条件的函数，称为**一体化调用**。

:::note
使用一体化调用需要先开启 BFF 功能。
:::

## BFF 函数

允许通过一体化调用的函数，称为 **BFF 函数**。这里写一个最简单的 BFF 函数，创建 `api/hello.ts` 文件：

:::caution
如果是框架模式（有 `api/lambda` 目录），需要创建 `api/lambda/hello.ts`
:::

```ts title="api/hello.ts"
export const get = async () => 'Hello Modern.js';
```

接着在 `src/App.tsx` 中直接引入函数并调用：

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

执行 `pnpm run dev` 打开 `http://localhost:8080/` 可以看到页面已经展示了 BFF 函数返回的内容，在 Network 中可以看到页面向 `http://localhost:8080/api/hello` 发送了请求：

![Network](https://p6-piu.byteimg.com/tos-cn-i-8jisjyls3a/fd41750f8d414179a9b4ecb519919b36~tplv-8jisjyls3a-3:0:0:q75.png)

## 函数路由

Modern.js 中，BFF 函数对应的路由系统是基于文件系统实现的，也是一种**约定式路由**。

函数写法下 `api/` 下的所有文件中的每个 BFF 函数都会映射为一个接口。框架写法下 `api/lambda` 下的所有文件中的每个 BFF 函数都会映射为一个接口。

:::note
函数写法和框架写法会在下一节详细介绍。
:::

所有 BFF 函数生成的路由都带有统一的前缀，默认值为 `/api`。可以通过 [bff.prefix](/docs/configure/app/bff/prefix) 设置公共路由的前缀。

下面介绍几种路由的约定。

### 默认路由

以 `index.[jt]s` 命名的文件会被映射到上一层目录。

* `api/index.ts` -> `{prefix}/`
* `api/user/index.ts` -> `{prefix}/user`

### 多层路由

支持解析嵌套的文件，如果创建嵌套文件夹结构，文件仍会以相同方式自动解析路由。

* `api/hello.ts` -> `{prefix}/hello`
* `api/user/list.ts` -> `{prefix}/user/list`

### 动态路由

同样的，创建命名带有 `[xxx]` 的文件夹或者文件，支持动态的命名路由参数。动态路由的函数参数规则可以看 [dynamac-path](/docs/guides/advanced-features/bff/function#dynamic-path)

* `api/user/[username]/info.ts` -> `{prefix}/user/:username/info`
* `api/user/username/[action].ts` -> `{prefix}/user/username/:action`

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

Modern.js BFF 函数的导出名决定了函数对应接口的 Method，如 `get`，`post` 等。

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

* 对应 HTTP Method，Modern.js 也支持了 9 种定义，即：`GET`、`POST`、`PUT`、`DELETE`、`CONNECT`、`TRACE`、`PATCH`、`OPTION`、`HEAD`，即可以用这些 Method 作为函数导出的名字。

* 名字是大小不敏感的，如果是 `GET`，写成 `get`、`Get`、`GEt`、`GET`，都可以准确识别。而默认导出，即 `export default xxx` 则会被映射为 `Get`。

* 可以在一个文件中定义多个不同 Method 的函数，但如果定义多个相同 Method 的函数，则只有第一个会生效。

:::info 注
需要注意的是，定义的函数都应该是异步的，与函数调用时类型有关，后面会提到。
:::

### 函数参数规则

如上所述，为了满足 RESTful API 的设计标准，因此 Modern.js 中 BFF 函数需要遵循一定的入参规则。

函数参数分为两块，分别是请求路径中的动态部分和请求选项 `RequestOption`。

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

这里你也可以使用自定义类型：
```ts title="api/lambda/hello.ts"
import type { RequestOption } from '@modern-js/runtime/server'

type IQuery = {
  // some types
}
type IData = {
  // some types
}

export async function post(
  { query, data }: { query:IQuery, data:IData }
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
