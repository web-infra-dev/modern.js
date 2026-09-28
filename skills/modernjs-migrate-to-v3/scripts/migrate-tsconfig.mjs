#!/usr/bin/env node
// 把项目 tsconfig 迁到 @modern-js/tsconfig 的 bundler 基线（Modern.js 3）。
//   node scripts/migrate-tsconfig.mjs <projectDir> [--json]
//
// 也会被 migrate.mjs 作为一个步骤调用（v2 迁移与已是 v3 的续迁移都会执行）。
// 结果写进 <projectDir>/.agents/runs/modernjs-migrate/report.json 的 changed / manual。
//
// 自动改写：
//   a. compilerOptions.baseUrl 为 "." / "./" 且存在 paths → 删除（paths 保留，本就相对 tsconfig 目录）
//   c. CommonJS 项目（package.json#type !== "module"）有 api/ 或 server/，且没有
//      tsconfig.server.json、modern.config 里也没有 server.tsconfigPath → 写 tsconfig.server.json
//   d. 有 api/lambda 且 paths 缺 "@api/*"（且 baseUrl 已不存在或本次删除）→ 补 "@api/*": ["./api/lambda/*"]
// 人工清单：
//   a'. baseUrl 为 "." / "./" 但没有 paths：可能有 `import 'src/foo'` 这类靠 baseUrl 解析的裸导入，
//       不删；提示先用 paths（如 "*": ["./*"]）映射，再删 baseUrl
//   b. 其他 baseUrl 值：不删，给出每条 paths 改写成相对 tsconfig 目录后的值
//   保留了 baseUrl 时，缺失的 "@api/*" 也进人工清单（它会相对 baseUrl 解析，需在 baseUrl 改写后再加）
//   tsconfig.json 不是严格 JSON（含注释 / 尾逗号）：不改写，把本应执行的改写列进人工清单
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
  const joined = path.posix.join(baseUrl.replace(/\\/g, '/'), target);
  return joined.startsWith('.') || joined.startsWith('/')
    ? joined
    : `./${joined}`;
}

function isDefaultBaseUrl(baseUrl) {
  return baseUrl === '.' || baseUrl === './';
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
    // 本次执行后 baseUrl 是否仍保留（保留时不自动补 @api/*）
    const keepsBaseUrl =
      typeof baseUrl === 'string' && !(isDefaultBaseUrl(baseUrl) && hasPaths);

    // a / b：baseUrl
    if (typeof baseUrl === 'string' && isDefaultBaseUrl(baseUrl) && !hasPaths) {
      manualEdits.push(
        `tsconfig.json 的 compilerOptions.baseUrl 为 "${baseUrl}" 且没有 paths（TS 6 报 TS5101，未自动删除）：如果有 \`import 'src/foo'\` 这类靠 baseUrl 解析的裸导入，先用 paths 映射（如 "*": ["./*"]），再删除 baseUrl`,
      );
    } else if (typeof baseUrl === 'string' && isDefaultBaseUrl(baseUrl)) {
      edits.push({
        desc: `删除 compilerOptions.baseUrl（"${baseUrl}"），paths 保留`,
        apply: c => {
          delete c.compilerOptions.baseUrl;
        },
      });
    } else if (typeof baseUrl === 'string') {
      const paths = compilerOptions.paths ?? {};
      const rewrites = Object.entries(paths).map(
        ([key, targets]) =>
          `"${key}": ${JSON.stringify(
            (Array.isArray(targets) ? targets : [targets]).map(t =>
              rebasePathTarget(baseUrl, String(t)),
            ),
          )}`,
      );
      manualEdits.push(
        [
          `tsconfig.json 的 compilerOptions.baseUrl 为 "${baseUrl}"（TS 6 报 TS5101，未自动删除）：`,
          rewrites.length
            ? `先把 paths 改成相对 tsconfig 目录（加上原 baseUrl 前缀）：${rewrites.join(', ')}，`
            : '先确认没有依赖 baseUrl 的非相对 import，',
          '再删除 baseUrl',
        ].join(''),
      );
    }

    // d：@api/* 别名
    if (fs.existsSync(path.join(dir, 'api', 'lambda'))) {
      const paths = compilerOptions.paths;
      const hasAlias = paths && typeof paths === 'object' && API_ALIAS in paths;
      if (!hasAlias) {
        if (keepsBaseUrl) {
          manualEdits.push(
            `tsconfig.json 缺少 BFF 别名：完成上面的 baseUrl 改写后补 "${API_ALIAS}": ${JSON.stringify(API_ALIAS_TARGET)}`,
          );
        } else {
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

  // c：tsconfig.server.json
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

// 把结果并入 report.json（已存在则去重追加，保留 migrate.mjs 写入的其他字段）
export function writeReport(dir, result) {
  const outDir = path.join(dir, '.agents', 'runs', 'modernjs-migrate');
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
  console.log('\n报告见 .agents/runs/modernjs-migrate/report.json');
}

// 仅在直接执行时运行 main；被 migrate.mjs import 时不执行
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
