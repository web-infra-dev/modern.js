#!/usr/bin/env node
// modernjs-migrate-to-v3 — 扫描 v2 项目，产出 context.json + 迁移清单。
//
// 用法：node scan.mjs [target-dir] [--write] [--json]
//   默认 dry-run：只扫描 + 写 context.json + 打印清单，不改代码。
//   --write：仅应用**唯一无歧义的安全改写**（import 路径映射），其余仍交人工/guided。
//
// 安全：除 import 路径映射外不自动改任何东西；不碰 lockfile/dist/node_modules。

import fs from 'node:fs';
import path from 'node:path';

const SRC_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP = new Set([
  'node_modules',
  'dist',
  'dist-ssg',
  'output',
  'build',
  'coverage',
  '.git',
  '.agents',
  '.claude',
  '.cursor',
]);

// 唯一安全 codemod：import 路径映射（specifier 唯一，纯替换安全）
const IMPORT_MAP = [
  ['@modern-js/runtime/bff', '@modern-js/plugin-bff/runtime'],
  ['@modern-js/runtime/server', '@modern-js/server-runtime'],
];

function parseArgs(argv) {
  const rest = argv.slice(2);
  return {
    dir: path.resolve(rest.find(a => !a.startsWith('--')) || '.'),
    write: rest.includes('--write'),
    json: rest.includes('--json'),
  };
}

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) walk(path.join(dir, e.name), files);
    } else if (SRC_EXT.has(path.extname(e.name))) {
      files.push(path.join(dir, e.name));
    }
  }
  return files;
}

const exists = (...p) => fs.existsSync(path.join(...p));

function main() {
  const { dir, write, json } = parseArgs(process.argv);
  if (!exists(dir, 'package.json')) {
    console.error(`未找到 package.json: ${dir}`);
    process.exit(1);
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'),
  );
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const modernDeps = Object.fromEntries(
    Object.entries(allDeps).filter(([n]) => n.startsWith('@modern-js/')),
  );

  const src = path.join(dir, 'src');
  // 扫整个项目（排除 node_modules/dist 等），覆盖 src/ server/ config/ 与根配置
  const files = walk(dir);
  const read = f => fs.readFileSync(f, 'utf-8');
  const rel = f => path.relative(dir, f);

  // 按信号收集命中文件
  const hits = sig => files.filter(f => sig.test(read(f))).map(rel);

  const findings = [];
  const add = (id, category, what, where, action) => {
    if (where === true || (Array.isArray(where) && where.length)) {
      findings.push({
        id,
        category,
        what,
        where: where === true ? [] : where,
        action,
      });
    }
  };

  // 入口
  const entryType = exists(src, 'routes')
    ? 'routes(约定式)'
    : exists(src, 'App.tsx') || exists(src, 'App.jsx')
      ? 'App(自控式)'
      : exists(src, 'index.tsx') || exists(src, 'index.jsx')
        ? 'index(自定义,v2)'
        : exists(src, 'entry.tsx') || exists(src, 'entry.jsx')
          ? 'entry(自定义,v3)'
          : 'unknown';

  // 安全
  const importHits = hits(/@modern-js\/runtime\/(bff|server)\b/);
  add(
    'import-path-map',
    'auto',
    'import 路径映射 @modern-js/runtime/{bff,server}',
    importHits,
    '替换为 plugin-bff/runtime、server-runtime（--write 可自动）',
  );
  add(
    'dev-port',
    'auto',
    'modern.config 中 dev.port',
    hits(/\bdev\s*:\s*{[\s\S]*?\bport\b/),
    '改为 server.port',
  );
  add(
    'tailwind-plugin',
    'auto',
    '@modern-js/plugin-tailwindcss',
    hits(/@modern-js\/plugin-tailwindcss/),
    '移除插件，改 Rsbuild 原生 + postcss.config.cjs + @tailwind 指令',
  );
  add(
    'ssr-mode',
    'auto',
    'SSR mode 默认 string→stream',
    hits(/\bssr\b/),
    '确认 mode；React17 项目手动设回 "string"',
  );
  add(
    'app-icon',
    'manual',
    'html.appIcon 字符串形式',
    hits(/appIcon\s*:\s*['"]/),
    '改为对象 { icons:[{src,size}] }',
  );

  // 半自动
  add(
    'pages-to-routes',
    'semi',
    'src/pages 约定式路由（v3 不支持）',
    exists(src, 'pages') ? [rel(path.join(src, 'pages'))] : [],
    '简单结构重命名为 src/routes + 改引用；复杂动态路由进人工',
  );
  add(
    'custom-entry',
    'semi',
    `自定义入口 index.tsx（当前入口类型：${entryType}）`,
    entryType.includes('index') ? [src] : [],
    'index.tsx→entry.tsx；bootstrap 函数→createRoot()+render()',
  );
  add(
    'app-config-init',
    'semi',
    'App.config / App.init',
    hits(/\bApp\.(config|init)\b/),
    '迁到 src/modern.runtime.ts（defineRuntimeConfig / 运行时插件）',
  );
  add(
    'layout-config-init',
    'semi',
    'routes/layout 的 config/init 导出',
    hits(/export\s+const\s+(config|init)\b/),
    '迁到 modern.runtime.ts，删除 layout 导出',
  );
  add(
    'use-runtime-context',
    'semi',
    'useRuntimeContext()',
    hits(/\buseRuntimeContext\b/),
    '改为 use(RuntimeContext)；isBrowser 移到顶层',
  );

  // 人工
  add(
    'custom-server',
    'manual',
    '自定义 Web Server / unstableMiddleware',
    exists(dir, 'server', 'index.ts') || hits(/\bunstableMiddleware\b/).length
      ? [
          ...(exists(dir, 'server', 'index.ts') ? ['server/index.ts'] : []),
          ...hits(/\bunstableMiddleware\b/),
        ]
      : [],
    'server/index.ts→modern.server.ts + Hono Context + 必须 next()（语义变化大，人工）',
  );
  add(
    'webpack-config',
    'manual',
    'webpack 自定义配置/插件',
    hits(/\bwebpack\b/),
    '改用 Rspack 对应项，确认自定义插件兼容',
  );

  const order = { auto: 0, semi: 1, manual: 2 };
  findings.sort((a, b) => order[a.category] - order[b.category]);

  // 安全 codemod（--write）
  const rewritten = [];
  if (write) {
    for (const f of files) {
      let code = read(f);
      let changed = false;
      for (const [from, to] of IMPORT_MAP) {
        if (code.includes(from)) {
          code = code.split(from).join(to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(f, code);
        rewritten.push(rel(f));
      }
    }
  }

  const context = {
    target: dir,
    package: pkg.name || '(unnamed)',
    scannedFiles: files.length,
    modernDeps,
    entryType,
    findings,
    summary: {
      auto: findings.filter(f => f.category === 'auto').length,
      semi: findings.filter(f => f.category === 'semi').length,
      manual: findings.filter(f => f.category === 'manual').length,
    },
    applied: write ? { importPathMap: rewritten } : null,
    stamp: new Date().toISOString(),
  };

  const outDir = path.join(dir, '.agents', 'runs', 'modernjs-migrate');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'context.json');
  fs.writeFileSync(outPath, `${JSON.stringify(context, null, 2)}\n`);

  if (json) {
    console.log(JSON.stringify(context, null, 2));
    return;
  }

  console.log(`🚚 Modern.js v2→v3 迁移扫描：${context.package}`);
  console.log(
    `   入口类型：${entryType}   源文件：${files.length}   @modern-js 包：${Object.keys(modernDeps).length}`,
  );
  const label = { auto: '🟢 自动', semi: '🟡 半自动', manual: '🔴 人工' };
  for (const f of findings) {
    console.log(`\n${label[f.category]}  ${f.what}`);
    console.log(`   → ${f.action}`);
    if (f.where.length) {
      for (const w of f.where.slice(0, 5)) console.log(`     ${w}`);
      if (f.where.length > 5)
        console.log(`     …(+${f.where.length - 5} more)`);
    }
  }
  console.log(
    `\n小结：自动 ${context.summary.auto} / 半自动 ${context.summary.semi} / 人工 ${context.summary.manual}`,
  );
  if (write) {
    console.log(
      `\n✍️  已应用安全改写（import 路径映射）：${rewritten.length} 个文件`,
    );
  } else {
    console.log(
      '\n（dry-run：未改代码。加 --write 应用唯一安全改写=import 路径映射）',
    );
  }
  console.log(`\ncontext.json → ${rel(outPath)}`);
  console.log(
    '下一步：按分类分批迁移，每批跑 install/build/test；细节见 references/v2-to-v3.md。',
  );
}

main();
