---
'@modern-js/plugin-i18n': patch
---

fix(plugin-i18n): register react-i18next once per i18n instance so server requests no longer grow its plugin list.

fix(plugin-i18n): 每个 i18n 实例只注册一次 react-i18next，避免服务端每个请求都让插件列表变长。
