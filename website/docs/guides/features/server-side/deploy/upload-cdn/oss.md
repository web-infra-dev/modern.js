---
sidebar_position: 1
---

# 阿里云 OSS

Modern.js 支持将资源文件上传到阿里云 OSS 产品中。

## 启用功能

在项目目录中执行 `pnpm new` 启用部署功能，忽略云函数相关内容，只开启 CDN 上传功能：

```bash
? 请选择你想要的操作：启用可选功能
? 启用可选功能：启用「部署」功能
? 默认使用框架自带的专业 Web 服务器，是否调整：否
? 请选择 CDN 平台：阿里云 OSS
? 请选择云函数平台：不使用云函数部署
```

可以发现 `package.json` 中已经新增了以下依赖：

```json
{
  + "@modern-js/plugin-cdn-oss": "^1"
}
```

## 配置环境变量

部署到阿里云 OSS 需要在环境变量中配置账号、区域等信息。除了基础的 `accountId`、`secretId` 和 `secretKey` 等账号信息外，还需要配置 `bucketName`。

部分**可以进入代码仓库**的环境变量可以放在项目的 `.env` 文件中。例如：

```bash
# 阿里云账号 ID
CLOUD_ACCOUNT_ID
# 阿里云区域信息（可选，默认 'cn-hangzhou'）
CLOUD_REGION
# OSS Bucket 名称
CLOUD_BUCKET_NAME
# 如果创建的 bucket region 与默认 region 不同，也可以单独配置
CLOUD_BUCKET_REGION
# 配置资源上传到 Bucket 的哪个目录下
CLOUD_BUCKET_PATH
```

另外与账号鉴权相关的信息，必须确保放在平台上，例如 [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) 中。

```bash
# 阿里云访问 AK
CLOUD_SECRET_ID
# 阿里云访问 SK
CLOUD_SECRET_KEY
```

## 获取发布配置

上述相关配置都可以在阿里云平台中获取。

1. AccountID 在[阿里云账号中心页](https://account.console.aliyun.com/v2/#/basic-info/index)获取：

![accountId](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/aliyun-account-id.png)

2. SecretID（AccessKey ID），SecretKey（AccessKey Secret），在[用户信息管理页](https://usercenter.console.aliyun.com/#/manage/ak)获取：

![aksk](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/aliyun-aksk.png)

3. Bucket 信息可以从阿里云 OSS 的 [Bucket 列表](https://oss.console.aliyun.com/bucket)中获取：

![bucket](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/oss-bucket-list.png)

## 查看资源文件

直接访问指定 Bucket 的文件列表，点击文件详情即可获取访问 URL：

![bucket-file](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/oss-file.png)

:::info 注
若要通过外网直接访问对象存储的临时域名，必须修改该桶权限为对外可读。
:::

:::info 补充信息
阿里云 OSS 不支持默认的对域名来访问 `.html`、图片等文件，如需以此方式部署，则必须自定义对象存储的域名，详情可以查看[阿里云帮助文档](https://help.aliyun.com/document_detail/39545.html)。
:::

## 应用域名

在测试阶段，可以直接在配置文件中设置静态资源前缀 `output.assetPrefix` 为阿里云 OSS 的临时域名：

```js
export default defineConfig({
  output: {
    assetPrefix: "https://{bucketName}.oss-{bucketRegion}.aliyuncs.com/"
  }
}
```

执行 `pnpm run build && pnpm run start` 后，打开页面，可以发现静态资源已经通过 OSS 临时域名访问，并且页面能够正常展示。
