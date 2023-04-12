---
'@modern-js/runtime': patch
'@modern-js/app-tools': patch
'@modern-js/core': patch
---

fix: plugin config hook can not get bundlerType, so we can't set babelConfig correctly in ssr plugin
fix: 插件的 config 钩子不能获得 bundlerType，所以我们在 ssr 插件不能正确的设置 babelConfig
