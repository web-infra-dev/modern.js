---
sidebar_label: https
---

# dev.https

:::info 适用的工程方案
MWA
:::

- 类型： `boolean`
- 默认值： `false`

配置该选项后，可以开启 Dev Server 对 HTTPS 的支持。

开启前：

```bash
App running at:

  > Local:    http://localhost:8080/
  > Network:  http://192.168.0.1:8080/
```

开启后：

```bash
App running at:

  > Local:    https://localhost:8080/
  > Network:  https://192.168.0.1:8080/
```

:::info
https 代理自动安装证书需要获取 root 权限, 请根据提示输入密码即可。

**密码仅在信任证书时使用，不会泄漏或者用于其他环节**。
:::

## 示例

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  dev: {
    https: true,
  },
});
```

## 常见问题

### 访问 Network 域名时提示「您的连接不是私密连接」？

Modern.js 基于 [devcert](https://github.com/davewasmer/devcert) 来自动生成 Dev Server 所需的 HTTPS 证书。

由于 devcert 目前不支持 IP addresses，因此访问 Network 域名时会遇到「您的连接不是私密连接」的问题。

此问题的解决方法为点击**「高级」->「继续前往 192.168.0.1（不安全）」**。

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/dev-https-chrome.jpg" style={{ width: 600, boxShadow: '0 0 3px rgba(0,0,0,.3)' }} />

如果项目使用了全局代理，将某个 HTTPS 域名代理到本地进行开发时，会遇到热更新失效的问题（本质上是 wss 请求的证书问题），也可以通过上述方法解决。
