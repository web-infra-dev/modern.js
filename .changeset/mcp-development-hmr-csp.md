---
'@modern-js/mcp-apps': patch
---

Allow the application's development WebSocket origin in resource CSP so sandboxed cards can connect to HMR. Preserve HTTPS proxy termination and keep automatic WebSocket permissions out of production resources.

开发环境资源 CSP 允许应用的 WebSocket origin，支持隔离卡片连接 HMR，并适配 HTTPS 代理。生产资源不自动增加 WebSocket 权限。
