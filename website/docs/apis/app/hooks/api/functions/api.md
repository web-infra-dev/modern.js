---
title: api/**/*.[tj]s
sidebar_position: 1
---

声明 API 路由的文件，在 Modern.js 函数写法下；除了[某些约定文件](/docs/apis/hooks/mwa/api/functions/api)外，`api` 目录下的文件会被注册为接口的路由。

:::info 注
使用 `api` 目录需要开启 BFF 功能，需要在项目下执行 new 命令启用「BFF」功能。

该文件支持使用 `js` 或 `ts` 语言，但必须使用 `esm` 语法导出函数。
:::

## 该文件约定路由如下：

### 默认路由

路由系统会将以 `index` 命名的文件会被映射到上一层目录。

* `api/index.ts` -> `$BASENAME/`
* `api/user/index.ts` -> `$BASENAME/user`

### 嵌套路由

路由系统也支持解析嵌套的文件，如果创建嵌套文件夹结构，文件仍会以相同方式自动解析路由。

* `api/hello.ts` -> `$BASENAME/hello`
* `api/user/list.ts` -> `$BASENAME/user/list`

### 动态路由

同样的，你可以通过创建带有 `[xxx]` 的文件夹或者文件来支持动态的命名路由参数。

* `api/user/[username]/info.ts` -> `$BASENAME/user/:username/info`
* `api/user/[username]/delete.ts` -> `$BASENAME/user/:username/delete`
* `api/article/[id]/info.ts` -> `$BASENAME/article/:id/info`

其中的 `$BASENAME` 可以在 `modern.config.js` 中进行配置，默认值为 `/api`。

### 白名单

默认 `api` 目录下所有文件都会当作 BFF 函数文件去解析，但同样我们也设置了白名单，这些文件不被被解析：

* 命名以 `_` 开头的文件。例如：`_utils.ts`。
* 命名以 `_` 开头的文件夹下所有文件。例如：`_utils/index.ts`、`_utils/cp.ts`。
* 测试文件。例如：`foo.test.ts`。
* TypeScript 类型文件。例如：`hello.d.ts`。
* `node_module` 下的文件。


