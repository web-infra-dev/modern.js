## Precautions

Before using Rspack, you need to be aware of the following:

- Rspack is compatible with most webpack plugins and almost all loaders, but there are still a few webpack plugins that cannot be used for now. For more details, see [Plugin Compatibility](https://rspack.dev/guide/compatibility/plugin).
- Rspack uses [SWC](https://rspack.dev/guide/features/builtin-swc-loader) by default for code transformation and compression. In rare cases, you may encounter bugs in SWC in edge cases. You can provide feedback via [SWC issues](https://github.com/swc-project/swc/issues).
