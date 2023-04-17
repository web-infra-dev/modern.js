---
'@modern-js/runtime': patch
---

fix: the streaming ssr may add repeated css assets, because the route-manifets would product all css link
fix: 因为 route-manifets 会生成所有 css link 信息，导致 streaming ssr 可能添加重复的 css 资源，
