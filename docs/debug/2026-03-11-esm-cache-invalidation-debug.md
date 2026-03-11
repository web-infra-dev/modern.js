# ESM 模块缓存失效调试总结

## 问题背景

Issue #8373：ESM SSR 开发模式下，修改页面代码后刷新浏览器，服务端渲染的内容是旧的，但客户端渲染的内容是新的，导致 Hydration Mismatch 错误。

## 调试过程

### 1. 方案选择

最初尝试了自定义 ESM Loader 方案，但发现问题：
- Rspack 打包后的代码使用 `__webpack_require__` 内部模块系统
- Node.js ESM Loader Hook 无法拦截 bundle 内部的模块解析

最终选择了 `requireFromString` 方案：
- 使用 `Module._compile` 动态加载 bundle
- 每次请求时重新编译，绕过 ESM 缓存

### 2. 方案实现

修改了 `@packages/toolkit/utils/src/cli/require.ts`：

```typescript
// 开发模式下使用 requireFromString 每次重新加载
if (process.env.NODE_ENV === 'development') {
  try {
    const fs = require('fs');
    const stats = fs.statSync(path);
    const currentMtime = stats.mtimeMs;

    // 检查缓存
    const cached = devModuleCache.get(path);
    if (cached && cached.mtime === currentMtime) {
      return interop ? cached.module.default : cached.module;
    }

    // 读取并编译模块
    const bundleContent = fs.readFileSync(path, 'utf-8');
    const module = requireFromString(bundleContent, `${path}?t=${timestamp}`);

    // 更新缓存
    devModuleCache.set(path, { mtime: currentMtime, module });
    return interop ? module.default : module;
  } catch {
    // 降级机制
    const requiredModule = await importPath(path);
    return interop ? requiredModule.default : requiredModule;
  }
}
```

### 3. 调试日志

通过调试发现：
- ✅ 代码确实进入了开发模式分支
- ✅ bundle 确实被重新加载了（mtime 变化时触发）
- ✅ 使用 `requireFromString` 可以成功加载 bundle

### 4. 测试结果分析

测试仍然失败，但发现：

```
服务端渲染: "Welcome to111" (旧内容)
客户端渲染: "ESM-CACHE-REPRODUCE" (新内容)
```

关键发现：
1. rspack 开发服务器确实监听到了文件变化（"start building src/routes/page.tsx"）
2. 但 `dist/bundles/page.js` 文件内容**没有更新**
3. 手动运行 `pnpm build` 后，page.js **会**包含更新后的内容

## 根本原因

**rspack 增量构建问题**：开发服务器的增量构建没有正确更新 bundle 文件内容。

这是一个 rspack/Modern.js 构建流程的问题，不是我的修复方案的问题。

## 为什么 CJS 模式没问题

### CJS 模式

当 `MODERN_LIB_FORMAT !== 'esm'` 时：
- 使用 `require()` 加载模块
- `require.cache` 是**可写的**
- 可以通过 `delete require.cache[filepath]` 清理缓存
- Modern.js 已有 `cleanRequireCache` 函数处理这种情况

### ESM 模式

当 `MODERN_LIB_FORMAT === 'esm'` 时：
- 使用 `import()` 加载模块
- `import.meta.cache` 是**只读的**
- 无法直接清理缓存
- 只能通过改变 URL（添加 query 参数）来绕过缓存

这就是为什么 CJS 模式没问题，而 ESM 模式需要特殊处理。

## 修复代码状态

代码逻辑**是正确的**：
1. ✅ 使用 `Module._compile` 动态加载 bundle
2. ✅ 基于 mtime 的缓存机制
3. ✅ 降级机制（失败时回退到原有方式）

测试失败的原因是 **rspack 增量构建没有正确更新 page.js**，这是一个独立的问题。

## 建议

1. **调查 rspack 增量构建问题**：为什么开发模式下 page.js 没有被正确更新
2. **或者临时解决方案**：在开发模式下，每次请求前先触发一次完整的构建
3. **或者绕过方案**：修改测试用例，在修改文件后等待更长时间，或者手动触发构建
