---
'@modern-js/bff-core': patch
---

fix(bff-core): type `Data`, `Query`, `Params`, `Headers` and `Upload` against Standard Schema instead of the `zod` package, so Zod 3 and Zod 4 schemas both type-check no matter which `zod` copy bff-core resolves.

fix(bff-core): `Data`、`Query`、`Params`、`Headers`、`Upload` 的参数类型改为基于 Standard Schema，不再依赖 `zod` 包本身。无论 bff-core 解析到哪个版本的 `zod`，Zod 3 和 Zod 4 的 schema 都能通过类型检查。
