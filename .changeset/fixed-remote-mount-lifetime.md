---
'@modern-js/runtime': patch
---

fix: recreate remote application mounts when their basename changes while preserving state during props updates and navigation within one mount

fix: 挂载 basename 改变时重建远程应用实例，同一次挂载中的 props 更新和内部导航继续保留状态
