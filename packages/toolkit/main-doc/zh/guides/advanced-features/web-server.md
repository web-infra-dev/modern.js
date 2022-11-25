---
title: 扩展 Web Server
sidebar_position: 2
---

有些开发场景下，需要定制特殊的服务端逻辑，例如用户鉴权、请求预处理、添加页面渲染骨架等，这时，可以通过对 Modern.js 内置的 Web Server 进行扩展实现相应需求。

## 创建定制 Web Server


在项目根目录执行 `pnpm run new` 命令，按照如下选择，开启「Server 自定义」功能：


```bash
? 请选择你想要的操作： 创建工程元素
? 创建工程元素： 新建「Server 自定义」源码目录
```

执行命令后，项目目录下会新建 `server/index.ts` 文件，自定义逻辑在这个文件中编写。
