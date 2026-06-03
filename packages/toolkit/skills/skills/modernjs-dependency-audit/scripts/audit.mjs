#!/usr/bin/env node
// modernjs-dependency-audit — 幽灵依赖 + 循环依赖 + 重复多版本检测（P1）
//
// 用法：node audit.mjs [target-dir] [--json]
//   target-dir 默认当前目录；应为含 package.json 的包/项目根。
//
// 检测：
//  1) 幽灵依赖：import 的外部包未在 package.json 声明（pnpm 严格模式会报错）。
//  2) 循环依赖：包内相对 import 构成的有向图里的环。
//  3) 重复多版本：从最近的 pnpm-lock.yaml 找被解析成多个版本的包（拖慢安装、
//     增大体积、易踩 dual-package 坑），可用 `pnpm dedupe` 视角收敛。
//
// 限制（已知）：基于正则提取 import、按扩展名/index 解析相对路径，不解析
// tsconfig paths 别名；纯 type-only import 也会计入；lockfile 用正则粗解析。
// 误报可人工排除，后续接 AST / 正式 lockfile parser。

import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';

const BUILTINS = new Set([
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
]);
const SRC_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];
const SRC_EXT_SET = new Set(SRC_EXT);
const SKIP_DIR = new Set([
  'node_modules',
  'dist',
  'dist-ssg',
  'coverage',
  '.git',
  'compiled',
]);

function parseArgs(argv) {
  const rest = argv.slice(2);
  const json = rest.includes('--json');
  const allowMonorepo = rest.includes('--allow-monorepo');
  const dir = rest.find(a => !a.startsWith('--'));
  return { dir: path.resolve(dir || '.'), json, allowMonorepo };
}

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIR.has(e.name)) walk(path.join(dir, e.name), files);
    } else if (SRC_EXT_SET.has(path.extname(e.name))) {
      files.push(path.join(dir, e.name));
    }
  }
  return files;
}

// 从源码里抽出所有 import/require/export-from/dynamic-import 的 specifier
function extractSpecifiers(code) {
  const specs = new Set();
  const patterns = [
    /\bimport\s+[^'"]*?from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bexport\s+[^'"]*?from\s*['"]([^'"]+)['"]/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(code))) specs.add(m[1]);
  }
  return specs;
}

// specifier → 外部包名（相对/内部/builtin 返回 null）
function toPackageName(spec) {
  if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('#')) {
    return null;
  }
  if (BUILTINS.has(spec) || BUILTINS.has(spec.split('/')[0])) return null;
  const parts = spec.split('/');
  return spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
}

// 把相对 specifier 解析成包内的实际文件（解析不到返回 null）
function resolveRelative(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [];
  if (SRC_EXT_SET.has(path.extname(base))) candidates.push(base);
  for (const e of SRC_EXT) candidates.push(base + e);
  for (const e of SRC_EXT) candidates.push(path.join(base, `index${e}`));
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

// DFS 找有向图里的环；每个环按集合去重，只报一次
function findCycles(graph) {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const state = new Map();
  const stack = [];
  const cycles = [];
  const seen = new Set();

  function dfs(node) {
    state.set(node, GRAY);
    stack.push(node);
    for (const next of graph.get(node) || []) {
      const s = state.get(next) || WHITE;
      if (s === WHITE) {
        dfs(next);
      } else if (s === GRAY) {
        const idx = stack.indexOf(next);
        if (idx !== -1) {
          const cyc = stack.slice(idx);
          const key = [...cyc].sort().join('|');
          if (!seen.has(key)) {
            seen.add(key);
            cycles.push(cyc);
          }
        }
      }
    }
    stack.pop();
    state.set(node, BLACK);
  }

  for (const node of graph.keys()) {
    if ((state.get(node) || WHITE) === WHITE) dfs(node);
  }
  return cycles;
}

// 从 target 向上找最近的 pnpm-lock.yaml
function findLockfile(dir) {
  let cur = dir;
  for (;;) {
    const p = path.join(cur, 'pnpm-lock.yaml');
    if (fs.existsSync(p)) return p;
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

// 粗解析 pnpm-lock.yaml，找被解析成多版本的包（正则按 name@version 键）
function findDuplicateVersions(lockPath) {
  const text = fs.readFileSync(lockPath, 'utf-8');
  const versions = new Map(); // name -> Set<version>
  // 匹配形如 `  '@scope/name@1.2.3':` / `  name@1.2.3:` 的键，版本止于 ( : 空白
  const re = /^\s+'?((?:@[^@/\s]+\/)?[^@/\s']+)@(\d+\.\d+\.\d+[^':\s(]*)'?:/gm;
  let m;
  while ((m = re.exec(text))) {
    const [, name, version] = m;
    if (!versions.has(name)) versions.set(name, new Set());
    versions.get(name).add(version);
  }
  return [...versions.entries()]
    .filter(([, v]) => v.size > 1)
    .map(([name, v]) => ({ package: name, versions: [...v].sort() }))
    .sort((a, b) => b.versions.length - a.versions.length);
}

function main() {
  const { dir, json, allowMonorepo } = parseArgs(process.argv);
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`未找到 package.json: ${pkgPath}`);
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const declared = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ]);

  // 默认入口=单包/用户项目。monorepo 根（有 pnpm-workspace.yaml）默认进入受限模式：
  // 跳过 phantom/循环（根上正则会被 codegen 模板字符串大量误报），仅做 lockfile 级
  // 的重复多版本。需要全量可加 --allow-monorepo。
  const isMonorepoRoot = fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'));
  const restricted = isMonorepoRoot && !allowMonorepo;

  const files = restricted ? [] : walk(dir);
  const usage = new Map(); // pkgName -> Set<file>
  const graph = new Map(); // file -> Set<file>（包内相对 import 边）
  for (const f of files) {
    const code = fs.readFileSync(f, 'utf-8');
    const edges = new Set();
    for (const spec of extractSpecifiers(code)) {
      if (spec.startsWith('.')) {
        const target = resolveRelative(f, spec);
        if (target) edges.add(target);
        continue;
      }
      const name = toPackageName(spec);
      if (!name) continue;
      if (!usage.has(name)) usage.set(name, new Set());
      usage.get(name).add(path.relative(dir, f));
    }
    graph.set(f, edges);
  }

  const phantom = [...usage.keys()]
    .filter(name => !declared.has(name) && name !== pkg.name)
    .sort()
    .map(name => ({ package: name, usedIn: [...usage.get(name)].sort() }));

  const cycles = findCycles(graph).map(cyc =>
    cyc.map(f => path.relative(dir, f)),
  );

  const lockPath = findLockfile(dir);
  const duplicates = lockPath ? findDuplicateVersions(lockPath) : [];

  const report = {
    target: dir,
    package: pkg.name || '(unnamed)',
    mode: restricted ? 'restricted-monorepo' : 'package',
    scanned: files.length,
    declaredCount: declared.size,
    lockfile: lockPath ? path.relative(dir, lockPath) : null,
    phantom,
    circular: cycles,
    duplicateVersions: duplicates,
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(phantom.length || cycles.length ? 1 : 0);
  }

  console.log(`📦 依赖体检：${report.package}  (${files.length} 个源文件)`);

  if (restricted) {
    console.log(
      '\nℹ️ 检测到 monorepo 根：受限模式，已跳过 phantom / 循环依赖（根目录正则误报多）。',
    );
    console.log(
      '   查这两项请对单个包跑（如 packages/<x>），或加 --allow-monorepo 强制全量。',
    );
  }

  if (phantom.length) {
    console.log(
      `\n⛔ 幽灵依赖 ${phantom.length} 个（import 了但未在 package.json 声明）：`,
    );
    for (const p of phantom) {
      console.log(`  - ${p.package}`);
      for (const f of p.usedIn.slice(0, 5)) console.log(`      ${f}`);
      if (p.usedIn.length > 5) {
        console.log(`      …(+${p.usedIn.length - 5} more)`);
      }
    }
    console.log(
      '  修复：补进 package.json 的 dependencies（或移除多余 import）；不要手改 lockfile。',
    );
  } else if (!restricted) {
    console.log('✅ 未发现幽灵依赖。');
  }

  if (cycles.length) {
    console.log(`\n🔄 循环依赖 ${cycles.length} 处：`);
    for (const cyc of cycles) {
      console.log(`  - ${cyc.join(' → ')} → ${cyc[0]}`);
    }
    console.log(
      '  修复：断开环中一条边（常见做法：把双方共用的部分抽到第三个模块）。',
    );
  } else if (!restricted) {
    console.log('✅ 未发现循环依赖。');
  }

  if (lockPath) {
    if (duplicates.length) {
      const top = duplicates.slice(0, 15);
      console.log(
        `\n📚 重复多版本 ${duplicates.length} 个（lockfile: ${report.lockfile}，按版本数排序，列前 ${top.length}）：`,
      );
      for (const d of top) {
        console.log(`  - ${d.package}: ${d.versions.join(', ')}`);
      }
      if (duplicates.length > top.length) {
        console.log(`  …(+${duplicates.length - top.length} more)`);
      }
      console.log(
        '  建议：`pnpm dedupe` 收敛；无法收敛的用 overrides 锁版本。',
      );
    } else {
      console.log('\n✅ 未发现重复多版本。');
    }
  }

  console.log(
    '\n提醒：基于正则/扩展名解析，tsconfig paths 别名 / 纯 type-only import / lockfile 粗解析可能误报，请人工核对。',
  );
  process.exit(phantom.length || cycles.length ? 1 : 0);
}

main();
