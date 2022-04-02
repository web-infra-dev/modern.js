---
sidebar_position: 1
---

# 发布到阿里云 FC

Modern.js 支持通过阿里云的云函数产品部署应用。部署时，Modern.js 会自动将应用打包成阿里云函数的所需的部署产物，并通过[官方工具](https://github.com/alibaba/funcraft)将应用部署到函数计算服务中。

## 启用功能

在项目目录中执行 `pnpm new` 启用部署功能，先忽略 CDN 相关内容，只开启云函数部署功能：

```bash
? 请选择你想要的操作：启用可选功能
? 启用可选功能：启用「部署」功能
? 默认使用框架自带的专业 Web 服务器，是否调整：否
? 请选择 CDN 平台：不使用 CDN
? 请选择云函数平台：阿里云 FC
```

可以发现 `package.json` 中已经新增了以下依赖：

```json
{
  + "@modern-js/plugin-lambda-fc": "^1"
}
```

## 配置环境变量

部署到阿里云需要在环境变量中配置账号、区域等信息。包括 `accountId`、`secretId` 和 `secretKey`。

部分**可以进入代码仓库**的环境变量可以放在项目的 `.env` 文件中。例如：

```bash
# 阿里云账号 ID
CLOUD_ACCOUNT_ID
# 阿里云区域信息（可选，默认 'cn-hangzhou'）
CLOUD_REGION
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

![aksk](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs//aliyun-account-id.png)

2. SecretID（AccessKey ID），SecretKey（AccessKey Secret），在[用户信息管理页](https://usercenter.console.aliyun.com/#/manage/ak)获取：

![aksk](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs//aliyun-aksk.png)

## 部署应用

在项目中执行 `pnpm deploy`，应用会首先进行构建，随后可以看到开始部署到阿里云函数：

![fc](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/aliyun-fc-deploy.png)

发布后，阿里云会输出一个临时可用的域名，打开浏览器访问即可。

:::info 补充信息
为了提升启动速度，阿里云 FC 容器限制压缩包大小为 50M，请尽可能精简你的代码依赖。
:::

## 查看函数

可以通过[阿里云 FC 控制台](https://fcnext.console.aliyun.com/overview)查看已经部署的函数，Modern.js 默认会使用项目 `package.json` 中的的 `name` 值作为函数前缀：

![fc](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/aliyun-fc-list.png)

在控制台中，可以进入函数进行调试、部署版本、添加新的 Trigger，或是为函数添加自定义域名等。
