# Data Loader 约定

- **文件名**：与路由组件同名的 `.data` 文件，例如 `page.tsx` 对应 `page.data.ts`（layout 对应 `layout.data.ts`）。
- **位置**：放在约定式路由目录 `src/routes/` 下、与对应路由组件同一目录（同级）。
- **导出**：具名导出一个 `loader` 函数（`export const loader = async () => { ... }`），
  在路由组件渲染前执行；组件里用 `useLoaderData()`（来自 `@modern-js/runtime/router`）取数据。
