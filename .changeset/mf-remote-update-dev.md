---
'@modern-js/plugin-module-federation': minor
'@modern-js/runtime': minor
'@modern-js/server-core': patch
'@modern-js/server': patch
'@modern-js/app-tools': patch
---

feat: expose asynchronous remote update checks and user-triggered SSR updates, and refresh Bridge SSR and Service App consumers after successful development manifest updates.

Await asynchronous development compilation hooks before refreshing server resources, and dispose Service deployment runtimes when their application generation is replaced.

feat: 提供异步远程更新检查和由用户触发的 SSR 更新 API，并在开发 manifest 更新成功后刷新 Bridge SSR 和 Service App 消费者。

等待异步开发编译钩子完成后再刷新服务端资源，并在应用版本替换时释放 Service 部署运行时。
