---
'@modern-js/prod-server': patch
'@modern-js/types': patch
---

fix: use mock host instead real url host for url parse, for new URL not support ipv6, and we only need parse url path & search
fix: 使用虚拟的域名代替真实的主机名，因为 new URL 不支持解析 ipv6 的域名，并且我们只需要解析 url 的路径和查询字符串
