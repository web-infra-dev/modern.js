Modern.js v3 已移除 `modern new`（即 `pnpm new`）命令，不能再用命令行交互添加入口。
手动做法：在 src/ 下新建一个入口目录（如 src/admin/），在其中创建 routes/ 目录并添加 page.tsx / layout.tsx，Modern.js 会按目录约定自动识别为新的页面入口（主入口目录名与 package.json name 相同）。
