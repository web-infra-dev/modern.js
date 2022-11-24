---
title: lambda/*.[tj]s
sidebar_position: 1
---

Declaring API routing in BFF framework mode. Except [some files](/docs/apis/app/hooks/api/framework/lambda#allow-list)，files in `api/` are registered as routes.

:::info
use `api/` need execute new command to enable the 「BFF」 feature.
:::

:::tip
this file supports the use `js` or `ts`, but the functions must be exported using the ESM syntax.
:::

## Routing Rule

### Default Route

The files named `index` will be upper level routing:

* `api/lambda/index.ts` -> `$BASENAME/`
* `api/lambda/user/index.ts` -> `$BASENAME/user`

### Multi Level Route

The routing system also supports parsing multiple levels of files. and if you create a folder, the files will still be automatically parsed in the same way.

* `api/lambda/hello.ts` -> `$BASENAME/hello`
* `api/lambda/user/list.ts` -> `$BASENAME/user/list`

### Dynamic Route

Dynamic named routing parameters can be supported by creating folders or files with `[xxx]`.

* `api/lambda/user/[username]/info.ts` -> `$BASENAME/user/:username/info`
* `api/lambda/user/[username]/delete.ts` -> `$BASENAME/user/:username/delete`
* `api/lambda/article/[id]/info.ts` -> `$BASENAME/article/:id/info`

the `$BASENAME` can be configured in `modern.config.js`，the default value is `/api`。

### Allow List

By default, all files in the `api/` will be parsed as BFF function. but we also set a allow list, and these files will not be parsed:

* file name start with `_`, for example: `_utils.ts`.
* files in directory that name start with `_`, for example：`_utils/index.ts`、`_utils/cp.ts`.
* test files, for example：`foo.test.ts`.
* TypeScript define files, for example：`hello.d.ts`.
* files in `node_module`.

## Define Function

the same as [Define Function](/docs/apis/app/hooks/api/functions/api#define-function).
