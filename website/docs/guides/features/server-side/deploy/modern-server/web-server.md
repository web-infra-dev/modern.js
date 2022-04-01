---
sidebar_position: 1
---

# Web Server 简述

Modern.js 为应用提供了内置的 Web 服务器，无论是在本地开发环境中执行 `dev` 命令，或是执行 `build && start` 命令，在任何环境中等价的正式运行，都直接使用了 Modern.js 内置的 Web 服务器。

内置的 Web 服务器已经是**完整的产品级服务器**。它不仅包含产物热更新、本地 Mock 数据、代理服务器等开发阶段需要的能力；也提供了自动路由寻址、静态资源托管、SSR/SPR 等功能。

:::info 注
静态资源文件能够直接被 Modern.js 的服务器托管，但在生产环境中，强烈推荐将这些内容上传到 CDN。
:::

在生产环境中，简单的执行 Modern.js 提供的 `start` 命令，就可以保证应用正常启动与运行。因此，在任意拥有指定 Node 环境的容器中，都可以通过这种方式来运行 Modern.js 应用。

本章节后续的部署方式，都通过这个 Web 服务器来运行服务。

:::info 补充信息
更多 Web Server 相关内容可以查看【[一体化 Web](/docs/guides/features/server-side/web/routes)】。
:::
