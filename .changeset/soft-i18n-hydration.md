---
'@modern-js/plugin-i18n': patch
---

fix(plugin-i18n): align SSR backend with detected public locales directory

fix(plugin-i18n): SSR backend 跟随检测到的 public locales 目录，避免与根 locales 目录读取不一致
