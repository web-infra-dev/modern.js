---
'@modern-js/mcp-apps': patch
---

Cache parsed UI manifests across server instances. Reuse successful loads in production, invalidate development files on metadata changes and refresh development remote manifests after 60 seconds. Coalesce concurrent loads and allow retries after failures while keeping request-specific resource metadata isolated.

跨 server 实例缓存解析后的 UI 清单。生产环境复用成功结果，开发环境根据文件状态失效，远程清单缓存 60 秒。合并并发加载，失败后允许重试，资源 metadata 仍按请求独立计算。
