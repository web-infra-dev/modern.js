---
sidebar_position: 1
---

# 总览

欢迎来到 Modern.js 博客频道！

在这里，你可以了解到 Modern.js 的最新进展和技术分享。

## AIGC 如何影响下一代文档搜索方案？

> 发表于 2023.05.11

对于一个文档站点来说，搜索是一个很重要的功能，它可以帮助用户在繁杂的文档中快速找到自己想要的内容。而随着 AIGC(人工智能生成内容)技术的发展，文档搜索领域也正在悄然发生变化。借助 AI 强大的自然语言处理能力和上下文理解能力，我们可以把文档搜索做得更加智能化。本文将会介绍 AIGC 在文档中应用的技术原理，并分析一些业界已有的 AI 搜索产品。

[了解更多 →](https://mp.weixin.qq.com/s/OGuixAbvbIYr2viQrOrPXg)

## Modern.js v2 发布：支持 Rspack 构建

> 发表于 2023.03.16

大家好，很高兴地向大家宣布，Modern.js v2 版本已经正式发布了！

Modern.js 是字节跳动 Web Infra 团队开源的一套 Web 工程体系。在开源以来的一年多时间里，Modern.js 保持稳定的迭代节奏，数十位贡献者参与了开发，累计提交 2000+ 个 Pull Request，并支持了 Rspack 构建、嵌套路由、流式渲染等新特性。

在这篇文章里，我们会和大家一起聊一聊 Modern.js 在过去一年多时间里的变化。

[了解更多 →](/community/blog/v2-release-note)

## React Streaming SSR 原理解析

> 发表于 2022.12.16

React 18 提供了一种新的 SSR 渲染模式： Streaming SSR。通过 Streaming SSR，我们可以实现以下两个功能：

- Streaming HTML：服务端可以分段传输 HTML 到浏览器，而不是像 React 18 以前一样，需要等待服务端渲染完成整个页面后才返回给浏览器。这样，浏览器可以更快的启动 HTML 的渲染，提高 FP、FCP 等性能指标。
- Selective Hydration：在浏览器端 hydration 阶段，可以只对已经完成渲染的区域做 hydration，而不需要等待整个页面渲染完成、所有组件的 JS bundle 加载完成，才能开始 hydration。这样可以更早的对已经完成渲染的区域做事件绑定，从而让页面获得更好的可交互性。

[了解更多 →](https://mp.weixin.qq.com/s/w4FS5sBcHqRl-Saqi19Y6g)

## React Server Component 介绍

> 发表于 2022.12.01

React 官方对 Server Component 是这样介绍的: **zero-bundle-size React Server Components**。

这是一种实验性探索，但相信该探索是个未来 React 发展的方向，与 React Server Component 相关的周边生态正在积极的建设当中。

[了解更多 →](https://mp.weixin.qq.com/s/B-XLvW00vl5RE1Ur3EW4ow)

## 2022 年 9 ~ 10 月更新内容

> 发表于 2022.11.01

Modern.js 9 ~ 10 月的最新版本为 v1.21.0，本双月的主要更新有：

- **支持 pnpm v7**：完成框架对 pnpm v7 的支持。
- **服务端增加 Typescript 作为 ts 文件编译器**。

[了解更多 →](/community/blog/2022-0910-updates)

## 2022 年 7 ~ 8 月更新内容

> 发表于 2022.09.05

Modern.js 7 ~ 8 月的最新版本为 v1.17.0，本双月的主要更新有：

- **支持 React 18**：完成框架和插件对 React 18 的适配。
- **包版本统一**：Modern.js 所有组成包的版本号进行统一，提供升级命令。
- **Modern.js Module 支持 bundle 构建**：Modern.js Module 项目，支持对产物做 bundle 构建。
- **Reduck v1.1**：发布 [Reduck v1.1](https://github.com/web-infra-dev/reduck)，使用文档全面更新。

[了解更多 →](/community/blog/2022-0708-updates)
