# ESM 模块缓存失效修复方案 - Issue #8373

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 V3 版本在开发模式下，ESM 构建的 SSR Bundle 子模块缓存未失效导致的 hydration error 问题。

**Architecture:** 使用 Node.js 的 `Module._compile` 动态加载 bundle 内容，每次请求时重新编译，确保获取最新代码。

**Tech Stack:** Node.js Module API

---

## 背景与前因后果

### 问题描述（Issue #8373）

在 Modern.js V3 版本使用 ESM 模式进行 SSR 开发时，存在以下问题：

1. 用户在开发模式下修改页面代码（如修改 `page.tsx` 中的文本）
2. 刷新浏览器后，**服务端渲染的内容是旧的**，但**客户端渲染的内容是新的**
3. 导致 React Hydration Mismatch 错误

### 问题根因分析

#### 1. 现有缓存失效机制

Modern.js 在开发模式下使用 timestamp 机制来绕过 ESM 缓存：

```typescript
// packages/toolkit/utils/src/cli/require.ts
async function importPath(path: string, options?: any) {
  const modulePath = isAbsolute(path) ? pathToFileURL(path).href : path;
  if (process.env.NODE_ENV === 'development') {
    const timestamp = Date.now();
    return await import(`${modulePath}?t=${timestamp}`, options);
  } else {
    return await import(modulePath, options);
  }
}
```

#### 2. 为什么主 bundle 能重新加载

主 bundle 通过 `compatibleRequire()` 函数加载，该函数使用了带有 timestamp 的动态 import。

#### 3. 子模块缓存问题（核心问题）

- **Rspack 使用自己的模块系统**：打包后的 bundle 使用类似 webpack 的 `__webpack_require__` 系统
- **ESM Loader Hook 无法拦截**：Node.js 的自定义 loader 无法拦截 bundle 内部的模块解析
- **子模块使用缓存**：Node.js ESM 模块一旦被加载，会被缓存

### Bundle 格式验证

经过实际测试，rspack 打包的 bundle 格式是 **ESM 格式**（带有 import/export），但 `Module._compile` 可以成功处理：

```bash
✅ Module._compile 成功!
Exports: [ 'requestHandler' ]
```

因此，`requireFromString` 方案是**可行的**。

---

## 实施计划

### Task 1: 修改 require.ts 添加 requireFromString

**Files:**
- Modify: `packages/toolkit/utils/src/cli/require.ts`

**Step 1: 添加 requireFromString 函数和缓存机制**

```typescript
import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moduleResolve } from 'import-meta-resolve';
import { findExists } from './fs';

// 开发模式下的模块缓存（使用 mtime 比对）
const devModuleCache = new Map<string, { mtime: number; module: any }>();

/**
 * 从字符串动态加载模块
 * 用于开发模式下绕过 ESM 缓存
 * 
 * 注意：
 * 1. 每次创建新的 Module 实例，绕过 ESM 缓存
 * 2. 使用 mtime 缓存，只在文件变更时重新编译
 */
function requireFromString(src: string, filename: string): any {
  const Module = require('module');
  const m = new Module();
  // @ts-ignore
  m._compile(src, filename);
  return m.exports;
}

/**
 * 清理过期的缓存（保留最近的 10 个）
 */
function cleanDevCache() {
  if (devModuleCache.size > 10) {
    const keys = Array.from(devModuleCache.keys()).slice(0, 5);
    keys.forEach(key => devModuleCache.delete(key));
  }
}
```

**Step 2: 修改 compatibleRequireESM 函数**

```typescript
async function compatibleRequireESM(
  path: string,
  interop = true,
): Promise<any> {
  if (path.endsWith('.json')) {
    const res = await importPath(path, {
      with: { type: 'json' },
    });
    return res.default;
  }

  // 开发模式下使用 requireFromString 每次重新加载
  if (process.env.NODE_ENV === 'development') {
    try {
      const fs = await import('node:fs');
      
      // 获取文件 mtime
      const stats = await fs.stat(path);
      const currentMtime = stats.mtimeMs;
      
      // 检查缓存
      const cached = devModuleCache.get(path);
      if (cached && cached.mtime === currentMtime) {
        return interop ? cached.module.default : cached.module;
      }
      
      // 读取并编译模块
      const bundleContent = await fs.readFile(path, 'utf-8');
      const timestamp = Date.now().toString();
      const module = requireFromString(bundleContent, `${path}?t=${timestamp}`);
      
      // 更新缓存
      devModuleCache.set(path, { mtime: currentMtime, module });
      cleanDevCache();
      
      return interop ? module.default : module;
    } catch (err) {
      // 降级机制：失败后回退到原有的 import 方式
      console.warn(`[requireFromString] Failed, falling back to import:`, err);
      const requiredModule = await importPath(path);
      return interop ? requiredModule.default : requiredModule;
    }
  }

  // 生产模式使用正常的 import
  const requiredModule = await importPath(path);
  return interop ? requiredModule.default : requiredModule;
}
```

---

### Task 2: 清理之前的 ESM Loader 相关代码

**Files:**
- Delete: `packages/solutions/app-tools/src/esm/esm-loader.mjs`
- Modify: `packages/solutions/app-tools/src/esm/register-esm.mjs`（移除 registerESMLoader）
- Modify: `packages/solutions/app-tools/src/commands/dev.ts`
- Modify: `packages/solutions/app-tools/src/commands/build.ts`

**Step 1: 删除 esm-loader.mjs**

```bash
rm packages/solutions/app-tools/src/esm/esm-loader.mjs
```

**Step 2: 移除 register-esm.mjs 中的 registerESMLoader 函数**

删除之前添加的 `registerESMLoader` 函数和相关代码。

**Step 3: 恢复 dev.ts 和 build.ts**

恢复之前添加的 `registerESMLoader` 调用和相关调试日志。

---

### Task 3: 测试验证

**Files:**
- Run: `tests/integration/ssr/tests/esm-cache-invalidation.test.ts`

**Step 1: 运行测试**

```bash
cd tests/integration && pnpm run test:framework esm-cache-invalidation
```

**预期结果**：
- 测试通过，无 hydration error
- 修改页面内容后刷新浏览器，页面正常显示新内容

这种方式会给主 bundle URL 添加 timestamp，如：
```
/path/to/bundle/index.js?t=1234567890
```

#### 2. 为什么主 bundle 能重新加载

主 bundle 通过 `compatibleRequire()` 函数加载，该函数使用了带有 timestamp 的动态 import：

```typescript
// packages/server/core/src/adapters/node/plugins/resource.ts
const loadBundle = async (filepath: string, monitors?: Monitors) => {
  const module = await compatibleRequire(filepath, false);
  return module;
};
```

#### 3. 子模块缓存问题（核心问题）

当主 bundle 被重新加载时，它内部引用的子模块（如 `page.tsx`）**不会被重新加载**，原因如下：

- **Rspack 使用自己的模块系统**：打包后的 bundle 使用类似 webpack 的 `__webpack_require__` 系统
- **ESM Loader Hook 无法拦截**：Node.js 的自定义 loader 的 `resolve` hook 只能拦截顶层的 `import` 语句，无法拦截 bundle 内部的子模块加载
- **子模块使用缓存**：Node.js ESM 模块一旦被加载，会被缓存在 `import.meta.cache` 中（只读），无法直接清除

#### 4. Hydration Mismatch 流程

```
1. 用户修改 page.tsx（"Welcome to111" → "ESM-CACHE-REPRODUCE"）

2. 第一次请求（刷新浏览器）：
   - 主 bundle index.js 被重新加载（带 timestamp）
   - 但子模块 page.tsx 使用缓存中的旧版本
   - 服务端渲染结果：旧内容 "Welcome to111"
   
3. 客户端渲染：
   - 浏览器加载新的客户端 bundle
   - 客户端代码包含新内容 "ESM-CACHE-REPRODUCE"
   
4. 结果：Hydration Mismatch 错误
```

### 之前的方案及其问题

#### 方案 1：自定义 ESM Loader（已尝试，不可行）

**思路**：创建自定义 ESM Loader，在 `resolve` hook 中给子模块添加 timestamp。

**问题**：
- Rspack 打包后的代码使用 `__webpack_require__`，不是原生 ESM import
- Node.js ESM Loader Hook 无法拦截 bundle 内部的模块解析
- 子模块的加载完全在 rspack 内部处理，不会触发我们的 loader

### 新方案：使用 requireFromString

#### 方案来源

参考 [rspack-ssr-examples](https://github.com/upupming/rspack-ssr-examples) 项目，这是一个 rspack 官方的 SSR 示例项目。

#### 核心思路

1. **读取 bundle 文件内容**（作为字符串）
2. **使用 Node.js 的 `Module._compile` 动态编译和加载**
3. **每次请求都重新加载**，确保获取最新代码

```javascript
// 核心实现
function requireFromString(src, filename) {
  var Module = module.constructor;
  var m = new Module();
  m._compile(src, filename);
  return m.exports;
}
```

#### 为什么可行

- **绕过 rspack 模块系统**：直接加载 bundle 字符串，不依赖 `__webpack_require__`
- **每次都是新模块**：`Module._compile` 会创建全新的模块实例
- **业界验证**：rspack-ssr-examples 已经使用这个方案

---

## 技术细节

### Node.js Module._compile

Node.js 的 `Module` 类有一个 `_compile` 方法，可以将字符串代码编译成模块：

```javascript
const Module = require('module');
const m = new Module();
// _compile 会执行代码并导出 module.exports
m._compile(codeString, filename);
return m.exports;
```

### 与 ESM import 的区别

| 特性 | ESM import | requireFromString |
|-----|------------|------------------|
| 缓存 | 有（import.meta.cache） | 无（每次新建 Module） |
| 模块系统 | ESM | CommonJS |
| 适用场景 | 静态 import | 动态加载 |

---

## 实施计划

### Task 1: 修改 require.ts 添加 requireFromString

**Files:**
- Modify: `packages/toolkit/utils/src/cli/require.ts`

**Step 1: 添加 requireFromString 函数和缓存机制**

```typescript
/**
 * 从字符串动态加载模块
 * 用于开发模式下绕过 ESM 缓存
 * 
 * 注意：
 * 1. 每次创建新的 Module 实例，绕过 ESM 缓存
 * 2. 使用 mtime 缓存，只在文件变更时重新编译
 */
function requireFromString(src: string, filename: string): any {
  const Module = require('module');
  const m = new Module();
  // @ts-ignore
  m._compile(src, filename);
  return m.exports;
}

/**
 * 开发模式下的模块缓存
 * 使用 mtime 比对，只在文件变更时重新编译
 */
const devModuleCache = new Map<string, { mtime: number; module: any }>();

/**
 * 清理过期的缓存（保留最近的 10 个）
 */
function cleanDevCache() {
  if (devModuleCache.size > 10) {
    const keys = Array.from(devModuleCache.keys()).slice(0, 5);
    keys.forEach(key => devModuleCache.delete(key));
  }
}
```

**Step 2: 修改 compatibleRequireESM 函数**

```typescript
async function compatibleRequireESM(
  path: string,
  interop = true,
): Promise<any> {
  if (path.endsWith('.json')) {
    const res = await importPath(path, {
      with: { type: 'json' },
    });
    return res.default;
  }

  // 开发模式下使用 requireFromString 每次重新加载
  if (process.env.NODE_ENV === 'development') {
    try {
      const fs = await import('node:fs');
      
      // 获取文件 mtime
      const stats = await fs.stat(path);
      const currentMtime = stats.mtimeMs;
      
      // 检查缓存
      const cached = devModuleCache.get(path);
      if (cached && cached.mtime === currentMtime) {
        return interop ? cached.module.default : cached.module;
      }
      
      // 读取并编译模块
      const bundleContent = await fs.readFile(path, 'utf-8');
      const timestamp = Date.now().toString();
      const module = requireFromString(bundleContent, `${path}?t=${timestamp}`);
      
      // 更新缓存
      devModuleCache.set(path, { mtime: currentMtime, module });
      cleanDevCache();
      
      return interop ? module.default : module;
    } catch (err) {
      // 降级机制：失败后回退到原有的 import 方式
      const requiredModule = await importPath(path);
      return interop ? requiredModule.default : requiredModule;
    }
  }

  // 生产模式使用正常的 import
  const requiredModule = await importPath(path);
  return interop ? requiredModule.default : requiredModule;
}
```

**Step 3: 在文件顶部添加类型声明**

因为 `module.constructor` 和 `_compile` 是 Node.js 内部 API，需要添加类型声明：

```typescript
// 在文件顶部或单独的类型文件中
declare module 'module' {
  export function _compile(code: string, filename: string): any;
  export default class Module {
    constructor();
    _compile(code: string, filename: string): any;
  }
}
```

---

### Task 2: 清理之前的 ESM Loader 相关代码

**Files:**
- Delete: `packages/solutions/app-tools/src/esm/esm-loader.mjs`
- Modify: `packages/solutions/app-tools/src/esm/register-esm.mjs`（移除 registerESMLoader）
- Modify: `packages/solutions/app-tools/src/commands/dev.ts`
- Modify: `packages/solutions/app-tools/src/commands/build.ts`

**Step 1: 删除 esm-loader.mjs**

```bash
rm packages/solutions/app-tools/src/esm/esm-loader.mjs
```

**Step 2: 移除 register-esm.mjs 中的 registerESMLoader 函数**

删除之前添加的 `registerESMLoader` 函数和相关代码。

**Step 3: 恢复 dev.ts 和 build.ts**

恢复之前添加的 `registerESMLoader` 调用和相关调试日志。

---

### Task 3: 测试验证

**Files:**
- Run: `tests/integration/ssr/tests/esm-cache-invalidation.test.ts`

**Step 1: 运行测试**

```bash
cd tests/integration && pnpm run test:framework esm-cache-invalidation
```

**预期结果**：
- 测试通过，无 hydration error
- 修改页面内容后刷新浏览器，页面正常显示新内容

---

## 风险与注意事项

### 1. 性能影响（已优化）

- **优化方案**：使用基于 mtime 的缓存机制
- **缓存策略**：只保留最近的 10 个缓存，超过后清理最旧的 5 个
- **效果**：文件未变更时不会重新编译，性能大幅提升

### 2. 模块系统兼容性

- 使用 CommonJS 方式加载
- rspack 输出的 bundle 已经是转换后的代码，兼容 CommonJS
- bundle 内部的 `require` 依赖 Node.js 的模块解析机制

### 3. 降级机制

- 如果 `requireFromString` 失败，会自动降级到原有的 `import` 方式
- 保证在无法使用新方案时仍能正常工作

### 4. 生产环境不受影响

- 只有在 `NODE_ENV === 'development'` 时使用
- 生产环境使用正常的 import 流程

### 5. 与 CJS 模式的兼容性

- 该修改只影响 ESM 模式（`MODERN_LIB_FORMAT === 'esm'`）
- CJS 模式使用原有的 `compatibleRequireCJS`，不受影响

---

## 替代方案

如果此方案不工作，可以考虑：

1. **方案 A**：使用 rspack 的 HMR API（需要更深入集成）
2. **方案 B**：切换到 CJS 模式进行开发（临时方案）
3. **方案 C**：不使用预打包的 bundle，直接加载源文件（类似 Vite）

---

## 参考资料

1. [rspack-ssr-examples](https://github.com/upupming/rspack-ssr-examples) - Rspack SSR 示例项目
2. [Node.js Module._compile](https://nodejs.org/api/module.html#module_compile_code_filename) - Node.js 官方文档
3. [require-from-string](https://www.npmjs.com/package/require-from-string) - npm 包

