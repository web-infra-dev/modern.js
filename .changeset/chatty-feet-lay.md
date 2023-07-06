---
'@modern-js/builder-webpack-provider': patch
'@modern-js/builder-rspack-provider': patch
'@modern-js/builder-shared': patch
---

fix(builder-shared): set formatStats fn as sync-fn so that info can print quikly
fix(builder-shared): 将 formatStats 设置成同步函数使构建信息能够尽快的打印出来
