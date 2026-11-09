---
name: modernjs-resource-stages
description: 分析并调整 Modern.js 应用的按阶段加载声明（stagedImport / performance.resourceStages）。读构建产出的 dist/resource-stages.json 和页面上的加载记录，算每个声明的命中率和提前量，给出升阶段、降阶段、去掉或补声明的建议，确认后修改代码。在「接入按阶段加载」「预加载效果复核」「首屏 chunk 太晚或太多」时使用。
---

# Modern.js 按阶段加载分析

框架提供两份数据，本 skill 负责判断「值不值得预加载」并改声明。

| 数据 | 来源 | 内容 |
| --- | --- | --- |
| 阶段清单 | 构建产物 `dist/resource-stages.json` | 每个声明的文件、体积、归属（入口级或路由），各阶段的字节数、请求数、依赖深度、预计下载时间 |
| 加载记录 | 页面上 `window.__MODERN_RS__.report()`，或业务通过 `onResourceStageReport` 上报的数据 | 每个阶段到来的时间；每个 chunk 的阶段、预取开始/结束、应用请求/加载完成的时间 |

时间都是距导航开始的毫秒数。

## 步骤

### 1. 构建并取阶段清单

```bash
npx modern build   # EdenX 应用用 npx edenx build
ls dist/resource-stages.json
```

构建告警里带 `[resource stages]` 的条目一并记下：超预算、重复模块、清单外置、`import()` 没拆出 chunk。

### 2. 取加载记录

**本地**：起服务后用无头浏览器按真实操作路径走一遍（首页打开、输入、发送……），每走完一条路径读一次记录：

```js
// puppeteer / playwright 里
const report = await page.evaluate(() => window.__MODERN_RS__.report());
```

把多次结果存成 JSON 数组（`records.json`）。网络条件和目标用户一致时数据才有意义，建议按 `performance.resourceStages.targetNetwork` 限速。

**线上**：业务用 `onResourceStageReport` 上报到监控平台后，导出成同样格式的 JSON 数组。

### 3. 计算

```bash
node scripts/analyze.mjs dist/resource-stages.json records.json
```

输出每个声明：

- **命中率**：预取了的 chunk 里，本次访问被应用请求的比例；
- **提前量**：应用请求时间 − 预取完成时间。负数表示请求时还没下完；
- **晚到率**：被请求时预取还没完成的比例；
- **未声明的早请求**：没有声明、但在 `interactive` 之前就被请求的 chunk。

### 4. 给建议

| 情况 | 建议 |
| --- | --- |
| 命中率 < 20% | 降一个阶段，或去掉声明（元素阶段更合适时改为 `viewport` / `interaction`） |
| 晚到率 > 50% 且提前量中位数 < 0 | 升一个阶段；已经是 `visible` 且在首屏路径上的，考虑 `critical`，但要看 `critical` 预算 |
| 未声明的早请求 | 找到产生该 chunk 的 `import()`，补声明 |
| 构建告警超预算 | 先降低声明数量，再考虑调整预算 |
| 重复模块告警 | 同一模块被打进不同阶段的 chunk，检查 chunk 拆分或合并声明 |

`critical` 只用于首屏必需的文件：preload 的文件 3 秒内没用到浏览器会告警，写多了会和入口 JS 抢带宽。

### 5. 修改

把建议列给研发确认后，再改 `stagedImport.<阶段>(...)` 的阶段名。改完重新构建，对比 `dist/resource-stages.json` 的各阶段统计（可以把旧文件配置为 `performance.resourceStages.baseline`）。
