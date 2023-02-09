---
'@modern-js/plugin-garfish': patch
---

fix(garfish): load microApp can not match it's route
fix(garfish): server.baseUrl is in preference to router.basename

修复微前端模式下约定式路由和自控式路由子应用无法正确加载问题
修复 basename 优先级问题 server.baseUrl 高于 router.basename
