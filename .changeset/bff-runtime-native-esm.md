---
'@modern-js/bff-runtime': patch
---

fix(bff-runtime): Use the CommonJS entry for both `import` and `require` in Node.js. ESM consumers can import `match`, `isHandler`, and `isSchemaHandler` by name and access the full schema API through the default import.

fix(bff-runtime)：在 Node.js 中让 `import` 和 `require` 使用同一 CommonJS 入口。ESM 调用方可按名称导入 `match`、`isHandler` 和 `isSchemaHandler`，并通过默认导入访问完整的 schema API。
