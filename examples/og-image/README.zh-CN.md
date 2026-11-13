# 使用 Modern.js 生成 Open Graph 分享图片

[English](./README.md)

本示例使用 [Satori](https://github.com/vercel/satori) 和 [Resvg](https://github.com/thx/resvg-js)，将 JSX 模板渲染为 1200 × 630 的 PNG 分享封面。默认在构建时生成图片，以静态文件提供访问，同时保留独立的 BFF 配置作为请求时生成方案。

两种配置的文章页面都使用 SSR。初始 HTML 包含标题、描述、规范地址和绝对地址形式的 `og:image`，分享爬虫无需执行 JavaScript。图片生成不依赖 SSG。

![实际生成的文章分享封面](./preview.png)

[长标题预览](./preview-long-title.png)。两种模式共用模板和随附字体，生成相同的图片。

|                | 构建时生成（默认）             | 请求时生成（可选）                  |
| -------------- | ------------------------------ | ----------------------------------- |
| 配置文件       | `modern.config.ts`             | `modern.bff.config.ts`              |
| 开发           | `pnpm dev`                     | `pnpm dev:bff`                      |
| 构建 / 预览    | `pnpm build` / `pnpm serve`    | `pnpm build:bff` / `pnpm serve:bff` |
| 图片地址       | `/static/og/<slug>.<hash>.png` | `/api/og/<slug>?v=1`                |
| 部署后渲染图片 | 无需渲染                       | 未命中缓存时由 BFF 渲染             |
| 页面渲染       | SSR                            | SSR                                 |

## 运行

使用 Node.js 22.18 及以上的 22.x 版本，或 Node.js 24.3 及以上版本，具体要求见 `package.json`。Modern.js 依赖固定为已验证的 3.11.3 版本。

在仓库根目录执行：

```bash
pnpm install
cd examples/og-image
pnpm dev
```

如果将示例目录复制为独立项目，在该目录执行 `pnpm install` 即可。示例不需要外部 API 或凭据。

访问[文章页面](http://localhost:8080/posts/hello-modern)或[长标题页面](http://localhost:8080/posts/long-title)，页面中提供对应 PNG 的链接。默认开发命令在编译前生成图片，再将其作为静态资源提供访问。修改文章数据、图片模板或字体后，重启开发服务以重新生成图片和地址映射。

`SITE_URL` 表示对外提供服务的 HTTP(S) 源站地址，不能包含路径、查询参数或凭据，默认值为 `http://localhost:8080`。Modern.js 在启动开发服务或构建时将它写入产物，保证服务端与浏览器使用相同的绝对元信息地址。正式构建前应设置为用户和爬虫可以访问的地址，包括由反向代理提供 HTTPS 的情况。仅在启动已有产物时设置它，不会改变已经生成的地址。

```bash
SITE_URL=https://journal.example.com pnpm build
pnpm serve
```

本地验证生产模式时可省略 `SITE_URL`，使用默认的 8080 端口。切换模式前停止正在运行的服务，并使用配套的构建和预览命令。

## 构建时生成图片

[Next.js 图片元信息路由](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)在输入满足静态优化条件时，可以在构建阶段生成图片。本示例参考这个流程，通过示例内的构建插件和显式元信息配置实现：

1. `config/build-og-images.ts` 在编译前枚举 `shared/posts.ts` 中的文章。
2. `shared/og/render.tsx` 使用 Satori 将 JSX 模板转为 SVG，再由 Resvg 生成 PNG。构建插件通过 Modern.js 已注册的 TypeScript 运行时加载 TSX。
3. 插件将 PNG 写入 Git 忽略的 `.og-images` 目录，文件名包含 PNG 内容的哈希。Rsbuild 将其复制到 `dist/static/og`。
4. 插件向页面产物注入文章 slug 到图片路径的映射。页面 loader 将路径与 `SITE_URL` 组合，`Helmet` 再把图片地址写入初始 HTML。

执行 `pnpm build` 即可生成图片，无需先启动服务。图片渲染失败会使构建失败。默认配置不导入或注册 BFF 插件，也不会编译图片 API。它没有启用 SSG 插件，也不会预渲染文章 HTML。图片可以交给普通静态文件服务托管，本示例的页面仍然使用 SSR。

这里实现的是示例内插件，文章列表由代码显式提供。Next.js 则提供框架内置的文件约定和静态、动态路由分析。接入 CMS 时，应在生成阶段获取并枚举需要的内容，内容变化后重新构建。依赖请求信息或构建时尚不存在的内容，需要另行触发生成，也可以选用本示例的 BFF 配置。

## 构建和部署

```bash
pnpm typecheck
pnpm build
pnpm serve
```

为 SSR 页面生成可独立运行的 Node.js 部署产物：

```bash
SITE_URL=https://journal.example.com MODERNJS_DEPLOY=node pnpm run deploy
PORT=8080 node .output/index
```

`modern deploy` 会同时执行构建。将整个 `.output` 目录复制到部署环境。默认模式下，`.output/static/og` 包含已经生成的 PNG，部署后的应用无需图片渲染逻辑、字体、Satori 或 Resvg。本示例中的 Node.js 进程负责 SSR 和静态文件访问。

Resvg 在执行图片生成的机器上需要原生二进制模块。默认模式只在构建机器生成图片。BFF 模式还会在部署机器生成图片，因此应在与部署目标操作系统和架构匹配的环境安装依赖和构建。本地 Node.js 验证通过，不代表已经验证 Vercel、Netlify、其他操作系统或边缘运行时。

## 可选的 BFF 模式

```bash
pnpm dev:bff
# 或构建后预览
pnpm build:bff
pnpm serve:bff
# 或生成部署产物
SITE_URL=https://journal.example.com MODERNJS_DEPLOY=node pnpm run deploy:bff
PORT=8080 node .output/index
```

`modern.bff.config.ts` 启用 BFF 插件，向同一个页面 loader 提供 `/api/og/<slug>?v=1` 形式的图片路径。`api/lambda/og/[slug].ts` 调用共享渲染器，返回包含 `Uint8Array` 的标准 `Response`，并设置 `Content-Type: image/png`。直接返回 `Buffer` 会进入 BFF 普通 JSON 序列化流程，无法得到这里需要的二进制响应。未知文章返回 404，并设置 `Cache-Control: no-store`。

此模式的服务端构建会将共享渲染器和 `shared/og/assets` 复制到 `dist/shared`，部署时再复制到 `.output/shared`。字体相对于 `__dirname` 读取，因此在其他工作目录启动产物也不需要源码或系统字体。部署时保留随附的字体许可证。

`package.json` 中保留 `@modern-js/plugin-bff` 仅用于这个可选方案。复制为只使用构建时生成的独立项目时，可以移除该依赖、`api` 目录、`modern.bff.config.ts` 和 `*:bff` 脚本。

## 验证运行中的服务

在另一个终端启动对应模式的开发、生产预览或部署服务后执行：

```bash
# 默认构建时生成模式
node scripts/verify.mjs http://localhost:8080
# 可选的 BFF 模式
node scripts/verify.mjs --bff http://localhost:8080
# 保存 PNG 和原始 HTML 以供检查
node scripts/verify.mjs http://localhost:8080 /tmp/modern-og-preview
```

验证脚本检查原始 HTML 元信息、PNG 文件头和尺寸，并覆盖长标题与未知文章。构建时生成模式还会校验文件名哈希与收到的 PNG 内容一致，以及 BFF 图片接口返回 404。BFF 模式则检查版本化地址和缓存响应头。

验证地址应与启动开发服务或构建时使用的 `SITE_URL` 一致。验证部署产物独立性时，将 `.output` 复制到仓库外，在新位置启动 `index.js`，再对该服务运行验证脚本。

## 模板与字体

Satori 仅支持[部分 HTML 和 CSS](https://github.com/vercel/satori#css)。本模板使用内联样式与 flex 布局，长标题缩小字号并最多显示三行，避免与作者信息重叠。完整标题仍保留在页面及元信息中。如果改为任意浏览器布局或接受不受限的用户输入，需要增加布局检查。

渲染器在每个进程中加载一次随附字体，并禁用系统字体加载。Inter 字体采用静态 WOFF 格式，仅包含本英文示例需要的拉丁字符。如需中文，请增加具有所需字形、许可证允许使用的静态 TTF、OTF 或 WOFF 字体，在 `shared/og/render.tsx` 中注册字体数据与字重，并更新 `fontFamily`。同时保留字体许可证，检查缺字和换行。字体来源见[字体说明](./shared/og/assets/README.md)。

## 缓存与更新

构建时生成的图片使用 PNG 内容哈希作为文件名的一部分。修改可见内容、模板或字体后重新构建，图片地址会自动更新。静态资源的缓存响应头由静态文件服务或 CDN 管理，可以为这些带哈希的地址配置长期不可变缓存。图片应与对应的页面产物一起发布，并在旧 HTML 缓存仍然引用历史图片时保留这些文件。示例每次构建都会替换本地生成文件，不保存历史发布版本。

BFF 图片响应设置 `Cache-Control: public, max-age=3600, s-maxage=86400`，允许遵守这些指令的浏览器缓存一小时，共享缓存保存一天。示例没有应用层图片缓存，未命中缓存的请求会重新渲染。修改 BFF 图片内容、模板或字体后，递增 `shared/posts.ts` 中的 `imageVersion`，并确保 CDN 缓存键包含 `v`。该参数不会保存历史图片，也不会强制清空缓存。

图片缓存与 SSR 页面缓存是不同的层，图片响应头不会配置页面缓存。分享平台还可能在 CDN 之外单独缓存元信息与图片，必要时同时刷新 HTML 缓存和分享平台预览。
