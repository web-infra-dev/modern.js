
Modern.js 生成器会提供一个可交互的问答界面，根据结果初始化项目，按照默认的选择进行初始化：

```bash
? 请选择你想创建的工程类型 应用
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
```

在生成项目后，Modern.js 会自动安装依赖、创建 git 仓库。

```bash
[INFO] 依赖自动安装成功
[INFO] git 仓库初始化成功
[INFO] 创建成功！
可在新项目的目录下运行以下命令：
pnpm run dev          # 按开发环境的要求，运行和调试项目
pnpm run build        # 按产品环境的要求，构建项目
pnpm run start        # 按产品环境的要求，运行项目
pnpm run lint         # 检查和修复所有代码
pnpm run new          # 继续创建更多项目要素，比如应用入口
```

:::note
Modern.js 生成器除了在项目初始化时工作外，也能在后续研发中生成项目各种粒度的模块，并非一用即抛开。
:::

现在，项目结构如下：

```
.
├── node_modules
├── src
│   ├── modern-app-env.d.ts
│   └── routes
│       ├── index.css
│       ├── layout.tsx
│       └── page.tsx
├── modern.config.ts
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```
