---
'@modern-js/app-tools': patch
---

feat: add `deploy.copyWholePackages` to copy the named packages to the deploy output in full, so a package that is only imported through subpaths does not lose the entry point its package.json declares

feat: 新增 `deploy.copyWholePackages` 配置，将指定的包完整复制到部署产物中，避免仅通过子路径引用的包丢失其 package.json 声明的入口文件
