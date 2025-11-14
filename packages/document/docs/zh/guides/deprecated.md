---
sidebar_position: 10
---

# 已下线功能

本文将介绍 Modern.js 之前支持，但是现在已下线的功能及推荐替代方案。

## 使用 @modern-js/create 创建 Monorepo

Modern.js 之前提供的 Monorepo 方案是基于 [pnpm Workspace](https://pnpm.io/workspaces) 实现的，并未提供实质性的 Monorepo 管理能力。在 [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0) 版本中，移除了使用 `@modern-js/create` 创建 Monorepo 项目的功能。推荐直接使用社区提供的 Monorepo 方案。

## new 命令开启 test 能力

Modern.js 之前提供的测试能力是基于 Jest 的简单封装。该封装导致 Jest 配置不直观、用户配置更加复杂等问题。在 [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0) 版本中，移除了在应用项目和模块项目中开启 test 功能的选项。推荐直接使用社区提供的测试方案。

## Eslint 规则集

Modern.js 之前提供了 ESLint 的完整规则集，涵盖了 @modern-js（针对 Node.js 项目的 Lint 规则）和 @modern-js-app（针对前端项目的 Lint 规则）。在 [v2.60.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.60.0) 版本中，我们正式移除了这些规则集。我们鼓励开发者根据自身需求选择合适的代码规范工具，直接使用 ESLint 并结合社区推荐的规则，或使用 Biome 以提升代码格式化的性能。
