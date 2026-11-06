---
'@modern-js/app-tools': patch
---

fix(app-tools): use a RegExp for the default watch ignore so node_modules is no longer watched in development.

fix(app-tools): 默认的监听忽略规则改用正则，开发时不再监听整个 node_modules。
