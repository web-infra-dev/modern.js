---
'@modern-js/runtime': patch
---

fix: if the second args of string.replace is a string, it would as RegExp. so we use function to replace
fix: 如果 string.replace 第二个参数是字符串,他若有特殊字符将会被当作正则处理，所以我们用函数去替换他
