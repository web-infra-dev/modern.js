Modern.js Builder 指的是 Modern.js 的构建工具，它的目标是「复用构建工具的最佳实践」。

因为 webpack 等打包工具是比较底层的，如果我们基于 webpack 来构建一个项目，需要充分理解 webpack 的各个配置项和三方插件，并进行繁琐的配置组合和调试工作。

而 Builder 比 Bundler 的封装程度更高，并默认集成代码转换、代码压缩等能力。通过接入 Builder，你可以快速获得构建 Web 应用的能力。

Modern.js Builder 内部的分层如下：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/builder-struct-10092.png)
