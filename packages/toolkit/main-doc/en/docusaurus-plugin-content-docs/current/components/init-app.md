Modern.js generator will provide an interactive Q & A interface, initialization items according to the result, according to the default selection:

```bash
? Please select the solution you want to create: MWA Solution
? Development Language: TS
? Package Management Tool: pnpm
```

After create the project, Modern.js automatically installs dependency and creates a git repository.

```bash
[INFO] dependencies are automatically installed
[INFO] git repository has been automatically created
[INFO] Success！
You can run the following command in the directory of the new project：
pnpm run dev          # Run and debug the project according to the requirements of the development environment
pnpm run build        # Build the project according to the requirements of the product environment
pnpm run start        # Run the project according to the requirements of the product environment
pnpm run lint         # Check and fix all codes
pnpm run new          # Create more project elements, such as application portals
```

:::note
In addition to working during project initialization, the Modern.js generator can also generate modules of the project in subsequent development, which is not thrown away as soon as it is used.
:::

Now, the project structure is as follows:

```
.
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
