---
title: api/lambda/*.[tj]s
sidebar_position: 1
---

声明 API 路由的文件，在 Modern.js 函数写法下；除了[某些约定文件](/docs/apis/hooks/mwa/api/framework/lambda#白名单)外，`api` 目录下的文件会被注册为接口的路由。

:::info 注
使用 `api` 目录需要开启 BFF 功能，需要在项目下执行 new 命令启用「BFF」功能。

该文件支持使用 `js` 或 `ts` 语言，但必须使用 `esm` 语法导出函数。
:::

## 路由规则

### 默认路由

路由系统会将以 `index` 命名的文件会被映射到上一层目录。

* `api/lambda/index.ts` -> `$BASENAME/`
* `api/lambda/user/index.ts` -> `$BASENAME/user`

### 嵌套路由

路由系统也支持解析嵌套的文件，如果创建嵌套文件夹结构，文件仍会以相同方式自动解析路由。

* `api/lambda/hello.ts` -> `$BASENAME/hello`
* `api/lambda/user/list.ts` -> `$BASENAME/user/list`

### 动态路由

同样的，你可以通过创建带有 `[xxx]` 的文件夹或者文件来支持动态的命名路由参数。

* `api/lambda/user/[username]/info.ts` -> `$BASENAME/user/:username/info`
* `api/lambda/user/[username]/delete.ts` -> `$BASENAME/user/:username/delete`
* `api/lambda/article/[id]/info.ts` -> `$BASENAME/article/:id/info`

其中的 `$BASENAME` 可以在 `modern.config.js` 中进行配置，默认值为 `/api`。

### 白名单

默认 `api` 目录下所有文件都会当作 BFF 函数文件去解析，但同样我们也设置了白名单，这些文件不被被解析：

* 命名以 `_` 开头的文件。例如：`_utils.ts`。
* 命名以 `_` 开头的文件夹下所有文件。例如：`_utils/index.ts`、`_utils/cp.ts`。
* 测试文件。例如：`foo.test.ts`。
* TypeScript 类型文件。例如：`hello.d.ts`。
* `node_module` 下的文件。

## 函数定义

除了上面的路由规则之外，代码中函数定义与导出也有相应的约定。

* 首先命名导出时，导出函数的名字为对应接口接受的 HTTP Method。

即：

```ts
export const get = async () => {
  return {
    name: 'Modern.js',
    desc: '现代 web 工程方案',
  };
};
```

这样导出函数，则会得到一个 `POST` 接口。

MWA 中支持了 9 个 Method 定义，即：`GET`、`POST`、`PUT`、`DELETE`、`CONNECT`、`TRACE`、`PATCH`、`OPTION`、`HEAD`，即可以用这些 Method 作为函数导出的名字。

名字是大小不敏感的，就是说，如果是 `GET`，写成 `get`、`Get`、`GEt`、`GET`，都可以准确识别。而默认导出，即 `export default xxx` 则会被映射为 `Get`。

因为 `delete` 是 `javascript` 中的关键字，可以使用 `del` 或者 `DELETE` 代替。

可以在一个文件中定义多个不同 Method 的函数，但如果定义多个相同 Method 的函数，则只有第一个会生效。

:::info 注
需要注意的是，定义的函数都应该是异步的，这个与函数调用时类型有关，这个后面会提到。
:::
