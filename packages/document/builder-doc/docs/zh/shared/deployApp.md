## 部署应用

当你执行 `builder build` 构建应用后，你会在 `dist` 目录下得到一份静态资源产物，这份产物可以被部署到任意平台或服务器上。

请留意 Builder 默认的产物结构并不适用于所有的平台，因为不同的平台对产物目录结构有不同的要求。你可以参考 [构建产物目录](/guide/basic/output-files) 章节对目录结构进行修改，以满足部署平台的要求。

此外，如果你需要在本地预览待部署的产物，可以使用 Builder CLI 提供的 [builder serve](/guide/basic/builder-cli#builder-serve) 命令。
