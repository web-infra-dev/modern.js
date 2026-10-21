---
'@modern-js/app-tools': patch
---

fix(app-tools): scope streaming HTML script rewriting to each entry so CSR and string SSR pages retain their script order and injection settings in mixed applications.

fix(app-tools): 按入口处理流式 HTML 脚本改写，避免混用应用中的 CSR 和字符串 SSR 页面丢失脚本执行顺序或插入位置配置。
