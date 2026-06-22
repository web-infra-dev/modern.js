---
'@modern-js/runtime': patch
---

fix(runtime): use the final HTML template parameters when rendering custom Document

The custom Document renderer previously rebuilt its template parameters by calling `options.templateParameters` with empty stubs, which silently dropped any parameters resolved asynchronously by Rsbuild. It now reuses the final `templateData` passed by the HTML plugin (stripping `compilation` / `htmlPlugin` / `rspackConfig` bundler internals), so async and user-supplied template parameters are correctly forwarded to Document.

fix(runtime): 渲染自定义 Document 时使用最终的 HTML 模板参数

之前自定义 Document 渲染流程会用空对象重新调用 `options.templateParameters` 来拼装模板参数，导致 Rsbuild 异步解析出的参数被静默丢弃。现已改为直接复用 HTML 插件传入的最终 `templateData`（剥掉 `compilation` / `htmlPlugin` / `rspackConfig` 等 bundler 内部字段），确保异步及用户自定义的模板参数能正确传递到 Document。
