---
sidebar_position: 3
---

# 静态 Web 服务器托管网站

大多数情况下，直接在服务器中使用 `start` 命令启动已经构建完的 Modern.js 应用即可。

有时，开发者希望使用自己已有的服务器，或者直接使用 CDN 来托管 Modern.js 应用的产物。默认情况下，构建产物不支持直接在这类静态 Web 服务器中使用。

Modern.js 为这类场景提供了独立的插件来支持。

:::info 注
使用静态 Web 服务器会导致原有的 Modern.js 功能的损失，例如 SSR、SSG，自动的 MAP/SPA 路由等。
:::

## 启用功能

在项目目录中执行 `pnpm new` 启用部署功能，在**是否调整 Web 服务器**一问中选择【是】：

```bash
? 请选择你想要的操作：启用可选功能
? 启用可选功能：启用「部署」功能
? 默认使用框架自带的专业 Web 服务器，是否调整：是
? 请选择 CDN 平台：不使用 CDN
```

可以发现 `package.json` 中已经新增了以下依赖：

```json
{
  + "@modern-js/plugin-static-hosting": "^1"
}
```

启用该功能后，重新执行 `pnpm run build` 命令，可以看到产物 `dist/` 目录下，HTML 文件已经被平铺到外层，同时 `main.html` 也被重命名为了 `index.html`。

```bash
.
├── static/
│   ├── css/
│   │   ├── main.6a8baa57.css
│   │   └── main.6a8baa57.css.map
│   └── js/
│       ├── runtime-main.edcde8c9.js
│       └── runtime-main.edcde8c9.js.map
├── asset-manifest.json
├── home.html
├── index.html
└── route.json
```
## 使用 CDN 托管

Modern.js 支持直接使用 CDN 来托管使用上述插件后的构建产物。此时需要先[开启 CDN 上传](/docs/guides/features/server-side/deploy/upload-cdn/oss)。

接着需要配置额外的环境变量，将整个产物目录上传到 CDN 中。可以在 `.env` 文件中设置以下环境变量，修改默认上传的资源目录：

```bash title=".env"
CLOUD_STATIC_FILES="."
```

:::info 注
默认情况下，Modern.js 的 CDN 插件会上传构建产物中 `static` 文件夹下的内容，修改为 `.` 后，将会上传整个产物目录。
:::

现在，执行 `pnpm run deploy` 命令后，网站就已经被托管在 CDN 上了。

默认情况下，如果没有设置 `output.assetPrefix`，HTML 中的静态资源将通过绝对路径访问，例如：

```html
<script src="/static/js/*.js"></script>
```

在 CDN 托管方式下，如果已经为 CDN 设置了 `CLOUD_BUCKET_PATH`，指定了 CDN 的上传目录，则还需要将 `assetPrefix` 修改为相对路径，保证 HTML 中的静态资源文件能够被正常访问：

```js title="module.config.js"
export default defineConfig({
  output: {
    assetPrefix: './'
  }
}
```

## 使用已有的静态 Web 服务器托管

构建产物也可以直接被应用在任意的静态 Web 服务器中，例如[云平台的静态网站托管](https://cloud.tencent.com/product/wh)。

这里使用最简单的方式来做演示，先在全局安装 `http-server` ，接着进入 `dist/` 目录，执行以下命令。

```bash
http-server
```

控制台打印以下信息，说明 http 服务已经正常启动。

```bash
Available on:
  http://127.0.0.1:8080
```

访问 `http://127.0.0.1:8080`，可以看到页面已经正常渲染。
