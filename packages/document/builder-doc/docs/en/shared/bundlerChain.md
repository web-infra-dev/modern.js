Bundler chain is a subset of webpack chain, which contains part of the webpack chain API that you can use to modify both webpack and Rspack configuration.

Configurations modified via bundler chain will work on both webpack and Rspack builds. Note that the bundler chain only supports modifying the configuration of the non-differentiated parts of webpack and Rspack. For example, modifying the devtool configuration option (webpack and Rspack have the same devtool property value type), or adding an [Rspack-compatible](https://www.rspack.dev/guide/plugin-compat.html) webpack plugin.
