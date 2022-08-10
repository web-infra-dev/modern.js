---
title: config/mock/
sidebar_position: 5
---

应用工程方案本地调试 Mock 数据文件。

项目根目录下存在 `config/mock/index.js` 时，在本地开发调试环节自动启用快速 Mock 数据的功能。

:::caution 注意
为避免 Mock API 不生效， 请注意不要与配置 [tools.devServer.proxy](/docs/apis/config/tools/dev-server) 的 API 有冲突。
:::
