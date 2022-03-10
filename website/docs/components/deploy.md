Modern.js 支持通过云平台一键部署应用。

使用云平台部署应用，我们需要先开启部署功能。在项目根目录下执行 `pnpm run new`，进行如下选择：

```bash
? 请选择你想要的操作：启用可选功能
? 启用可选功能：启用「部署」功能
? 默认使用框架自带的专业 Web 服务器，是否调整：否
? 请选择 CDN 平台：阿里云 OSS
? 请选择云函数平台：阿里云 FC
```

安装依赖后，可以看到 package.json 中新增了两项依赖：

```bash
+ "@modern-js/plugin-lambda-fc": "^1"
+ "@modern-js/plugin-cdn-fc": "^1"
```

我们可以在项目根目录下的 `.env` 中添加云平台必要的账号信息，以阿里云为例，包括 `accountId`、`secretId` 和 `secretKey`。使用 CDN 上传还需要配置 `bucketName`。

部分**可暴露的、可以进入代码仓库**的环境变量可以放在项目的 `.env` 文件中，例如：

```bash
# 阿里云账号 ID
CLOUD_ACCOUNT_ID
# 阿里云 OSS Bucket 名称
CLOUD_BUCKET_NAME
```

鉴权相关信息**必须在平台上配置，不能进入代码仓库**。为了方便本地测试，我们临时的在 `.env` 中添加：

```bash
# 阿里云访问 AK
CLOUD_SECRET_ID
# 阿里云访问 SK
CLOUD_SECRET_KEY
```

:::warning 警告
此处仅仅是用于本地测试，SecretID/SecretKey 必须从代码中移除，避免信息泄露。
:::

1. AccountID 在[阿里云账号中心页](https://account.console.aliyun.com/v2/#/basic-info/index)获取。

2. SecretID（AccessKey ID），SecretKey（AccessKey Secret），在[用户信息管理页](https://usercenter.console.aliyun.com/#/manage/ak)获取。

3. Bucket 信息可以从阿里云 OSS 的 [Bucket 列表](https://oss.console.aliyun.com/bucket)中获取。

我们可以根据 OSS 的 Bucket 名称和 Region 名称拼接出 OSS 的临时域名，并设置为[静态资源域名前缀](/docs/apis/config/output/asset-prefix)：

```js
export default defineConfig({
  output: {
    assetPrefix: "https://{bucketName}.oss-{bucketRegion}.aliyuncs.com/"
  }
}
```

执行 `pnpm run deploy` 命令后，应用将会先执行构建，将静态资源上传到 OSS 以及将应用部署到阿里云 FC 中。
