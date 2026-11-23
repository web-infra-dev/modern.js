#!/usr/bin/env node
// 把项目 tsconfig 迁到 @modern-js/tsconfig 的 bundler 基线。
//   node scripts/migrate-tsconfig.mjs <projectDir> [--json]
//
// 结果写进 <projectDir>/.agents/runs/modernjs-migrate-tsconfig/report.json 的 changed / manual。
//
// 自动改写（与 TypeScript 7 报错 TS5102 给出的写法等价）：
//   a. compilerOptions.baseUrl → paths 的每个目标加上原 baseUrl 前缀（改为相对 tsconfig 目录）；
//      源码里有靠 baseUrl 解析的裸导入（如 `import 'src/foo'`）时补 "*": ["<baseUrl>/*"]；最后删除 baseUrl
//   b. CommonJS 项目（package.json#type !== "module"）有 api/ 或 server/，且没有
//      tsconfig.server.json、modern.config 里也没有 server.tsconfigPath → 写 tsconfig.server.json
//   c. 有 api/lambda 且 paths 缺 "@api/*" → 补 "@api/*": ["./api/lambda/*"]
// 人工清单：
//   tsconfig.json 不是严格 JSON（含注释 / 尾逗号）：不改写，把本应执行的改写列进人工清单
//   baseUrl 写在 extends 的父配置里：父配置不改，提示人工按同样规则处理
// 幂等：重复执行不会产生新的改写；type: "module" 的项目不会生成 tsconfig.server.json。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SERVER_TSCONFIG = {
  extends: './tsconfig.json',
  compilerOptions: {
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    noEmit: false,
    declaration: false,
  },
  include: ['api', 'server', 'shared'],
};

const API_ALIAS = '@api/*';
const API_ALIAS_TARGET = ['./api/lambda/*'];
const CONFIG_FILES = [
  'modern.config.ts',
  'modern.config.mts',
  'modern.config.cts',
  'modern.config.js',
  'modern.config.mjs',
  'modern.config.cjs',
];

// 去掉 JSONC 的注释与尾逗号，只用于「分析」无法严格解析的 tsconfig，不用于写回
function stripJsonc(text) {
  let out = '';
  let i = 0;
  let inStr = false;
  while (i < text.length) {
    const ch = text[i];
    if (inStr) {
      out += ch;
      if (ch === '\\') {
        out += text[i + 1] ?? '';
        i += 2;
        continue;
      }
      if (ch === '"') inStr = false;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? text.length : end + 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}

// 与常见 tsconfig 排版一致：对象逐行缩进 2 空格，短的原始值数组保持单行
function formatJson(value, indent = '') {
  const next = `${indent}  `;
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const primitive = value.every(v => v === null || typeof v !== 'object');
    const inline = `[${value.map(v => JSON.stringify(v)).join(', ')}]`;
    if (primitive && inline.length + indent.length <= 80) return inline;
    return `[\n${value.map(v => `${next}${formatJson(v, next)}`).join(',\n')}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return '{}';
    return `{\n${keys
      .map(k => `${next}${JSON.stringify(k)}: ${formatJson(value[k], next)}`)
      .join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function hasTsconfigPathOption(dir) {
  return CONFIG_FILES.some(f => {
    const file = path.join(dir, f);
    if (!fs.existsSync(file)) return false;
    return /\btsconfigPath\b/.test(
      stripComments(fs.readFileSync(file, 'utf8')),
    );
  });
}

function readPackageType(dir) {
  const file = path.join(dir, 'package.json');
  if (!fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).type;
  } catch {
    return undefined;
  }
}

// "./src" + "*" → "./src/*"；"../shared" + "./x/*" → "../shared/x/*"
function rebasePathTarget(baseUrl, target) {
  if (path.posix.isAbsolute(target) || path.win32.isAbsolute(target)) {
    return target;
  }
  const joined = path.posix.join(baseUrl.replace(/\\/g, '/'), target);
  return joined.startsWith('.') || joined.startsWith('/')
    ? joined
    : `./${joined}`;
}

const SRC_EXTS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'output',
  'coverage',
]);
const SPECIFIER_RE =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)(['"])([^'"\n]+)\1/gm;
const MAX_SCANNED_FILES = 20000;

function listSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (out.length >= MAX_SCANNED_FILES) break;
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) listSourceFiles(file, out);
    else if (SRC_EXTS.has(path.extname(entry.name))) out.push(file);
  }
  return out;
}

function matchesPathsKey(specifier, keys) {
  return keys.some(key => {
    const star = key.indexOf('*');
    if (star === -1) return specifier === key;
    return (
      specifier.startsWith(key.slice(0, star)) &&
      specifier.endsWith(key.slice(star + 1))
    );
  });
}

// 找出一条靠 baseUrl 解析的裸导入：不是相对路径、不命中已有 paths，且首段在 baseUrl 目录下存在
function findBaseUrlImport(dir, baseUrlDir, pathsKeys) {
  for (const file of listSourceFiles(dir)) {
    const code = fs.readFileSync(file, 'utf8');
    for (const [, , specifier] of code.matchAll(SPECIFIER_RE)) {
      if (/^[./]|^[a-z]+:/i.test(specifier)) continue;
      if (matchesPathsKey(specifier, pathsKeys)) continue;
      const parts = specifier.split('/');
      const head = specifier.startsWith('@')
        ? parts.slice(0, 2)
        : parts.slice(0, 1);
      const target = path.join(baseUrlDir, ...head);
      if (
        fs.existsSync(target) ||
        [...SRC_EXTS].some(ext => fs.existsSync(`${target}${ext}`))
      ) {
        return { file: path.relative(dir, file), specifier };
      }
    }
  }
  return undefined;
}

// 沿相对路径的 extends 链向上找，返回最近一个声明了 compilerOptions[key] 的父配置（相对 dir 的路径）
function inheritedOptionFile(dir, config, key, seen = new Set()) {
  const parents = Array.isArray(config.extends)
    ? [...config.extends].reverse()
    : [config.extends];
  for (const parent of parents) {
    if (typeof parent !== 'string' || !parent.startsWith('.')) continue;
    const file = path.resolve(
      dir,
      parent.endsWith('.json') ? parent : `${parent}.json`,
    );
    if (seen.has(file) || !fs.existsSync(file)) continue;
    seen.add(file);
    let parsed;
    try {
      parsed = JSON.parse(stripJsonc(fs.readFileSync(file, 'utf8')));
    } catch {
      continue;
    }
    if (parsed?.compilerOptions?.[key] !== undefined) {
      return path.relative(dir, file);
    }
    const found = inheritedOptionFile(path.dirname(file), parsed, key, seen);
    if (found)
      return path.relative(dir, path.resolve(path.dirname(file), found));
  }
  return undefined;
}

/**
 * 迁移 <dir>/tsconfig.json 与 tsconfig.server.json，返回 { changed, manual }（不写 report）。
 */
export function migrateTsconfig(dir) {
  const changed = [];
  const manual = [];
  const tsconfigFile = path.join(dir, 'tsconfig.json');
  if (!fs.existsSync(tsconfigFile)) return { changed, manual };

  const text = fs.readFileSync(tsconfigFile, 'utf8');
  let config;
  let strict = true;
  try {
    config = JSON.parse(text);
  } catch {
    strict = false;
    try {
      config = JSON.parse(stripJsonc(text));
    } catch {
      config = undefined;
    }
  }

  if (!config || typeof config !== 'object') {
    manual.push(
      'tsconfig.json 无法解析：请手动删除 compilerOptions.baseUrl（TS 6 报 TS5101），paths 改为相对 tsconfig 目录的写法；有 api/lambda 时补 "@api/*": ["./api/lambda/*"]',
    );
  } else {
    const edits = [];
    const manualEdits = [];
    const compilerOptions = config.compilerOptions ?? {};
    const { baseUrl } = compilerOptions;
    const hasPaths =
      compilerOptions.paths && typeof compilerOptions.paths === 'object';
    // paths 整项覆盖：自身没有 paths、却从父配置继承了 paths 时，在本文件里写 paths 会丢掉继承来的别名
    const inheritedPathsFile = hasPaths
      ? undefined
      : inheritedOptionFile(dir, config, 'paths');

    // a：baseUrl → 等价的 paths
    if (typeof baseUrl === 'string' && inheritedPathsFile) {
      manualEdits.push(
        `paths 继承自父配置 ${inheritedPathsFile}，并按本文件的 baseUrl（"${baseUrl}"）解析：直接删除 baseUrl 会改变这些别名的解析位置。请把 paths 复制到 tsconfig.json，每个目标加上 baseUrl 前缀；有靠 baseUrl 解析的裸导入时补 "*" 映射；再删除 baseUrl`,
      );
    } else if (typeof baseUrl === 'string') {
      const rebased = {};
      for (const [key, targets] of Object.entries(
        hasPaths ? compilerOptions.paths : {},
      )) {
        rebased[key] = (Array.isArray(targets) ? targets : [targets]).map(t =>
          rebasePathTarget(baseUrl, String(t)),
        );
      }
      const usage = findBaseUrlImport(
        dir,
        path.resolve(dir, baseUrl),
        Object.keys(rebased),
      );
      if (usage && !('*' in rebased)) {
        rebased['*'] = [rebasePathTarget(baseUrl, '*')];
      }
      const changedPaths = Object.keys(rebased).filter(
        key =>
          JSON.stringify(rebased[key]) !==
          JSON.stringify(compilerOptions.paths?.[key]),
      );
      if (changedPaths.length) {
        edits.push({
          desc: `paths 改为相对 tsconfig 目录：${changedPaths
            .map(key => `"${key}": ${JSON.stringify(rebased[key])}`)
            .join(', ')}${
            usage
              ? `（"*" 用于 ${usage.file} 中的 '${usage.specifier}' 这类裸导入）`
              : ''
          }`,
          apply: c => {
            c.compilerOptions.paths = {
              ...c.compilerOptions.paths,
              ...rebased,
            };
          },
        });
      }
      edits.push({
        desc: `删除 compilerOptions.baseUrl（"${baseUrl}"，TS 6 报 TS5101，TS 7 已移除）`,
        apply: c => {
          delete c.compilerOptions.baseUrl;
        },
      });
    } else {
      const parentFile = inheritedOptionFile(dir, config, 'baseUrl');
      if (parentFile) {
        manualEdits.push(
          `baseUrl 写在父配置 ${parentFile} 里（TS 6 报 TS5101）：在该文件中按同样规则改写——paths 目标加上 baseUrl 前缀；有靠 baseUrl 解析的裸导入时补 "*" 映射；再删除 baseUrl`,
        );
      }
    }

    // c：@api/* 别名
    if (fs.existsSync(path.join(dir, 'api', 'lambda'))) {
      const paths = compilerOptions.paths;
      const hasAlias = paths && typeof paths === 'object' && API_ALIAS in paths;
      if (!hasAlias && inheritedPathsFile) {
        manualEdits.push(
          `paths 继承自父配置 ${inheritedPathsFile}：在该文件的 paths 中补充 "${API_ALIAS}"（目标相对该文件所在目录指向 api/lambda/*）`,
        );
      } else if (!hasAlias) {
        edits.push({
          desc: `compilerOptions.paths 补充 "${API_ALIAS}": ${JSON.stringify(API_ALIAS_TARGET)}`,
          apply: c => {
            c.compilerOptions.paths = {
              ...(c.compilerOptions.paths ?? {}),
              [API_ALIAS]: [...API_ALIAS_TARGET],
            };
          },
        });
      }
    }

    if (edits.length && strict) {
      if (!config.compilerOptions) config.compilerOptions = {};
      for (const e of edits) e.apply(config);
      fs.writeFileSync(tsconfigFile, `${formatJson(config)}\n`);
      for (const e of edits) changed.push(`tsconfig.json：${e.desc}`);
    } else if (edits.length) {
      for (const e of edits) {
        manual.push(
          `tsconfig.json 含注释或尾逗号，未自动改写，请手动：${e.desc}`,
        );
      }
    }
    manual.push(...manualEdits);
  }

  // b：tsconfig.server.json
  const serverFile = path.join(dir, 'tsconfig.server.json');
  const hasServerCode =
    fs.existsSync(path.join(dir, 'api')) ||
    fs.existsSync(path.join(dir, 'server'));
  if (
    hasServerCode &&
    readPackageType(dir) !== 'module' &&
    !fs.existsSync(serverFile) &&
    !hasTsconfigPathOption(dir)
  ) {
    fs.writeFileSync(serverFile, `${formatJson(SERVER_TSCONFIG)}\n`);
    changed.push(
      '新增 tsconfig.server.json（NodeNext，CommonJS 项目的 api/server/shared 编译配置）',
    );
  }

  return { changed, manual };
}

// 把结果并入 report.json（已存在则去重追加，保留已有的其他字段）
export function writeReport(dir, result) {
  const outDir = path.join(dir, '.agents', 'runs', 'modernjs-migrate-tsconfig');
  const file = path.join(outDir, 'report.json');
  let report = { projectDir: dir, changed: [], manual: [] };
  if (fs.existsSync(file)) {
    try {
      report = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {}
  }
  for (const key of ['changed', 'manual']) {
    const list = Array.isArray(report[key]) ? report[key] : [];
    for (const item of result[key]) if (!list.includes(item)) list.push(item);
    report[key] = list;
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function main() {
  const args = process.argv.slice(2);
  const dir = path.resolve(args.find(a => !a.startsWith('--')) || '.');
  if (!fs.existsSync(path.join(dir, 'tsconfig.json'))) {
    console.error(`未找到 tsconfig.json: ${dir}`);
    process.exit(1);
  }
  const result = migrateTsconfig(dir);
  writeReport(dir, result);
  if (args.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`🧩 tsconfig 迁移：${dir}`);
  console.log(`\n✅ 已自动改写 ${result.changed.length} 项：`);
  for (const c of result.changed) console.log(`  - ${c}`);
  console.log(`\n🔴 人工清单 ${result.manual.length} 项：`);
  for (const m of result.manual) console.log(`  - ${m}`);
  console.log('\n报告见 .agents/runs/modernjs-migrate-tsconfig/report.json');
}

// 仅在直接执行时运行 main；被 import 时不执行
const normalize = p => {
  const real = fs.realpathSync(p);
  return process.platform === 'win32' ? real.toLowerCase() : real;
};
if (
  process.argv[1] &&
  fs.existsSync(process.argv[1]) &&
  normalize(process.argv[1]) === normalize(fileURLToPath(import.meta.url))
) {
  main();
}
