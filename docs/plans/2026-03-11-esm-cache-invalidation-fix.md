# ESM 模块缓存失效修复方案 - Issue #8373

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 V3 版本在开发模式下，ESM 构建的 SSR Bundle 子模块缓存未失效导致的 hydration error 问题。

**Architecture:** 使用 Node.js 自定义 ESM 加载器（Custom Loader），在 resolve hook 中拦截模块解析，给子模块 URL 添加 timestamp 参数，绕过 ESM 缓存。

**Tech Stack:** Node.js ESM Loader Hooks, node:module.register()

---

## 问题分析（已更新）

### 根本原因
1. **主 Bundle 加载** (`resource.ts:107`)：通过 `compatibleRequire()` 加载主 bundle (`dist/bundles/index.js`)
2. **Timestamp 失效** (`require.ts:8-11`)：开发模式下会给主 bundle 添加 `?t=xxx` 参数，绕过缓存重新加载
3. **子模块未失效**：但主 bundle 内部 import 的子模块（如 `page.tsx`）**没有添加 timestamp**，仍然使用缓存的旧版本
4. **Hydration 不匹配**：服务端用旧模块渲染，客户端用新模块，导致 hydration error

### 需要修复的问题（根据审查反馈）

| # | 问题 | 状态 |
|---|------|------|
| 1 | **timestamp 静态化** | 🔴 需修复 - 每次 resolve 时生成新 timestamp |
| 2 | **isLocalModule 逻辑过于简单** | 🔴 需修复 - 复用 `createMatchPath` 处理 alias |
| 3 | **URL 处理方式** | 🟡 暂不处理 - query string 方式应该可行 |

### 关键代码位置
- `@packages/toolkit/utils/src/cli/require.ts` - `importPath()` 函数（当前只给主模块添加 timestamp）
- `@packages/solutions/app-tools/src/esm/register-esm.mjs` - ESM 模块注册逻辑
- `@packages/solutions/app-tools/src/esm/ts-node-loader.mjs` - 现有 loader 实现（参考）

### 启用条件
- 开发模式 (`NODE_ENV === 'development'`)
- ESM 模式 (`MODERN_LIB_FORMAT === 'esm'`)

---

## Task 1: 创建自定义 ESM 加载器

**Files:**
- Create: `packages/solutions/app-tools/src/esm/esm-loader.mjs`

**Step 1: 创建 esm-loader.mjs 文件**

```javascript
/**
 * 自定义 ESM 加载器 - 用于开发模式下子模块缓存失效
 * 仅在 MODERN_LIB_FORMAT === 'esm' 时启用
 * 
 * 修复说明：
 * 1. 每次 resolve 时生成新 timestamp（解决 timestamp 静态化问题）
 * 2. 使用 createMatchPath 处理 alias（解决 isLocalModule 逻辑问题）
 */

import { pathToFileURL } from 'url';
import { createMatchPath } from './utils.mjs';

let matchPath = null;
let enabled = false;

/**
 * 初始化 matchPath 函数
 * 复用 ts-node-loader.mjs 的逻辑来处理 alias
 */
export async function initialize({ appDir, distDir, alias, tsconfigPath }) {
  if (matchPath) {
    return; // 已初始化
  }
  
  matchPath = createMatchPath({
    alias,
    appDir,
    tsconfigPath,
  });
}

/**
 * 判断是否为本地模块（项目目录下的模块）
 * 修复：使用 matchPath 处理 alias，正确识别本地模块
 */
const isLocalModule = (specifier) => {
  // 相对路径 ./xxx 或 ../xxx
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return true;
  }
  
  // 绝对路径（file:// URL）
  if (specifier.startsWith('file://')) {
    return true;
  }
  
  // 使用 matchPath 处理 alias
  if (matchPath) {
    const matched = matchPath(specifier);
    if (matched) {
      return true;
    }
  }
  
  return false;
};

export const resolve = async (specifier, context, nextResolve) => {
  // 仅在开发模式下启用
  if (!enabled) {
    return nextResolve(specifier, context);
  }

  // 只有本地模块才添加 timestamp
  if (isLocalModule(specifier)) {
    // 【修复问题1】每次 resolve 时生成新 timestamp
    const timestamp = Date.now();
    const newSpecifier = `${specifier}?t=${timestamp}`;
    return nextResolve(newSpecifier, context);
  }

  return nextResolve(specifier, context);
};

export const setEnabled = (value) => {
  enabled = value;
};

export const isEnabled = () => enabled;
```

**Step 2: 提交代码**

```bash
git add packages/solutions/app-tools/src/esm/esm-loader.mjs
git commit -m "feat: add custom ESM loader for development cache invalidation"
```

---

## Task 2: 修改 register-esm.mjs 集成自定义加载器

**Files:**
- Modify: `packages/solutions/app-tools/src/esm/register-esm.mjs`

**Step 1: 添加 ESM 加载器注册逻辑**

在 `register-esm.mjs` 中添加注册自定义 loader 的逻辑：

```javascript
import path from 'node:path';
import { fs } from '@modern-js/utils';

const checkDepExist = async dep => {
  try {
    await import(dep);
    return true;
  } catch {
    return false;
  }
};

/**
 * Register Node.js module hooks for TypeScript support.
 * Uses node:module register API to enable ts-node loader.
 */
export const registerModuleHooks = async ({ appDir, distDir, alias }) => {
  const TS_CONFIG_FILENAME = `tsconfig.json`;
  const tsconfigPath = path.resolve(appDir, TS_CONFIG_FILENAME);
  const hasTsconfig = await fs.pathExists(tsconfigPath);
  const hasTsNode = await checkDepExist('ts-node');

  if (!hasTsconfig || !hasTsNode) {
    return;
  }

  const { register } = await import('node:module');
  // These can be overridden by ts-node options in tsconfig.json
  process.env.TS_NODE_TRANSPILE_ONLY = true;
  process.env.TS_NODE_PROJECT = tsconfigPath;
  process.env.TS_NODE_SCOPE = true;
  process.env.TS_NODE_FILES = true;
  process.env.TS_NODE_IGNORE = `(?:^|/)node_modules/,(?:^|/)${path.relative(
    appDir,
    distDir,
  )}/`;
  register('./ts-node-loader.mjs', import.meta.url, {
    data: {
      appDir,
      distDir,
      alias,
      tsconfigPath,
    },
  });
};

/**
 * Register custom ESM loader for development hot reload
 * This enables timestamp-based cache invalidation for sub-modules
 */
let esmLoaderRegistered = false;

export const registerESMLoader = async ({ appDir, distDir, alias }) => {
  // 防止重复注册
  if (esmLoaderRegistered) {
    return;
  }
  
  // Only enable in development mode with ESM format
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  if (process.env.MODERN_LIB_FORMAT !== 'esm') {
    return;
  }

  // 导入自定义 loader
  const { initialize, setEnabled } = await import('./esm-loader.mjs');
  
  // 初始化 loader，传入 alias 配置
  await initialize({ appDir, distDir, alias });
  
  // 启用 loader
  setEnabled(true);
  
  const { register } = await import('node:module');
  
  // 注册自定义 ESM loader
  register('./esm-loader.mjs', import.meta.url, {
    data: {
      appDir,
      distDir,
      alias,
    },
  });
  
  esmLoaderRegistered = true;
};
```

**Step 2: 在 dev.ts 和 build.ts 中调用 registerESMLoader**

修改 `packages/solutions/app-tools/src/commands/dev.ts`:

```javascript
// 在文件顶部导入
const { registerModuleHooks, registerESMLoader } = await import('../esm/register-esm.mjs');

// 在 registerModuleHooks 调用后添加
await registerESMLoader({ appDir, distDir, alias });
```

修改 `packages/solutions/app-tools/src/commands/build.ts`:

```javascript
// 同样添加 registerESMLoader 调用
// 注意：build 模式下不会启用（已在函数内检查 NODE_ENV）
```

**Step 3: 提交代码**

```bash
git add packages/solutions/app-tools/src/esm/register-esm.mjs packages/solutions/app-tools/src/commands/dev.ts packages/solutions/app-tools/src/commands/build.ts
git commit -m "feat: integrate custom ESM loader in register-esm.mjs"
```

---

## Task 3: 验证修复

**说明**：由于每次 resolve 时都会生成新 timestamp（问题1已修复），不需要单独的 timestamp 更新机制。

### 测试用例
已存在的测试用例：`tests/integration/ssr/tests/esm-cache-invalidation.test.ts`

### 运行测试
```bash
cd tests/integration && pnpm run test:framework esm-cache-invalidation
```

### 预期结果
- 测试通过，无 hydration error
- 修改页面内容后刷新浏览器，页面正常显示新内容

---

## 风险与注意事项（已更新）

### 已修复的问题
1. ✅ **timestamp 静态化**：每次 resolve 时生成新 timestamp
2. ✅ **isLocalModule 逻辑**：使用 `createMatchPath` 处理 alias

### 剩余注意事项
1. **生产环境不影响**：只在 `NODE_ENV === 'development'` 时启用
2. **ESM 模式检查**：只在 `MODERN_LIB_FORMAT === 'esm'` 时启用
3. **不影响 node_modules**：只对本地模块添加 timestamp
4. **性能影响**：开发模式下每次 import 都有额外开销，但这是可接受的
5. **兼容性问题**：需要 Node.js 18+（Modern.js 已要求 Node.js 20+）
6. **重复注册防护**：已在 `registerESMLoader` 中添加 `esmLoaderRegistered` 标志

---

## 替代方案

如果此方案不工作，可以考虑：

1. **方案 A**：使用 `tsx` 或 `ts-node` 的 `--transpileOnly` 模式
2. **方案 B**：切换到 CJS 模式进行开发（临时方案）
3. **方案 C**：使用 Vite 的开发服务器模式

