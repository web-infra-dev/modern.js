Bundler chain 是 webpack chain 的子集，其中包含一部分 webpack chain API，你可以用它来同时修改 webpack 和 Rspack 的配置。

通过 bundler chain 修改的配置，在 webpack 和 Rspack 构建时均可生效。需要注意的是，bundler chain 只支持修改 webpack 和 Rspack 间无差异部分的配置。如，修改 devtool 配置项(webpack 和 Rspack 的 devtool 属性值类型相同)，或添加一个[Rspack 兼容](https://www.rspack.dev/zh/guide/plugin-compat.html)的 webpack 插件。
