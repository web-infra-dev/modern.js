# 欢迎使用

Module Tools 是 Modern.js/EdenX 的模块工程解决方案，同时也是核心依赖。它可以让开发者更轻松地构建、调试、发布模块类型的项目。模块类型的项目大多数情况可以认为是 npm 包类型的项目，它可能是一个组件、组件库或者工具库项目。

如果你正打算开发一个 npm 包类型的项目，那么你就来对地方了！Modern.js/EdenX 提供了专业的模块工程解决方案。它带来了：

- **简单的项目初始化**：仅需执行 `npx @modern-js/create project-dir` 命令，然后进行几个交互问题，就可以创建一个完整的模块类型项目。创建的项目还支持选择 [**pnpm**](https://pnpm.io/)、[**Yarn**](https://classic.yarnpkg.com/) 两种包管理器。
- **代码格式化**：在模块工程项目中，你可以执行 `modern lint` 来对代码进行格式化。同时初始化的模块工程项目里包含了 Modern.js/EdenX 的 [ESLint](https://eslint.org/docs/latest/user-guide/core-concepts#what-is-eslint) 规则集，可以满足大部分场景下的需求。
- **全面的构建能力和更快的构建速度**：Module Tools 基于 [esbuild](https://esbuild.github.io/getting-started/) 和 [SWC](https://swc.rs/) 提供了高性能的构建能力，并且为不同构建模块的场景提供了丰富的配置。
- **Storybook 调试工具**：Module Tools 为调试模块项目提供了 [Storybook](https://storybook.js.org/) 调试工具。在安装了 Module Tools 的 Storybook 插件后，你可以使用 `modern dev storybook` 命令来启动它。你不仅可以使用 Storybook 对组件进行调试，也可以使用在其他类型的模块上。
- **集成 Jest 的测试能力**：在需要对模块测试的时候，可以使用 Module Tools 的 `modern test` 命令。Module Tools 不仅集成了 [Jest](https://jestjs.io/)，同时也提供了配置 [Jest](https://jestjs.io/docs/configuration) 的 API。
- **基于 Changesets 实现的版本管理**：当需要对项目记录变更内容的时候，可以使用 `modern change` 命令生成包含变更内容的 Markdown 文件；当需要对项目进行版本升级的时候，可以使用 `modern bump` 命令通过 Markdown 文件分析并升级版本；当需要发布项目的时候，可以使用 `modern release` 命令对项目进行发布。Module Tools 基于 [Changesets](https://github.com/changesets/changesets) 实现了这些命令。
- **可扩展性的插件机制**：想要为项目集成其他的调试工具？又或者是想要在构建过程中做一些额外处理？Module Tools 提供了插件机制和插件钩子，插件钩子覆盖了 `dev` 命令和 `build` 命令两个流程。你可以通过它们为项目进行能力的扩展。
- **还有更多**：Module Tools 在未来还会不断的在构建、调试功能上进行优化。如果在模块项目构建上存在需要解决的重要问题，又或者是某个主流的模块项目调试工具、模式出现的时候，那么它们很可能成为 Module Tools 将要支持功能。
