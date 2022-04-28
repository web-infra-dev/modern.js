---
sidebar_position: 2
title: 携带 Schema 的 BFF 函数
---

之前小节提到过 Modern.js 中的两种 BFF 函数定义，这一小节来着重了解一下 schema BFF 函数。

Modern.js 中内置了 [farrow-schema](https://github.com/farrow-js/farrow/tree/master/packages/farrow-schema) 的 Type Schema Builder，借用这些 Schema Builder 为 BFF 接口提供了强大的能力：

* 基本的接口参数数据校验。
* 基本的接口返回值数据校验。
* 支持生成完整 TypeScript 类型接口调用 SDK，以及更有针对性测试、更正确的自动 Mock 数据。
* 支持对各种数据类型的请求发送处理：`text/plain`、`application/json`、`multipart/form-data`、`application/x-www-form-urlencoded`。
* 支持通过 `multipart/form-data` 的形式上传文件。

## 简单示例

```ts
import { match } from '@modern-js/runtime/server';

export const post = match(
  {
    request: {
      data: {
        a: Number,
        b: Number,
      },
    },
    response: Number,
  },
  ({ data: { a, b } }) => {
    return a + b;
  },
);
```

## match

Modern.js 中提供了定义 schema BFF 函数的 `match` 函数，该函数支持通过 Type Schema Builder 描述 RESTful 风格的接口。

`match` 接收两个参数：`matcher` 和 `handler`。`matcher` 的作用是描述当前接口的形状，`matcher` 中有 4 个字段：

* `request`： 接口入参相关信息
* `response`：返回值类型
* `description`（可选）：接口描述文字
* `deprecated`（可选）：接口废弃状态与原因

其中的 `request` 较为复杂，它用来定义请求的一些必要信息，它有四个基础字段：

* `params`（可选）：动态路由的命名参数
* `query`（可选）：请求 URL 的 [search](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) 部分的序列化对象
* `headers`（可选）：请求携带的 [HTTP Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
* `cookies`（可选）：请求携带的 [HTTP Header](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies)

除了以上 4 个基础字段，还有支持描述 4 种类型数据，对应 4 个字段，使用时，这 4 字段需要 4 选 1：

* `data`
* `body`
* `formData`
* `formUrlencoded`

由于它们对应的数据类型不同，能力也不同，所以这里分开介绍。

### 基础的数据发送

这部分主要是 `data` 支持的 JSON 数据的发送、和 JSON 数据数据的自动校验，简单的写法如下：

```ts title="api/hello.ts"
import { match } form '@modern-js/runtime/server'

export const post = match(
  {
    request: {
      data: { name: String }
    },
    response: {
      message: String
    }
  },
  (request) => { // request: { data: { name: string } }
    return {
      message: `Hello ${request.data.name}!`
    }
  }
)
```

一体化调用：

```ts title=调用代码
import { post } from '../api/hello'

// res: { message: 'Hello Modern.js!' }
const res = await post({ data: { name: 'Modern.js' } })
```

在这个例子中，使用l了 Schema Builder 对 `data` 字段进行描述，在 `match` 第二个参数 `handler` 的入参中可以得到完善的 TypeScript 的类型推导，也让接口拥有了校验参数的能力。

### 特殊的数据发送

这部分主要是 `body`、`formData`、`formUrlencoded` 对应的 `text/plain`、`multipart/form-data`、`application/x-www-form-urlencoded` 的处理。

当在 `matcher` 中，没有对 `data` 字段使用 Schema Builder 描述，则调用时，就可以传这 3 个字段中的 1 个，示例如下：

```ts title="api/hello.ts"
import { match } from '@modern-js/runtime/server'

export const post = match(
    {
        request: {
            // without data
        },
        response: {
            message: String
        }
    },
    (request) => {
    // request: { body?: string, formData?: Record<string, any>, formUrlencoded?: Record<string, string> }
        return {
            message: `Hello!`
        }
    }
)
```

在调用的时候可以传递以下的数据：

* `text/plain`

```ts
import { post } from '@api/hello'

const res = await post({ body: 'Hello' })
```

* `multipart/form-data`

```ts
import { post } from '../api/hello'

const formData = new FormData()

formData.append('test', 'foo')
const res = await post({ formData })

// 上传文件
const input = document.querySelector('input[type="file"]')
formData.append('file', input.files[0])
const res = await post({ formData })
```

* `application/x-www-form-urlencoded`

```ts
import { post } from '../api/hello'

// string: xxx=xxx
const res = await post({ formUrlencoded: 'test=foo' })

// Record<string, string>
const res = await post({ formUrlencoded: { test: 'foo' } })

// URLSearchParams
const urlSearchParams = new URLSearchParams()
urlSearchParams.append('test', 'foo')
const res = await post({ formUrlencoded: urlSearchParams })
```

:::info 补充信息
需要注意的是，通过 `match` 定义的 BFF 函数的入参形式与普通的 BFF 函数是有所不同的。
:::

## Schema 校验规则

### 校验字段

在 `match` 函数的 `matcher` 参数中，有些字段是可以使用 Schema Builder 描述并提供了类型校验能力，而有些字段是拥有特定类型，不支持使用 Schema Builder 描述，当然也没有类型校验能力的。

* `request`
  * `params`：可使用 Schema Builder 描述
  * `query`：可使用 Schema Builder 描述
  * `headers`：可使用 Schema Builder 描述
  * `cookies`：可使用 Schema Builder 描述
  * `data`：可使用 Schema Builder 描述
  * `body`：`string`
  * `formData`：`FormData`
  * `formUrlencoded`： `URLSearchParams | Record<string, string> | string`
* `response`: 可使用 Schema Builder 描述
* `description`：`string`
* `deprecated`：`string`

### 校验失败的处理

校验失败主要分为两种：入参校验失败和返回值校验失败。当入参校验失败时，响应 code 为 400，`body` 中会携带校验失败响应的信息，而当返回值校验失败时，响应 code 为 500，`body` 中同样会携带校验失败响应的信息。

```ts
import { match } form '@modern-js/runtime/bff'

export const post = match(
    {
        request: {
            data: { name: String }
        },
        response: {
            message: String
        }
    },
    (request) => { // request: { data: { name: string } }
        return {
            message: `Hello ${request.data.name}!`
        }
    }
)
```

以上面的示例为例，当这里 `data` 中传递的不是 `{ name: string }` 时，比如是 `{ name: 0 }` 时，响应 code 为 400，`res.body` 是 `name is not string`。

当 BFF 函数返回的内容不是 `{ message: string }` 时，则响应 code 为 500, `res.body` 是 `message is not string`。

### Type Schema Builder

关于 Type Schema Builder 的用法与能力，可以查看 farrow 的相关文档： [farrow-schema](https://github.com/farrow-js/farrow/tree/master/packages/farrow-schema/README.md)。
