# 通用类问题

### Modern.js Builder 和 Modern.js 的关系？

Modern.js 的构建能力是基于 Modern.js Builder 实现的。

在开发 Modern.js 的过程中，我们把 Builder 作为独立的模块进行设计，并明确划分 Builder 与 Modern.js 的职责界限。
因此，Builder 可以脱离 Modern.js 框架使用，被单独应用于其他框架或场景。

---

### Builder 能否用于构建工具库或组件库？

Builder 专注于解决 Web 应用构建场景，我们不推荐你使用 Builder 来构建工具库或组件库。

如果需要构建工具库或组件库，推荐使用 [Modern.js Module 解决方案](https://modernjs.dev/module-tools)。

---

### Builder 是否会接入 Turbopack？

Builder 已经在对接 Rspack，并且目前 Turbopack 仅支持在 Next.js 中使用，因此 Builder 暂时没有接入 [Turbopack](https://turbo.build/pack) 的计划。

> 你可以在 Rspack 的 [介绍](https://www.rspack.dev/zh/guide/introduction.html) 中查看 Rspack 与 Turbopack 的对比。

---

### Builder 是否会接入 Vite？

[Vite](https://vitejs.dev/) 是一个非常优秀的工具，但 Builder 的目标是使用 Rspack 替换 webpack，Rspack 能提供极致的编译速度，同时能保持开发环境和生产环境的打包行为一致。

Builder 会聚焦于从 webpack 演进至 Rspack 的过程，因此不会接入 Vite。

> 你可以在 Rspack 的 [介绍](https://www.rspack.dev/zh/guide/introduction.html) 中查看 Rspack 与 Vite 的对比。
