#!/usr/bin/env node
// 扫描一个 Modern.js 项目：判定是否 v3、按能力矩阵列出可启用功能及其自动化级别与当前状态。
//   node scripts/scan.mjs <projectDir>
// 产出 <projectDir>/.agents/runs/modernjs-feature-enable/context.json

import fs from 'node:fs';
import path from 'node:path';
import {
  DEPRECATED,
  TIER_LABEL,
  classifyProject,
  exists,
  featureMatrix,
  findConfigFile,
  readText,
} from './lib.mjs';

function fail(msg) {
  console.error(`scan failed: ${msg}`);
  process.exit(1);
}

function main() {
  const dir = path.resolve(process.argv[2] || '.');
  if (!exists(dir, 'package.json')) fail(`缺少 package.json: ${dir}`);
  // 统一用 classifyProject：semver 2.x、或 workspace/link 等非语义协议且命中 v2-only 信号 → 判 v2 阻断
  const cls = classifyProject(dir);
  if (cls.state !== 'v3') fail(cls.reason);
  const appTools = cls.appTools;

  const configFile = findConfigFile(dir);
  const matrix = featureMatrix(dir);

  const context = {
    projectDir: dir,
    modernVersion: appTools,
    migrationState: 'v3',
    configFile,
    // 能力矩阵：每个功能带 tier（auto/scaffold/manual）+ enabled（true/false/'unknown'）
    features: Object.fromEntries(
      matrix.map(f => [
        f.key,
        { label: f.label, tier: f.tier, enabled: f.enabled, doc: f.doc },
      ]),
    ),
    deprecated: DEPRECATED,
  };
  const outDir = path.join(dir, '.agents', 'runs', 'modernjs-feature-enable');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'context.json'),
    `${JSON.stringify(context, null, 2)}\n`,
  );

  console.log(`projectDir: ${dir}`);
  console.log(`modern: ${appTools} (v3)`);
  console.log(
    '\nModern.js v3 能力矩阵（不是「只有这些功能」，而是按自动化级别分层）：',
  );
  for (const tier of ['auto', 'scaffold', 'manual']) {
    const items = matrix.filter(f => f.tier === tier);
    if (!items.length) continue;
    console.log(`\n[${TIER_LABEL[tier]}]`);
    for (const f of items) {
      const status =
        f.enabled === true
          ? '已启用'
          : f.enabled === 'partial'
            ? '部分（骨架就绪，CSS/语义接入待完成）'
            : f.enabled === 'unknown'
              ? '状态需人工确认'
              : '未启用';
      const how =
        f.tier === 'auto'
          ? `enable.mjs ${f.key}`
          : f.tier === 'scaffold'
            ? `enable.mjs ${f.key}（骨架自动 + 语义人工）`
            : `enable.mjs ${f.key}（输出 checklist）`;
      console.log(`  - ${f.key}（${f.label}）：${status} —— ${how}`);
    }
  }
  console.log(
    `\n说明：Less/Sass 默认支持、Data Loader/SSR/RSC 是约定或配置，不属于「启用插件」，故不在本矩阵。`,
  );
  console.log(
    `⚠️ 废弃命令（勿引导用户使用）：${DEPRECATED.removedCommands.join(' / ')} 已在 v3 移除（${DEPRECATED.evidence}）`,
  );
}

main();
