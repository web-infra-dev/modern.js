#!/usr/bin/env node
// 扫描一个 Modern.js 项目，判定可迁移性并产出迁移上下文。
//   node scripts/scan-project.mjs <projectDir>
// 产出 <projectDir>/.agents/runs/modernjs-migrate/context.json
//
// 规则：调用方显式传入 projectDir；脚本只校验该目录，不向上猜测。
// 仅识别信号、不改代码。阻断条件（非 v2/v3、Node 过低）直接失败并说明原因。

import fs from 'node:fs';
import path from 'node:path';

const MIN_NODE = [18, 20, 8];
const SRC_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORED = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.agents',
  'coverage',
]);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}
const readText = file => {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
};
const exists = (...p) => fs.existsSync(path.join(...p));
const hasAny = (dir, basename) =>
  ['tsx', 'jsx', 'ts', 'js'].some(ext => exists(dir, `${basename}.${ext}`));

// 把注释和字符串内容替换为等长空白（保留换行、引号、长度），用于结构/标识符信号匹配——
// 普通字符串里的 runtime/appTools({bundler})/applyBaseConfig 不应被当作 v2 信号。
function maskCommentsAndStrings(code) {
  let out = '';
  const n = code.length;
  let i = 0;
  while (i < n) {
    const c = code[i];
    const c2 = code[i + 1];
    if (c === '/' && c2 === '/') {
      out += '  ';
      i += 2;
      while (i < n && code[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }
    if (c === '/' && c2 === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) {
        out += code[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      if (i < n) {
        out += '  ';
        i += 2;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      out += c;
      i += 1;
      while (i < n && code[i] !== quote) {
        if (code[i] === '\\') {
          out += '  ';
          i += 2;
          continue;
        }
        out += code[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      if (i < n) {
        out += quote;
        i += 1;
      }
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

// 提取真正的模块 specifier（from/import/require 后的字符串），避免在普通字符串里裸搜包名。
function importSpecifiers(code) {
  const specs = [];
  const n = code.length;
  let i = 0;
  let acc = '';
  while (i < n) {
    const c = code[i];
    const c2 = code[i + 1];
    if (c === '/' && c2 === '/') {
      while (i < n && code[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let j = i + 1;
      let content = '';
      while (j < n && code[j] !== quote) {
        if (code[j] === '\\') {
          content += code[j + 1] ?? '';
          j += 2;
          continue;
        }
        content += code[j];
        j += 1;
      }
      if (/(?:\bfrom|\bimport|\brequire\s*\(|\bimport\s*\()\s*$/.test(acc)) {
        specs.push(content);
      }
      i = j + 1;
      acc = '';
      continue;
    }
    acc += c;
    if (acc.length > 32) acc = acc.slice(-32);
    i += 1;
  }
  return specs;
}
const majorOf = v => {
  const m = String(v ?? '').match(/(\d+)/);
  return m ? Number(m[1]) : null;
};
function parseVersion(raw) {
  const m = String(raw ?? '')
    .replace(/^v/, '')
    .match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  return m ? [Number(m[1] ?? 0), Number(m[2] ?? 0), Number(m[3] ?? 0)] : null;
}
const cmp = (a, b) => {
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) - (b[i] ?? 0);
  }
  return 0;
};

function collectSources(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORED.has(e.name)) collectSources(full, files);
    } else if (SRC_EXT.has(path.extname(e.name)) && !e.name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
  return files;
}

function fail(reasons) {
  throw new Error(
    ['scan-project failed:', ...reasons.map(r => `- ${r}`)].join('\n'),
  );
}

function detectConfigFile(dir) {
  for (const f of [
    'modern.config.ts',
    'modern.config.js',
    'modern.config.mjs',
  ]) {
    if (exists(dir, f)) return f;
  }
  return null;
}

// src/pages 约定式路由（v3 不支持），无同级 App.tsx / routes 时判定需迁移
function hasPagesDir(dir) {
  const src = path.join(dir, 'src');
  return (
    exists(src, 'pages') &&
    !exists(src, 'routes') &&
    !exists(src, 'App.tsx') &&
    !exists(src, 'App.jsx')
  );
}

function main() {
  const projectDir = path.resolve(process.argv[2] ?? process.cwd());
  if (!exists(projectDir, 'package.json')) {
    fail([`传入目录不是合法 projectDir：${projectDir}（缺少 package.json）`]);
  }
  const pkg = readJson(path.join(projectDir, 'package.json'));
  if (!pkg) fail(['package.json 解析失败']);

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
  const appToolsVersion = deps['@modern-js/app-tools'] ?? null;
  const appToolsMajor = majorOf(appToolsVersion);
  // monorepo 协议（workspace:* / link: / catalog: / * 等）无法解析出主版本号，
  // 但仍是 Modern.js 项目（v2 分支 integration fixture 即如此），不应阻断
  const WORKSPACE_PROTO = /^(workspace:|link:|file:|catalog:|portal:|npm:|\*$)/;
  const isWorkspaceVersion =
    appToolsVersion != null &&
    WORKSPACE_PROTO.test(String(appToolsVersion).trim());
  const configFile = detectConfigFile(projectDir);
  // 结构/标识符特征与信号：剥离注释**和字符串**，避免注释/普通字符串里的配置字面量误导
  const configText = configFile
    ? maskCommentsAndStrings(readText(path.join(projectDir, configFile)))
    : '';

  // 阻断判断
  const blocking = [];
  if (appToolsMajor !== 2 && appToolsMajor !== 3 && !isWorkspaceVersion) {
    blocking.push(
      `当前项目不是可识别的 Modern.js v2/v3 项目，检测到 @modern-js/app-tools = ${appToolsVersion ?? 'missing'}`,
    );
  }
  const node = parseVersion(process.version);
  if (!node || cmp(node, MIN_NODE) < 0) {
    blocking.push(
      `Node.js 版本不足：当前 ${process.version}，要求 >= ${MIN_NODE.join('.')}`,
    );
  }
  if (blocking.length) fail(blocking);

  const files = collectSources(path.join(projectDir, 'src'))
    .concat(collectSources(path.join(projectDir, 'server')))
    .concat(collectSources(path.join(projectDir, 'api')));
  const rel = f => path.relative(projectDir, f);
  // 标识符类信号：剥注释+字符串后匹配（普通字符串不算信号）
  const grep = re =>
    files.filter(f => re.test(maskCommentsAndStrings(readText(f)))).map(rel);
  // import 路径：只取真实模块 specifier（避免字符串里裸搜包名）
  const grepImport = mod =>
    files
      .filter(f => importSpecifiers(readText(f)).some(s => s.startsWith(mod)))
      .map(rel);

  const src = path.join(projectDir, 'src');
  const hasRoutesEntry = exists(src, 'routes');
  const hasAppEntry = exists(src, 'App.tsx') || exists(src, 'App.jsx');
  const hasCustomIndex = hasAny(src, 'index');
  const hasCustomEntry = hasAny(src, 'entry');
  // 入口类型
  const entryType = hasRoutesEntry
    ? 'routes'
    : hasAppEntry
      ? 'app'
      : hasCustomIndex
        ? 'custom-index'
        : hasCustomEntry
          ? 'custom-entry'
          : 'unknown';

  const features = {
    // 路由
    'pages-to-routes': hasPagesDir(projectDir),
    // 入口
    'custom-entry': hasCustomIndex || hasCustomEntry,
    'app-config': grep(/\bApp\.config\b/),
    'app-init': grep(/\bApp\.init\b/),
    'layout-config-init': grep(/export\s+const\s+(config|init)\b/),
    // import 路径映射（只看真实模块 specifier）
    'import-bff': grepImport('@modern-js/runtime/bff'),
    'import-server': grepImport('@modern-js/runtime/server'),
    // runtime API
    'use-runtime-context': grep(/\buseRuntimeContext\b/),
    // 配置
    'dev-port': /\bdev\s*:\s*\{[\s\S]*?\bport\b/.test(configText),
    'app-icon-string': /appIcon\s*:\s*['"]/.test(configText),
    'ssr-mode': /\bssr\b/.test(configText),
    'tailwind-plugin':
      Boolean(deps['@modern-js/plugin-tailwindcss']) ||
      /plugin-tailwindcss|tailwindcssPlugin/.test(configText),
    'webpack-config':
      /\bwebpack\b/.test(configText) ||
      grep(/\bwebpackChain\b|tools\.webpack/).length > 0,
    // 自定义 server
    'custom-server':
      exists(projectDir, 'server', 'index.ts') ||
      exists(projectDir, 'server', 'index.js'),
  };

  // v2-only 结构信号（v3 不再有）。明确排除 routes / modern.runtime.ts / appTools()（v3 也有）
  const arr = v => (Array.isArray(v) ? v.length > 0 : Boolean(v));
  const v2OnlySignals = [];
  if (/\bruntime\s*:/.test(configText)) v2OnlySignals.push('config.runtime');
  if (/appTools\s*\(\s*\{[^)]*\bbundler\b/.test(configText)) {
    v2OnlySignals.push('appTools({ bundler })');
  }
  if (/\bapplyBaseConfig\s*\(/.test(configText))
    v2OnlySignals.push('applyBaseConfig');
  if (
    deps['@modern-js/plugin-tailwindcss'] ||
    arr(features['tailwind-plugin'])
  ) {
    v2OnlySignals.push('plugin-tailwindcss');
  }
  if (arr(features['import-bff'])) v2OnlySignals.push('runtime/bff import');
  if (arr(features['import-server']))
    v2OnlySignals.push('runtime/server import');
  if (arr(features['app-config'])) v2OnlySignals.push('App.config');
  if (arr(features['app-init'])) v2OnlySignals.push('App.init');
  if (arr(features['layout-config-init']))
    v2OnlySignals.push('layout config/init');
  if (arr(features['use-runtime-context']))
    v2OnlySignals.push('useRuntimeContext');
  if (arr(features['pages-to-routes'])) v2OnlySignals.push('src/pages');
  if (arr(features['custom-server'])) v2OnlySignals.push('custom server');

  // workspace/monorepo 协议 + 无任何 v2-only 信号 → ambiguous，阻断（可能已是 v3 workspace 应用）
  if (
    isWorkspaceVersion &&
    appToolsMajor == null &&
    v2OnlySignals.length === 0
  ) {
    fail([
      `检测到 @modern-js/app-tools = ${appToolsVersion}（workspace/monorepo 协议）但无任何 v2-only 信号：`,
      '无法判定为待迁移的 v2 项目（很可能已经是 v3 workspace 应用）。',
      '请人工确认项目确为 v2 后再迁移，不要直接跑 migrate.mjs。',
    ]);
  }

  const modernDeps = Object.fromEntries(
    Object.entries(deps).filter(([n]) => n.startsWith('@modern-js/')),
  );

  const context = {
    projectDir,
    // major=3→v3；major=2→v2；workspace 协议命中 v2 信号→v2（无信号已在上面阻断）
    migrationState: appToolsMajor === 3 ? 'v3' : 'v2',
    appToolsVersion,
    v2Signals: v2OnlySignals,
    configFile,
    entryType,
    node: process.version,
    modernDeps,
    features,
  };

  const outDir = path.join(projectDir, '.agents', 'runs', 'modernjs-migrate');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'context.json');
  fs.writeFileSync(outFile, `${JSON.stringify(context, null, 2)}\n`);

  const enabled = Object.entries(features)
    .filter(([, v]) => (Array.isArray(v) ? v.length : v))
    .map(([k]) => k);
  console.log(`projectDir: ${projectDir}`);
  console.log(
    `appTools: ${appToolsVersion ?? 'missing'} (${context.migrationState})`,
  );
  console.log(`entry: ${entryType}   node: ${process.version}`);
  console.log(`features: ${enabled.length ? enabled.join(', ') : 'none'}`);
  console.log(`context: ${outFile}`);
}

try {
  main();
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}
