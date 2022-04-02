---
sidebar_position: 2
---

# 发布到腾讯云 SCF

Modern.js 支持通过腾讯云的云函数产品部署应用。部署时，Modern.js 会自动将应用打包成腾讯云函数的所需的部署产物，并通过[官方工具](https://github.com/serverless-components/tencent-scf)将应用部署到函数计算服务中。

## 启用功能

在项目目录中执行 `pnpm new` 启用部署功能，先忽略 CDN 相关内容，只开启云函数部署功能：

```bash
? 请选择你想要的操作：启用可选功能
? 启用可选功能：启用「部署」功能
? 默认使用框架自带的专业 Web 服务器，是否调整：否
? 请选择 CDN 平台：不使用 CDN
? 请选择云函数平台：腾讯云 SCF
```

可以发现 `package.json` 中已经新增了以下依赖：

```json
{
  + "@modern-js/plugin-lambda-scf": "^1"
}
```

## 配置环境变量

部署到腾讯需要在环境变量中配置账号、区域等信息。包括 `secretId` 和 `secretKey`。

部分**可以进入代码仓库**的环境变量可以放在项目的 `.env` 文件中。例如：

```bash
# 腾讯云区域信息（可选，默认 'ap-guangzhou'）
CLOUD_REGION
```

另外与账号鉴权相关的信息，必须确保放在平台上，例如 [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) 中。

```bash
# 腾讯云访问 AK
CLOUD_SECRET_ID
# 腾讯云访问 SK
CLOUD_SECRET_KEY
```

## 获取发布配置

上述相关配置都可以在腾讯云平台的 [API 秘钥管理](https://console.cloud.tencent.com/cam/capi)中获取：

![aksk](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/tencent-aksk.png)

## 部署应用

在项目中执行 `pnpm deploy`，应用会首先进行构建，随后可以看到开始部署到腾讯云函数：

![scf](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/tencent-scf-deploy.png)

发布后，腾讯云会输出一个临时可用的域名，打开浏览器访问即可。

## 查看函数

可以通过[腾讯云 SCF 控制台](https://console.cloud.tencent.com/scf/list)查看已经部署的函数，Modern.js 默认会使用项目 `package.json` 中的的 `name` 值作为函数前缀：

![scf-list](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/tencent-scf-list.png)

在控制台中，可以进入函数进行调试、部署版本、添加新的 Trigger，或是为函数添加自定义域名等。
