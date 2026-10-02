#!/usr/bin/env node
// dependency-audit — 安装体积 & 耗时归因（数据优先，不做推断）
//
// 用法：node size-audit.mjs [target-dir] [--json] [--top=N]
//
// 原则（按 review 要求）：先把三方数据对齐、输出**可复核**的事实，再给建议；
// 没有 install 结果时**不推断体积**。三方：
//   1) manifest：package.json 声明的 deps/devDeps
//   2) lockfile：最近 pnpm-lock.yaml 解析出的 name@version
//   3) install：实际 node_modules 落盘字节（pnpm 用 .pnpm store + 符号链接，
//      故按 store 真实目录测量，符号链接不跟随、不重复计）
//
// 耗时：本工具**不推断**安装耗时；只给出实测命令（见结尾），需实测后填入。

import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const rest = argv.slice(2);
  const json = rest.includes('--json');
  const topArg = rest.find(a => a.startsWith('--top='));
  const top = topArg ? Number(topArg.split('=')[1]) : 20;
  const dir = rest.find(a => !a.startsWith('--'));
  const rootArg = rest.find(a => a.startsWith('--install-root='));
  return {
    dir: path.resolve(dir || '.'),
    json,
    top,
    installRoot: rootArg ? path.resolve(rootArg.split('=')[1]) : null,
  };
}

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

// 向上找含 node_modules 的安装根（pnpm workspace 下包在 packages/<x>，装在仓库根）
function findInstallRoot(dir) {
  let cur = dir;
  let fallback = null;
  for (;;) {
    const nodeModules = path.join(cur, 'node_modules');
    if (fs.existsSync(path.join(nodeModules, '.pnpm'))) return cur;
    if (!fallback && fs.existsSync(nodeModules)) fallback = cur;
    const parent = path.dirname(cur);
    if (parent === cur) return fallback;
    cur = parent;
  }
}

// 递归测量真实字节；符号链接不跟随（pnpm store 之外的链接返回 0，避免重复/环）
function dirSize(p) {
  let st;
  try {
    st = fs.lstatSync(p);
  } catch {
    return 0;
  }
  if (st.isSymbolicLink()) return 0;
  if (st.isFile()) return st.size;
  if (st.isDirectory()) {
    let total = 0;
    for (const e of fs.readdirSync(p)) total += dirSize(path.join(p, e));
    return total;
  }
  return 0;
}

// pnpm store 目录名 → { name, version }；scoped 用 + 编码
function parseStoreEntry(entry) {
  // 去掉 peer 后缀：name@ver(peer) / name@ver_peer
  const cleaned = entry.replace(/[(_].*$/, '');
  if (cleaned.startsWith('@')) {
    const at = cleaned.indexOf('@', 1);
    if (at === -1) return null;
    return {
      name: cleaned.slice(0, at).replace('+', '/'),
      version: cleaned.slice(at + 1),
    };
  }
  const at = cleaned.indexOf('@');
  if (at <= 0) return null;
  return { name: cleaned.slice(0, at), version: cleaned.slice(at + 1) };
}

// 测量 install 结果（无 node_modules 返回 null —— 不推断）
function measureInstalled(dir) {
  const nm = path.join(dir, 'node_modules');
  if (!fs.existsSync(nm)) return null;
  const store = path.join(nm, '.pnpm');
  const sizes = new Map(); // name -> bytes（同名多版本累加）

  if (fs.existsSync(store)) {
    for (const entry of fs.readdirSync(store)) {
      const parsed = parseStoreEntry(entry);
      if (!parsed) continue;
      const pkgDir = path.join(
        store,
        entry,
        'node_modules',
        ...parsed.name.split('/'),
      );
      if (!fs.existsSync(pkgDir)) continue;
      sizes.set(parsed.name, (sizes.get(parsed.name) || 0) + dirSize(pkgDir));
    }
  } else {
    // 扁平 node_modules（npm/yarn）
    for (const e of fs.readdirSync(nm)) {
      if (e.startsWith('.')) continue;
      if (e.startsWith('@')) {
        for (const s of fs.readdirSync(path.join(nm, e))) {
          sizes.set(`${e}/${s}`, dirSize(path.join(nm, e, s)));
        }
      } else {
        sizes.set(e, dirSize(path.join(nm, e)));
      }
    }
  }
  return sizes;
}

function readLockNames(lockPath) {
  const text = fs.readFileSync(lockPath, 'utf-8');
  const names = new Set();
  const re = /^\s+'?((?:@[^@/\s]+\/)?[^@/\s']+)@\d+\.\d+\.\d+[^':\s(]*'?:/gm;
  let m;
  while ((m = re.exec(text))) names.add(m[1]);
  return names;
}

const mb = b => `${(b / 1024 / 1024).toFixed(2)} MB`;

function main() {
  const {
    dir,
    json,
    top,
    installRoot: explicitInstallRoot,
  } = parseArgs(process.argv);
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`未找到 package.json: ${pkgPath}`);
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const declared = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ]);

  const lockPath = findLockfile(dir);
  const lockNames = lockPath ? readLockNames(lockPath) : null;
  // install 根：显式 --install-root > 向上找含 node_modules 的目录 > target 自身
  const installRoot = explicitInstallRoot || findInstallRoot(dir) || dir;
  const installed = measureInstalled(installRoot);

  const report = {
    target: dir,
    package: pkg.name || '(unnamed)',
    declaredCount: declared.size,
    lockfile: lockPath ? path.relative(dir, lockPath) : null,
    installRoot: installed ? path.relative(dir, installRoot) || '.' : null,
    installPresent: !!installed,
    largest: [],
    declaredNotInstalled: [],
    totalBytes: null,
  };

  if (installed) {
    const entries = [...installed.entries()].sort((a, b) => b[1] - a[1]);
    report.totalBytes = entries.reduce((s, [, b]) => s + b, 0);
    report.largest = entries
      .slice(0, top)
      .map(([name, bytes]) => ({ name, bytes }));
    report.declaredNotInstalled = [...declared]
      .filter(d => !installed.has(d))
      .sort();
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  console.log(`📦 体积 & 耗时归因：${report.package}`);

  if (!installed) {
    console.log(
      '\nℹ️ 未发现 node_modules（已向上查找安装根）—— install 结果不可用，**不推断体积**。',
    );
    console.log(
      '   请先 `pnpm install`；或用 `--install-root=<装了依赖的目录>` 指定安装根。',
    );
  } else {
    console.log(
      `\n📊 已安装总体积：${mb(report.totalBytes)}（安装根：${report.installRoot}，按包累加真实落盘字节）`,
    );
    console.log(`\n体积最大的 ${report.largest.length} 个包：`);
    for (const { name, bytes } of report.largest) {
      console.log(`  - ${name.padEnd(36)} ${mb(bytes)}`);
    }
    if (report.declaredNotInstalled.length) {
      console.log(
        `\n⚠️ 声明但未安装（manifest 有、node_modules 无）${report.declaredNotInstalled.length} 个：`,
      );
      console.log(`  ${report.declaredNotInstalled.join(', ')}`);
    }
    console.log(
      '\n建议（仅基于上面实测体积）：对体积大头评估能否换轻量替代 / 按需引入 / 移到 optionalDependencies。',
    );
  }

  if (lockNames) {
    console.log(
      `\n（lockfile ${report.lockfile} 解析到 ${lockNames.size} 个包名，可与上面安装结果交叉核对版本/缺失）`,
    );
  }

  console.log(
    '\n⏱️ 安装耗时本工具不推断；实测：`/usr/bin/time -v pnpm install`（或 pnpm `--reporter=ndjson` 采时），把真实耗时填入归因结论。',
  );
}

main();
