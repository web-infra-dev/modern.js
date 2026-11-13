# 使用 Modern.js 生成 Open Graph 分享图片

[English](./README.md)

![实际生成的文章分享封面](./preview.png)

[长标题预览](./preview-long-title.png)。这些预览由 BFF 接口使用随附字体实际生成。

本示例使用 [Satori](https://github.com/vercel/satori) 和 [Resvg](https://github.com/thx/resvg-js)，在服务端为文章生成 1200 × 630 的 PNG 分享封面。页面初始 HTML 包含标题、描述、规范地址和绝对地址形式的 `og:image`，分享爬虫无需执行 JavaScript。

## 运行

使用 Node.js 22.18 及以上的 22.x 版本，或 Node.js 24.3 及以上版本，具体要求见 `package.json`。Modern.js 依赖固定为已验证的 3.11.3，避免 `latest` 更新后改变示例行为。

在仓库根目录执行：

```bash
pnpm install
cd examples/og-image
pnpm dev
```

如果将示例目录复制为独立项目，在该目录执行 `pnpm install` 即可。示例不需要外部 API 或凭据。

访问以下地址：

- [文章页面](http://localhost:8080/posts/hello-modern)
- [长标题页面](http://localhost:8080/posts/long-title)
- [PNG 图片接口](http://localhost:8080/api/og/hello-modern?v=1)

`SITE_URL` 表示对外提供服务的 HTTP(S) 源站地址，不能包含路径、查询参数或凭据，默认值为 `http://localhost:8080`。Modern.js 在启动开发服务或构建时将它写入产物，保证服务端与浏览器使用相同的绝对元信息地址。正式构建前应设置为用户和爬虫可以访问的地址，包括由反向代理提供 HTTPS 的情况。仅在启动已有产物时设置它，不会改变已经生成的地址。

```bash
SITE_URL=https://journal.example.com pnpm build
pnpm serve
```

本地验证生产模式时可省略 `SITE_URL`，使用默认的 8080 端口。

## 构建和部署

```bash
pnpm typecheck
pnpm build
pnpm serve
```

生成可独立运行的 Node.js 部署产物：

```bash
SITE_URL=https://journal.example.com MODERNJS_DEPLOY=node pnpm run deploy
PORT=8080 node .output/index
```

`modern deploy` 会同时执行构建。将整个 `.output` 目录复制到部署环境。由于 `@resvg/resvg-js` 使用原生二进制模块，应在与目标操作系统和架构匹配的环境安装依赖和构建。本地 Node.js 验证通过，不代表已经验证 Vercel、Netlify、其他操作系统或边缘运行时。

服务端构建会将 `api/assets` 中的字体文件复制到 `dist/api/assets`，部署时再复制到 `.output/api/assets`。`api/og.tsx` 相对于 `__dirname` 读取字体，因此在其他工作目录启动产物也不需要源码或系统字体。部署时保留随附的字体许可证。

## 验证运行中的服务

在另一个终端启动开发、生产预览或部署服务后执行：

```bash
node scripts/verify.mjs http://localhost:8080
node scripts/verify.mjs http://localhost:8080 /tmp/modern-og-preview
```

验证脚本检查原始 HTML 中的元信息，访问其中的图片地址，检查 PNG 文件头和尺寸，并覆盖长标题与未知文章。可选的输出目录用于保存图片，方便人工检查。验证地址应与启动开发服务或构建时使用的 `SITE_URL` 一致。验证部署产物独立性时，将 `.output` 复制到仓库外，在新位置启动 `index.js`，再对该服务运行验证脚本。

## 实现说明

- `shared/posts.ts` 提供本地文章数据、图片尺寸和图片地址版本。
- `src/routes/posts/[slug]/page.data.ts` 返回文章数据和绝对地址形式的元信息。未知文章抛出 404 响应。
- `src/routes/posts/[slug]/page.tsx` 配合 string SSR 使用 `Helmet`，将元信息写入初始 HTML。
- `api/og.tsx` 使用 Satori 将 JSX 模板转换成 SVG，再使用 Resvg 生成 PNG。字体在每个进程中加载一次，并禁用系统字体加载。
- `api/lambda/og/[slug].ts` 通过 `/api/og/:slug` 提供图片。它返回包含 `Uint8Array` 的标准 `Response`，并设置 `Content-Type: image/png`。直接返回 `Buffer` 会进入 BFF 普通 JSON 序列化流程，无法得到这里需要的二进制响应。未知文章返回 404，并设置 `Cache-Control: no-store`。

Satori 仅支持[部分 HTML 和 CSS](https://github.com/vercel/satori#css)。本模板使用内联样式与 flex 布局，长标题缩小字号并最多显示三行，避免与作者信息重叠。完整标题仍保留在页面及元信息中。如果改为任意浏览器布局或接受不受限的用户输入，需要增加布局检查。

随附的 Inter 字体采用静态 WOFF 格式，仅包含本英文示例需要的拉丁字符。如需中文，请增加具有所需字形、许可证允许使用的静态 TTF、OTF 或 WOFF 字体，在 `api/og.tsx` 中注册字体数据与字重，并更新 `fontFamily`。同时保留字体许可证，检查缺字和换行。字体来源见[字体说明](./api/assets/README.md)。

## 缓存与更新

成功的图片响应设置 `Cache-Control: public, max-age=3600, s-maxage=86400`，允许遵守这些指令的浏览器缓存一小时，共享缓存保存一天。示例没有应用层图片缓存，未命中缓存的请求会重新渲染图片，内存中只复用字体数据。

图片缓存与 SSR 页面缓存是不同的层。图片响应头不会开启或配置页面渲染缓存。分享平台还可能在 CDN 之外单独缓存元信息与图片。

修改模板或字体后，递增 `shared/posts.ts` 中的 `imageVersion`。接入 CMS 时，文章内容变更也应参与版本管理。`v` 查询参数使爬虫和缓存读取更新后的 HTML 时发现新图片地址，但不会保存历史图片版本，也不会强制清空已有缓存。CDN 的缓存键应包含 `v`，必要时同时刷新 HTML 缓存和分享平台预览。
