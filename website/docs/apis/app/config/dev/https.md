---
sidebar_label: https
---

# dev.https

- 类型： `boolean | { key: string; cert: string }`
- 默认值： `false`

配置该选项后，可以开启 Dev Server 对 HTTPS 的支持，同时会禁用 HTTP 服务器。

开启前：

```bash
  > Local:    http://localhost:8080/
  > Network:  http://192.168.0.1:8080/
```

开启后：

```bash
  > Local:    https://localhost:8080/
  > Network:  https://192.168.0.1:8080/
```

### 自动生成证书

你可以直接将 `https` 设置为 `true`，Modern.js 会基于 [devcert](https://github.com/davewasmer/devcert) 来自动生成 Dev Server 所需的 HTTPS 证书。

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  dev: {
    https: true,
  },
});
```

该方式有一定局限性，由于 devcert 目前不支持 IP addresses，因此访问 Network 域名时会遇到「您的连接不是私密连接」的问题。

此问题的解决方法为点击**「高级」->「继续前往 192.168.0.1（不安全）」**。

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/dev-https-chrome.jpg" style={{ width: 600, boxShadow: '0 0 3px rgba(0,0,0,.3)' }} />

如果项目使用了全局代理，将某个 HTTPS 域名代理到本地进行开发时，会遇到热更新失效的问题（本质上是 wss 请求的证书问题），也可以通过上述方法解决。

:::info
https 代理自动安装证书需要获取 root 权限, 请根据提示输入密码即可。

**密码仅在信任证书时使用，不会泄漏或者用于其他环节**。
:::

### 手动设置证书

你也可以在 `dev.https` 选项中手动传入 HTTPS 服务器所需要的证书和对应的私钥，这个参数将直接传递给 Node.js 中 https 模块的 createServer，具体可以参考 [https.createServer](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener)。

```ts title="modern.config.ts"
import fs from 'fs';
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  dev: {
    https: {
      key: fs.readFileSync('certificates/private.pem'),
      cert: fs.readFileSync('certificates/public.pem'),
    },
  },
});
```
