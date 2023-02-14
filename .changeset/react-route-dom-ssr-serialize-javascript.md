---
'@modern-js/runtime': patch
---

chore: serialize react-router-dom ssr data, avoid the syntax conflict with HTML. Such as when json data contains `</script>` will be stringify to `\u003c/script\u003e`

chore: 序列化react-router-dom ssr 的数据，避免html标签语义冲突。例如当json数据中包含`</script>`的时候会被转换成`\u003c/script\u003e`
