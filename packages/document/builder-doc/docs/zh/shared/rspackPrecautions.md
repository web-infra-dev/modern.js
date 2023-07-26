## 注意事项

在使用 Rspack 之前，请留意 Rspack 仍然是一个早期项目，当前还处于快速迭代阶段。因此，你需要预先了解以下事项：

- Rspack 的 API 和配置项还不稳定，同时 Modern.js 对 Rspack 的支持属于实验性的，因此在后续的非 major 版本中，可能会引入不兼容更新。
- Rspack 并未实现完整的 webpack 优化能力（如 tree shaking、bundle splitting、scope hoist 等能力，我们将在 6 ～ 12 月持续补齐相关优化能力），迁移到 Rspack 后，你可能会发现产物的包体积相较 webpack 有一定程度的增加。
- Rspack 目前基于 SWC 进行代码编译和压缩，由于 SWC 的成熟度不及 babel 和 terser，因此你可能会遇到 SWC 的 bug。
- Rspack 模式兼容了大部分 webpack 生态的插件和 loaders，但仍有部分插件和 loaders 暂时无法使用。

Rspack 正在积极改善上述问题，并计划在未来的版本中逐步解决它们。我们建议在决定是否使用 Rspack 之前，评估你的项目需求和风险承受能力。如果你的项目对稳定性和性能要求较高，可以先选择更成熟的 webpack。如果你愿意尝试新的工具并为其发展做出贡献，我们欢迎你使用 Rspack，并提供反馈和报告问题，以帮助改进它的稳定性和功能。
