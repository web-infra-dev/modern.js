#!/usr/bin/env node
// 对一个 Modern.js v2 项目执行**可安全自动化**的 v2→v3 改写，并把复杂项列入人工清单。
//   node scripts/migrate.mjs <projectDir> [--to=<version>] [--json]
//
// 自动改写（依据 guides/upgrade/*）：
//   - 依赖：@modern-js/* 统一升到目标版本；移除 @modern-js/plugin-tailwindcss
//   - import 路径：runtime/bff→plugin-bff/client、runtime/server→server-runtime
//   - 配置：appTools({ bundler })→appTools()；顶层 runtime 块→合并进空的 src/modern.runtime.ts；
//           dev.port→server.port；移除 tailwind 插件 import/调用 + 写 postcss.config.cjs
//   - 入口：src/index.* → src/entry.*（bootstrap 函数改写为 createRoot/render）
//   - App.config → src/modern.runtime.ts 的 defineRuntimeConfig
//   - useRuntimeContext() → use/useContext(RuntimeContext)（保留 react default import；alias 进人工）
//   - src/pages → src/routes（无 routes 时，index.* 映射为 page.*）
// 人工清单（语义复杂，不自动）：App.init / layout init、自定义 server、html.appIcon、
//   server.ssr.mode、webpack 自定义配置、modernConfig.runtime、非空/函数式 runtime、
//   applyBaseConfig(...) 包装下的结构性迁移（integration helper，标注「结构迁移未完成」）。

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SRC_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const ENTRY_EXTS = ['tsx', 'jsx', 'ts', 'js'];
const IGNORED = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.agents',
  'coverage',
]);

const changed = [];
const manual = [];
const note = (list, msg) => list.push(msg);

const readText = f => fs.readFileSync(f, 'utf8');
const exists = (...p) => fs.existsSync(path.join(...p));

function firstExistingFile(dir, basename) {
  return ENTRY_EXTS.map(ext => path.join(dir, `${basename}.${ext}`)).find(
    fs.existsSync,
  );
}

function listExistingFiles(dir, basename) {
  return ENTRY_EXTS.map(ext => path.join(dir, `${basename}.${ext}`)).filter(
    fs.existsSync,
  );
}

function detectEntryType(dir) {
  const src = path.join(dir, 'src');
  if (exists(src, 'routes')) return 'routes';
  if (exists(src, 'App.tsx') || exists(src, 'App.jsx')) return 'app';
  if (firstExistingFile(src, 'index')) return 'custom-index';
  if (exists(src, 'pages')) return 'pages';
  return 'unknown';
}

function collectRouteIndexFiles(src) {
  const routes = path.join(src, 'routes');
  const out = [];
  const walk = dir => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/^index\.(tsx|jsx|ts|js)$/.test(e.name)) out.push(full);
    }
  };
  walk(routes);
  return out;
}

// 迁移前快照（在任何改写前调用）。护栏只比对快照，**只拦截「迁移新生成」的违规结构**，
// 不误伤用户迁移前就存在的目录/文件（例如用户自己命名的 src/legacy-app）。
function createRoutesGuard(dir, entryType) {
  const src = path.join(dir, 'src');
  const routes = path.join(src, 'routes');
  const legacyDirsBefore = new Set(
    ['legacy-app', 'legacy-routes']
      .map(name => path.join(src, name))
      .filter(fs.existsSync),
  );
  return {
    isRoutesMode: entryType === 'routes',
    hadRootPage: Boolean(firstExistingFile(routes, 'page')),
    hadRootLayout: Boolean(firstExistingFile(routes, 'layout')),
    entryFilesBefore: new Set(listExistingFiles(src, 'entry')),
    legacyDirsBefore,
  };
}

function routeConventionErrors(dir, guard = null) {
  const src = path.join(dir, 'src');
  const routes = path.join(src, 'routes');
  if (!fs.existsSync(routes)) return [];
  const rel = file => path.relative(dir, file);
  const errors = [];
  const indexFiles = collectRouteIndexFiles(src);
  if (indexFiles.length) {
    errors.push(
      `v3 约定式路由不识别 routes/**/index.*，请改为 page.*：${indexFiles.map(rel).join(', ')}`,
    );
  }
  if (guard?.hadRootPage && !firstExistingFile(routes, 'page')) {
    errors.push('迁移前存在 src/routes/page.*，迁移后必须保留');
  }
  if (guard?.hadRootLayout && !firstExistingFile(routes, 'layout')) {
    errors.push('迁移前存在 src/routes/layout.*，迁移后必须保留');
  }
  // routes 入口模式才禁止「新生成」自定义入口；custom-index 模式下 index.*→entry.* 是官方正确迁移
  if (guard?.isRoutesMode) {
    const generatedEntry = listExistingFiles(src, 'entry').filter(
      f => !guard.entryFilesBefore.has(f),
    );
    if (generatedEntry.length) {
      errors.push(
        `routes 入口模式禁止凭空生成自定义入口：${generatedEntry.map(rel).join(', ')}`,
      );
    }
  }
  // 只拦截「迁移新生成」的 legacy-* 目录；用户迁移前就有的同名目录原样保留、不报错
  const before = guard?.legacyDirsBefore ?? new Set();
  const newLegacyDirs = ['legacy-app', 'legacy-routes']
    .map(name => path.join(src, name))
    .filter(p => fs.existsSync(p) && !before.has(p));
  if (newLegacyDirs.length) {
    errors.push(
      `迁移脚本不允许生成 legacy-* 目录：${newLegacyDirs.map(rel).join(', ')}`,
    );
  }
  return errors;
}

function assertRouteConventions(dir, guard = null) {
  const errors = routeConventionErrors(dir, guard);
  if (!errors.length) return;
  throw new Error(
    [
      '⛔ 迁移已中止：检测到不符合 Modern.js v3 的约定式路由结构。',
      ...errors.map(e => `- ${e}`),
      '请按 guides/basic-features/routes/routes：使用 routes/page.tsx 作为页面组件，layout.tsx 作为布局组件。',
    ].join('\n'),
  );
}

function parseVersion(v) {
  const m = String(v ?? '').match(/(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?/);
  if (!m) return null;
  return {
    raw: m[0],
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[0].includes('-'),
  };
}

function compareVersions(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

function resolveLatestV3Version() {
  const envVersion = process.env.MODERNJS_MIGRATE_LATEST_V3_VERSION;
  if (envVersion) {
    const parsed = parseVersion(envVersion);
    if (parsed?.major === 3 && !parsed.prerelease) {
      return {
        version: parsed.raw,
        source: 'env:MODERNJS_MIGRATE_LATEST_V3_VERSION',
      };
    }
    throw new Error(
      `MODERNJS_MIGRATE_LATEST_V3_VERSION 必须是稳定 v3 版本，当前为：${envVersion}`,
    );
  }

  let stdout;
  try {
    stdout = execFileSync(
      'npm',
      ['view', '@modern-js/app-tools@3', 'version', '--json'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
      },
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      [
        '无法检测 @modern-js/app-tools 最新 v3 版本。',
        '请确认当前环境可访问 npm registry，或显式传入 --to=<最新 v3 版本>。',
        `原始错误：${detail}`,
      ].join('\n'),
    );
  }

  let data;
  try {
    data = JSON.parse(stdout);
  } catch {
    data = stdout.trim();
  }
  const versions = (Array.isArray(data) ? data : [data])
    .map(parseVersion)
    .filter(v => v?.major === 3 && !v.prerelease)
    .sort(compareVersions);
  const latest = versions.at(-1);
  if (!latest) {
    throw new Error(
      'npm registry 未返回 @modern-js/app-tools 的稳定 v3 版本，请显式传入 --to=<最新 v3 版本>。',
    );
  }
  return { version: latest.raw, source: 'npm:@modern-js/app-tools@3' };
}

function resolveTargetVersion(args) {
  const toArg = args.find(a => a.startsWith('--to='));
  if (toArg) {
    const parsed = parseVersion(toArg.split('=')[1]);
    if (!parsed?.raw || parsed.major !== 3) {
      throw new Error(
        `--to 必须是有效 v3 版本号，当前为：${toArg.split('=')[1]}`,
      );
    }
    return { version: parsed.raw, source: 'explicit' };
  }
  return resolveLatestV3Version();
}

// monorepo / 非语义化版本协议：随 monorepo 整体升级解析，不该被改写成固定版本号
const WORKSPACE_PROTO = /^(workspace:|link:|catalog:|file:|portal:|npm:|\*$)/;
const isWorkspaceProto = v =>
  v != null && WORKSPACE_PROTO.test(String(v).trim());

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

// 把注释（//、/* */）和字符串/模板字面量的**内容**替换为等长空白（保留换行、引号、长度
// 与字符索引 1:1）。所有结构定位（配置对象、括号配平、顶层逗号、信号匹配）都基于 masked，
// 但真实内容仍按相同索引从原文取——避免注释/字符串里的 defineConfig({...}) / { } / 逗号 误导。
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

// 只剥离注释、**保留字符串原样**（等长），用于需要字符串「值」的判断（如 ssr.mode: 'string'）。
// 字符串内的 // 不当注释处理。
function maskComments(code) {
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
          out += code[i] + (code[i + 1] ?? '');
          i += 2;
          continue;
        }
        out += code[i];
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

// 单一扫描器：逐字符扫描 code，对每个**真实模块 specifier**（import/export-from/side-effect
// import/dynamic import/require 的字符串）调用 visit({ content, open, close, quote })，
// open/close 为该字符串的引号下标（含引号）。注释只跳过、**不重置 import 上下文**（保证
// `import(/* magic */ '...')` 这类也能识别）；普通字符串文本（非 import 位置）不回调。
// importSpecifiers / mapImportSpecifiers / tailwind 删除全部基于它，确保检测与改写完全一致。
function eachModuleSpecifier(code, visit) {
  const n = code.length;
  let i = 0;
  let acc = ''; // 最近的代码片段（不含注释/字符串），用于判定字符串是否处于 import 位置
  while (i < n) {
    const c = code[i];
    const c2 = code[i + 1];
    if (c === '/' && c2 === '/') {
      while (i < n && code[i] !== '\n') i += 1;
      continue; // 跳过注释，acc 不变（保留前置 import(/from/require 上下文）
    }
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i += 1;
      i = Math.min(i + 2, n);
      continue; // 同上，acc 不变
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      const open = i;
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
      const close = j; // 闭合引号下标（未闭合时为 n）
      // 分类 import 上下文：dynamic（import(...)）/ require（require(...)）/ static（from / 副作用 import）
      let kind = null;
      if (/\bimport\s*\(\s*$/.test(acc)) kind = 'dynamic';
      else if (/\brequire\s*\(\s*$/.test(acc)) kind = 'require';
      else if (/\bfrom\s*$/.test(acc) || /\bimport\s*$/.test(acc))
        kind = 'static';
      if (kind) {
        visit({ content, open, close, quote, kind });
      }
      i = j + 1;
      acc = '';
      continue;
    }
    acc += c;
    if (acc.length > 32) acc = acc.slice(-32);
    i += 1;
  }
}

// 真实模块 specifier 列表（仅用于检测）
function importSpecifiers(code) {
  const specs = [];
  eachModuleSpecifier(code, ({ content }) => specs.push(content));
  return specs;
}

// 改写真实模块 specifier：mapper(spec) 返回新 spec 则替换、返回 null 则保留。
// 基于 specifier range 替换，注释/普通字符串原样保留。
function mapImportSpecifiers(code, mapper) {
  const edits = [];
  eachModuleSpecifier(code, ({ content, open, close, quote }) => {
    const mapped = mapper(content);
    if (mapped != null && mapped !== content) {
      edits.push({ open, close, text: quote + mapped + quote });
    }
  });
  if (!edits.length) return { code, changed: false };
  let out = code;
  // 从后往前替换，避免下标偏移
  edits.sort((a, b) => b.open - a.open);
  for (const e of edits) {
    out = out.slice(0, e.open) + e.text + out.slice(e.close + 1);
  }
  return { code: out, changed: true };
}

// 取对象字面量 `{...}` 的顶层属性片段（忽略嵌套/注释/字符串），用于只识别顶层字段
function topLevelProps(body) {
  const inner = body.slice(1, -1);
  const masked = maskCommentsAndStrings(inner); // 与 inner 等长，定位用
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < masked.length; i++) {
    const ch = masked[i];
    if (ch === '{' || ch === '[' || ch === '(') depth += 1;
    else if (ch === '}' || ch === ']' || ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      parts.push(inner.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(inner.slice(start));
  return parts.map(p => p.trim()).filter(Boolean);
}

// 从 `{` 处做花括号配平（忽略注释/字符串里的花括号），返回对象字面量文本与结束位置。
// 配平基于 masked，body 仍取原文。
function extractBalanced(text, startIdx, maskedText) {
  const masked = maskedText ?? maskCommentsAndStrings(text);
  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    const c = masked[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return { body: text.slice(startIdx, i + 1), end: i + 1 };
    }
  }
  return null;
}

// 定位顶层配置对象字面量的起始 `{` 下标，兼容：
//   defineConfig({  /  defineConfig<'rspack'>({  /  export default {  /  module.exports = {
// 在 masked（注释/字符串已剥离）上匹配，索引对原文有效。
// 函数式/动态（defineConfig(() => ({...}))）返回 -1，交调用方走 manual。
function locateConfigObjStart(code, maskedText) {
  const masked = maskedText ?? maskCommentsAndStrings(code);
  const dcObj = masked.match(/defineConfig\s*(?:<[^>]*>)?\s*\(\s*\{/);
  if (dcObj) return dcObj.index + dcObj[0].length - 1;
  const ed = masked.match(/export\s+default\s*\{/);
  if (ed) return ed.index + ed[0].length - 1;
  const me = masked.match(/module\.exports\s*=\s*\{/);
  if (me) return me.index + me[0].length - 1;
  return -1;
}

// 在配置对象 [objStart, objEnd) 内查找**顶层**（相对配置对象括号深度为 0）的 `key: {`，
// 返回 { keyStart, brace }（brace 为 `{` 下标）或 null。基于 masked，注释/字符串里的 key 不算。
function findTopLevelKey(masked, objStart, objEnd, key) {
  const re = new RegExp(`\\b${key}\\s*:\\s*\\{`, 'g');
  let m = re.exec(masked);
  while (m !== null) {
    const idx = m.index;
    if (idx > objStart && idx < objEnd) {
      let d = 0;
      for (let i = objStart + 1; i < idx; i++) {
        const ch = masked[i];
        if (ch === '{' || ch === '[' || ch === '(') d += 1;
        else if (ch === '}' || ch === ']' || ch === ')') d -= 1;
      }
      if (d === 0) return { keyStart: idx, brace: idx + m[0].length - 1 };
    }
    m = re.exec(masked);
  }
  return null;
}

// 把 bffPlugin() **追加到** 顶层 plugins 数组末尾（保留原插件顺序，避免插到 appTools 之前）
function appendToPluginsArray(prop, call) {
  const arrStart = prop.indexOf('[');
  if (arrStart === -1) return null;
  let depth = 0;
  let arrEnd = -1;
  for (let i = arrStart; i < prop.length; i++) {
    if (prop[i] === '[') depth += 1;
    else if (prop[i] === ']') {
      depth -= 1;
      if (depth === 0) {
        arrEnd = i;
        break;
      }
    }
  }
  if (arrEnd === -1) return null;
  // 去掉尾随逗号（如 tailwind 移除后残留的 `appTools(), `），避免 append 后出现双逗号
  const inner = prop
    .slice(arrStart + 1, arrEnd)
    .trim()
    .replace(/,\s*$/, '');
  const newInner = inner ? `${inner}, ${call}` : call;
  return `${prop.slice(0, arrStart)}[${newInner}]${prop.slice(arrEnd + 1)}`;
}

// ---- 1) 依赖 ----
// opts.keepTailwindDep=true 时保留 @modern-js/plugin-tailwindcss（config 用 dynamic import/require
// 等不安全方式引用、无法自动迁移时，不删依赖以免加载缺模块，交 manual）
function migrateDeps(dir, toVersion, opts = {}) {
  const file = path.join(dir, 'package.json');
  const pkg = JSON.parse(readText(file));
  let bumped = false;
  let tailwindRemoved = false;
  let serverPluginRemoved = false;
  const skippedWorkspace = new Set();
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg[field];
    if (!deps) continue;
    if (deps['@modern-js/plugin-tailwindcss'] && !opts.keepTailwindDep) {
      delete deps['@modern-js/plugin-tailwindcss'];
      tailwindRemoved = true;
    }
    // v3 不再有独立的 @modern-js/plugin-server（自定义 server 内置于 server-runtime）
    if (deps['@modern-js/plugin-server']) {
      delete deps['@modern-js/plugin-server'];
      serverPluginRemoved = true;
    }
    for (const name of Object.keys(deps)) {
      if (!name.startsWith('@modern-js/')) continue;
      // 保留的 plugin-tailwindcss 不升版本（v3 无此包，升到 3.0.0 会指向不存在版本）
      if (name === '@modern-js/plugin-tailwindcss') continue;
      // workspace/link/catalog 协议：随 monorepo 升级，不改成固定版本（否则破坏 workspace 链接）
      if (isWorkspaceProto(deps[name])) {
        skippedWorkspace.add(name);
        continue;
      }
      if (deps[name] !== toVersion) {
        deps[name] = toVersion;
        bumped = true;
      }
    }
  }
  if (bumped || tailwindRemoved || serverPluginRemoved) {
    fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
    const parts = [];
    if (bumped) parts.push(`@modern-js/* 升到 ${toVersion}`);
    if (tailwindRemoved) parts.push('移除 @modern-js/plugin-tailwindcss');
    if (serverPluginRemoved)
      parts.push('移除 @modern-js/plugin-server（v3 内置）');
    note(changed, `依赖：${parts.join('，')}`);
  }
  if (skippedWorkspace.size) {
    note(
      manual,
      `workspace/link/catalog 协议依赖未改版本（随 monorepo 整体升级到 v3）：${[...skippedWorkspace].join(', ')}`,
    );
  }
}

function removeRemovedModernScripts(dir) {
  const file = path.join(dir, 'package.json');
  const pkg = JSON.parse(readText(file));
  if (!pkg.scripts) return;
  const removed = [];
  for (const [name, command] of Object.entries(pkg.scripts)) {
    if (/^modern\s+(?:new|upgrade)(?:\s|$)/.test(String(command).trim())) {
      delete pkg.scripts[name];
      removed.push(name);
    }
  }
  if (!removed.length) return;
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  note(
    changed,
    `package.json scripts：移除 v3 不再支持的 modern new/upgrade（${removed.join(', ')}）`,
  );
}

// ---- 2) import 路径映射 ----
// 只改**真实 module specifier**（import/export-from/dynamic import/require），注释/普通字符串
// 里的 @modern-js/runtime/bff|server 原样保留；flags 也只在真 specifier 命中时置位，
// 避免误补依赖 / 误加 bffPlugin()。
function migrateImportPaths(files) {
  const map = [
    // v3 @modern-js/plugin-bff exports 仅 ./cli ./server ./server-plugin ./client（无 ./runtime）
    ['@modern-js/runtime/bff', '@modern-js/plugin-bff/client', 'bff'],
    ['@modern-js/runtime/server', '@modern-js/server-runtime', 'server'],
  ];
  const hit = [];
  const flags = { bff: false, server: false };
  for (const f of files) {
    const { code, changed: c } = mapImportSpecifiers(readText(f), spec => {
      for (const [from, to, flag] of map) {
        if (spec === from || spec.startsWith(`${from}/`)) {
          flags[flag] = true;
          return to + spec.slice(from.length);
        }
      }
      return null;
    });
    if (c) {
      fs.writeFileSync(f, code);
      hit.push(path.basename(f));
    }
  }
  if (hit.length) note(changed, `import 路径映射：${hit.join(', ')}`);
  return flags;
}

// import 改到新包后，补充对应依赖，否则 install/build 失败。版本协议处理：
//   - 普通 semver：用 toVersion
//   - workspace: / catalog:（**名称无关**协议，由 key 决定包）：复用现有 app-tools/runtime 的 spec
//   - link: / file: / portal: / npm:（**指向具体包路径/别名**）：不能把 app-tools 的目标写给别的包，
//     否则会指错路径 → 不写依赖，进 manual 提示手动添加正确协议
function ensureMappedDeps(dir, toVersion, flags) {
  const verOf = (pkg, name) =>
    pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  const file = path.join(dir, 'package.json');
  const pkg = JSON.parse(readText(file));
  pkg.dependencies = pkg.dependencies || {};
  // 参考协议：优先 app-tools，其次 runtime
  const refVer =
    verOf(pkg, '@modern-js/app-tools') ?? verOf(pkg, '@modern-js/runtime');
  const refStr = refVer == null ? '' : String(refVer).trim();
  // 名称无关、可安全复用的协议
  const reusable = /^(workspace:|catalog:)/.test(refStr);
  // 指向具体路径/别名、不可复用的协议（虽在保留范围内，但不能照搬给别的包）
  const pathPinned = !reusable && isWorkspaceProto(refStr);
  const addVer = reusable ? refStr : toVersion;
  const added = [];
  const manualAdd = [];
  const want = (flag, name) => {
    if (!flag || verOf(pkg, name) != null) return;
    if (pathPinned) {
      manualAdd.push(name);
      return;
    }
    pkg.dependencies[name] = addVer;
    added.push(name);
  };
  want(flags.bff, '@modern-js/plugin-bff');
  want(flags.server, '@modern-js/server-runtime');
  if (added.length) {
    fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
    note(changed, `补充依赖（${addVer}）：${added.join(', ')}`);
  }
  if (manualAdd.length) {
    note(
      manual,
      `现有 @modern-js 依赖用 ${refStr.split(':')[0]}: 协议（指向具体包路径/别名，无法照搬给别的包）：请手动添加 ${manualAdd.join(', ')} 的正确依赖协议`,
    );
  }
}

// 启用 BFF 后，modern.config 需 import 并加入 bffPlugin()
function addBffPlugin(dir, flags) {
  if (!flags.bff) return;
  const configFile = [
    'modern.config.ts',
    'modern.config.js',
    'modern.config.mjs',
  ].find(f => exists(dir, f));
  if (!configFile) return;
  const file = path.join(dir, configFile);
  let code = readText(file);

  // applyBaseConfig 包装的配置（integration helper / 非标准用户配置）：结构性改写交人工，
  // 统一由 migrateRuntimeBlock 记 manual，这里直接跳过，避免半自动改坏顶层 plugins
  if (/\bapplyBaseConfig\s*\(/.test(maskCommentsAndStrings(code))) return;

  // 识别已有 @modern-js/plugin-bff import（单/双引号皆可），取 bffPlugin 的本地名（含 alias）
  const importMatch = code.match(
    /import\s*\{([^}]*)\}\s*from\s*['"]@modern-js\/plugin-bff['"]/,
  );
  let localName = 'bffPlugin';
  const hasImport = Boolean(importMatch);
  if (importMatch) {
    const aliasMatch = importMatch[1].match(/\bbffPlugin\b(?:\s+as\s+(\w+))?/);
    if (!aliasMatch) {
      note(
        manual,
        '已 import @modern-js/plugin-bff 但未导入 bffPlugin，请手动把 bffPlugin() 加进 plugins',
      );
      return;
    }
    localName = aliasMatch[1] || 'bffPlugin';
  }
  // 已经调用了对应插件就跳过
  if (new RegExp(`\\b${localName}\\s*\\(`).test(code)) return;
  // 没有 import 才补一行（避免重复 import 造成 duplicate identifier）
  if (!hasImport) {
    code = code.replace(
      /(import[^\n]*\n)/,
      `$1import { bffPlugin } from '@modern-js/plugin-bff';\n`,
    );
  }
  // v3 顶层 plugins 必含 appTools()；若未 import 但能在 @modern-js/app-tools import 上补则补，
  // 补不了（无 app-tools import）就进 manual 且不写半成品 plugins
  let hasAppTools = /\bappTools\b/.test(code);
  if (!hasAppTools) {
    const appToolsImp = code.match(
      /import\s*\{([^}]*)\}\s*from\s*['"]@modern-js\/app-tools['"]/,
    );
    if (appToolsImp) {
      const ns = appToolsImp[1]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      ns.unshift('appTools');
      code = code.replace(
        appToolsImp[0],
        `import { ${ns.join(', ')} } from '@modern-js/app-tools'`,
      );
      hasAppTools = true;
      note(changed, '配置：在 @modern-js/app-tools import 上补 appTools');
    }
  }
  // 只改顶层 plugins（避免误命中 tools.postcss.postcssOptions.plugins 等嵌套）
  const objStart = locateConfigObjStart(code);
  if (objStart === -1) {
    note(
      manual,
      '无法定位顶层配置对象（defineConfig/module.exports/export default），请手动把 bffPlugin() 加进顶层 plugins',
    );
    return;
  }
  const obj = extractBalanced(code, objStart);
  if (!obj) {
    note(
      manual,
      'modern.config 解析失败，请手动把 bffPlugin() 加进顶层 plugins',
    );
    return;
  }
  const props = topLevelProps(obj.body);
  const pluginsIdx = props.findIndex(p => /^plugins\s*:/.test(p));
  let newProps;
  if (pluginsIdx !== -1) {
    // 追加到 plugins 末尾（保留原顺序，得到 [..., bffPlugin()] 而非前插）
    const appended = appendToPluginsArray(props[pluginsIdx], `${localName}()`);
    if (!appended) {
      note(
        manual,
        'modern.config 顶层 plugins 解析失败，请手动把 bffPlugin() 加进 plugins',
      );
      return;
    }
    newProps = props.map((p, i) => (i === pluginsIdx ? appended : p));
    if (!/\bappTools\s*\(/.test(newProps[pluginsIdx])) {
      note(
        manual,
        'modern.config 顶层 plugins 缺少 appTools()，请按 v3 模板补上',
      );
    }
  } else if (!hasAppTools) {
    // 无 plugins 数组且无法补 appTools import：不写半成品，交人工
    note(
      manual,
      'BFF 已启用但无法定位/补充 appTools import：请手动添加 plugins: [appTools(), bffPlugin()]',
    );
    return;
  } else {
    newProps = [`plugins: [appTools(), ${localName}()]`, ...props];
  }
  const newObj = newProps.length ? `{\n  ${newProps.join(',\n  ')},\n}` : '{}';
  code = code.slice(0, objStart) + newObj + code.slice(obj.end);

  if (new RegExp(`${localName}\\s*\\(\\s*\\)`).test(newObj)) {
    fs.writeFileSync(file, code);
    note(changed, '配置：添加 bffPlugin()');
  } else {
    note(
      manual,
      'BFF 已启用但无法自动写入 modern.config 顶层 plugins，请手动加 bffPlugin()',
    );
  }
}

// ---- 3) 配置：dev.port→server.port、移除 tailwind 插件 ----
function migrateConfig(dir) {
  const configFile = [
    'modern.config.ts',
    'modern.config.js',
    'modern.config.mjs',
  ].find(f => exists(dir, f));
  if (!configFile) return false;
  const file = path.join(dir, configFile);
  let code = readText(file);
  const before = code;
  let hadTailwind = false;

  // 所有结构定位都基于 masked（注释/字符串里的 dev:/server:/applyBaseConfig 不参与），改写落原文同索引
  const masked = maskCommentsAndStrings(code);
  // applyBaseConfig 包装：dev.port 这类结构性迁移交人工（由 migrateRuntimeBlock 统一记 manual），
  // 这里只做 tailwind 等安全的移除
  const wrapped = /\bapplyBaseConfig\s*\(/.test(masked);

  // dev.port -> server.port：**只迁配置对象顶层** dev.port（嵌套如 tools.dev.port / dev.client.port 不动）
  const objStart = wrapped ? -1 : locateConfigObjStart(code, masked);
  const obj = objStart !== -1 ? extractBalanced(code, objStart, masked) : null;
  const devKey = obj ? findTopLevelKey(masked, objStart, obj.end, 'dev') : null;
  if (devKey) {
    const block = extractBalanced(code, devKey.brace, masked);
    if (!block) {
      note(manual, 'dev 块解析失败：dev.port 需人工迁到 server.port');
    } else {
      // 只识别 dev 块**自身顶层**的 port；嵌套（dev.client.port）不动
      const props = topLevelProps(block.body);
      const portIdx = props.findIndex(p => /^['"]?port['"]?\s*:/.test(p));
      if (portIdx !== -1) {
        const port = props[portIdx]
          .slice(props[portIdx].indexOf(':') + 1)
          .trim();
        const rest = props.filter((_, i) => i !== portIdx);
        if (rest.length) {
          // dev 还有其它字段：保留 dev 块、仅去掉 port
          code = `${code.slice(0, devKey.keyStart)}dev: { ${rest.join(', ')} }${code.slice(block.end)}`;
        } else {
          // dev 仅有 port → 整块移除，并**按位置**吞掉紧邻的一个逗号（优先块后、否则块前），
          // 避免留下悬挂逗号导致 config 解析失败（不能用全局正则，会误删别处的 ,\n）
          let s = devKey.keyStart;
          let e = block.end;
          const dm = maskCommentsAndStrings(code);
          let k = e;
          while (k < dm.length && /[ \t]/.test(dm[k])) k += 1;
          if (dm[k] === ',') {
            e = k + 1;
          } else {
            let p = s - 1;
            while (p >= 0 && /\s/.test(dm[p])) p -= 1;
            if (dm[p] === ',') s = p;
          }
          code = code.slice(0, s) + code.slice(e);
        }
        // 重新 mask + 定位配置对象，注入到**顶层** server（注释/嵌套 server 不算）
        const masked2 = maskCommentsAndStrings(code);
        const objStart2 = locateConfigObjStart(code, masked2);
        const obj2 =
          objStart2 !== -1 ? extractBalanced(code, objStart2, masked2) : null;
        const srvKey = obj2
          ? findTopLevelKey(masked2, objStart2, obj2.end, 'server')
          : null;
        if (srvKey) {
          const at = srvKey.brace + 1;
          code = `${code.slice(0, at)} port: ${port},${code.slice(at)}`;
          note(changed, 'dev.port → server.port');
        } else if (objStart2 !== -1) {
          code = `${code.slice(0, objStart2 + 1)}\n  server: { port: ${port} },${code.slice(objStart2 + 1)}`;
          note(changed, 'dev.port → server.port');
        } else {
          note(
            manual,
            'dev.port 已识别但无法定位配置对象注入 server：请手动迁到 server.port',
          );
        }
      }
    }
  }

  // 移除 tailwind 插件：真实 import 行 + 真实 plugins 数组里的 tailwindcssPlugin() 调用（不动注释/字符串示例）
  const maskedTw = maskCommentsAndStrings(code);
  const hasTwImport = importSpecifiers(code).includes(
    '@modern-js/plugin-tailwindcss',
  );
  if (hasTwImport || /\btailwindcssPlugin\s*\(/.test(maskedTw)) {
    hadTailwind = true;
    // 1) 移除真实 tailwindcssPlugin() 调用，并**顺带吞掉紧邻的一个逗号**（优先后、否则前），
    //    全部基于 masked 真实代码位置定位、原文同索引删除；不动字符串/注释、不做全文 replace。
    const reTw = /tailwindcssPlugin\s*\(\s*\)/g;
    const callRanges = [];
    let mm = reTw.exec(maskedTw);
    while (mm !== null) {
      let s = mm.index;
      let e = mm.index + mm[0].length;
      let k = e;
      while (k < maskedTw.length && /[ \t]/.test(maskedTw[k])) k += 1;
      if (maskedTw[k] === ',') {
        e = k + 1; // 吞掉后面的逗号 + 其后空格
        while (e < maskedTw.length && /[ \t]/.test(maskedTw[e])) e += 1;
      } else {
        let p = s - 1;
        while (p >= 0 && /\s/.test(maskedTw[p])) p -= 1;
        if (maskedTw[p] === ',') s = p; // 末元素：吞掉前面的逗号
      }
      callRanges.push([s, e]);
      mm = reTw.exec(maskedTw);
    }
    for (let k = callRanges.length - 1; k >= 0; k -= 1) {
      code = code.slice(0, callRanges[k][0]) + code.slice(callRanges[k][1]);
    }
    // 2) 移除真实的 @modern-js/plugin-tailwindcss import。**只处理 static import/export**：
    //    按 scanner 的真实 specifier offset 反推完整声明 range（支持多行）整条删除。
    //    dynamic import / require 这类无法安全删语句 → 不动、进 manual（依赖也由 main 保留）。
    const masked2 = maskCommentsAndStrings(code);
    const stmtRanges = [];
    let unsafeTw = false;
    eachModuleSpecifier(code, ({ content, open, close, kind }) => {
      if (content !== '@modern-js/plugin-tailwindcss') return;
      if (kind !== 'static') {
        unsafeTw = true;
        return;
      }
      // 声明起点：specifier 前最近的 import/export 关键字（masked 词边界）+ 吞同行前导缩进
      let start = -1;
      const re = /\b(?:import|export)\b/g;
      let km = re.exec(masked2);
      while (km !== null) {
        if (km.index >= open) break;
        start = km.index;
        km = re.exec(masked2);
      }
      if (start === -1) return;
      while (
        start > 0 &&
        (code[start - 1] === ' ' || code[start - 1] === '\t')
      ) {
        start -= 1;
      }
      // 声明终点：闭引号后跳过可选 `;` 与行尾换行
      let end = close + 1;
      while (end < code.length && /[ \t]/.test(code[end])) end += 1;
      if (code[end] === ';') end += 1;
      if (code[end] === '\r') end += 1;
      if (code[end] === '\n') end += 1;
      stmtRanges.push([start, end]);
    });
    stmtRanges.sort((a, b) => b[0] - a[0]);
    for (const [s, e] of stmtRanges) code = code.slice(0, s) + code.slice(e);
    if (unsafeTw) {
      note(
        manual,
        'modern.config 用 dynamic import / require 引用 @modern-js/plugin-tailwindcss：无法安全自动删除（依赖已保留），请手动改为 Rsbuild 原生 Tailwind 并移除该引用与依赖',
      );
    }
  }

  if (code !== before) {
    fs.writeFileSync(file, code);
    if (hadTailwind) note(changed, `配置 ${configFile}：移除 tailwind 插件`);
  }
  return hadTailwind;
}

// ---- 3b) v3 配置项改名（依据 guides/upgrade/config.mdx）----
// 拆顶层属性 `key: value` → { key, val }（key 去引号；基于 masked 定位冒号）。函数式简写（无顶层冒号）返回 null。
function splitProp(prop) {
  const m = maskCommentsAndStrings(prop);
  const ci = m.indexOf(':');
  if (ci === -1) return null;
  // 冒号若在括号/方括号内（如方法简写 `foo(a): b` 不会发生，但防御）则视为非简单属性
  const key = prop
    .slice(0, ci)
    .trim()
    .replace(/^['"]|['"]$/g, '');
  return { key, val: prop.slice(ci + 1).trim() };
}
function negateBoolLiteral(val) {
  const v = val.trim();
  if (/^true$/.test(v)) return 'false';
  if (/^false$/.test(v)) return 'true';
  return null; // 非布尔字面量 → 调用方走 manual
}
// 结构化转换某个**顶层块**（如 output/source/html/tools）的属性：mapper(prop)→ string(替换) | null(删除) | undefined(保留原样)。
// 整块属性清空时连块一起删除并吞掉紧邻逗号。基于 masked 定位，注释/字符串/嵌套不参与。
function transformConfigBlock(code, blockKey, mapper) {
  const masked = maskCommentsAndStrings(code);
  const objStart = locateConfigObjStart(code, masked);
  if (objStart === -1) return code;
  const obj = extractBalanced(code, objStart, masked);
  if (!obj) return code;
  const blk = findTopLevelKey(masked, objStart, obj.end, blockKey);
  if (!blk) return code;
  const block = extractBalanced(code, blk.brace, masked);
  if (!block) return code;
  const props = topLevelProps(block.body);
  const out = [];
  for (const p of props) {
    const r = mapper(p);
    if (r === null) continue;
    out.push(r === undefined ? p : r);
  }
  const rebuilt = out.length ? `${blockKey}: { ${out.join(', ')} }` : '';
  let s = blk.keyStart;
  let e = block.end;
  if (!rebuilt) {
    const dm = maskCommentsAndStrings(code);
    let k = e;
    while (k < dm.length && /[ \t]/.test(dm[k])) k += 1;
    if (dm[k] === ',') {
      e = k + 1;
    } else {
      let q = s - 1;
      while (q >= 0 && /\s/.test(dm[q])) q -= 1;
      if (dm[q] === ',') s = q;
    }
  }
  return code.slice(0, s) + rebuilt + code.slice(e);
}

// 移除顶层 plugins 数组里的某个插件调用（如 serverPlugin()）+ 其 static import；按 masked 真实位置改写。
function removeNamedPluginAndImport(input, callName, pkg) {
  let code = input;
  let masked = maskCommentsAndStrings(code);
  // 1) 删调用 `callName()`（吞紧邻逗号，优先后、否则前）
  const reCall = new RegExp(`\\b${callName}\\s*\\(\\s*\\)`, 'g');
  const ranges = [];
  let m = reCall.exec(masked);
  while (m !== null) {
    let s = m.index;
    let e = m.index + m[0].length;
    let k = e;
    while (k < masked.length && /[ \t]/.test(masked[k])) k += 1;
    if (masked[k] === ',') {
      e = k + 1;
      while (e < masked.length && /[ \t]/.test(masked[e])) e += 1;
    } else {
      let p = s - 1;
      while (p >= 0 && /\s/.test(masked[p])) p -= 1;
      if (masked[p] === ',') s = p;
    }
    ranges.push([s, e]);
    m = reCall.exec(masked);
  }
  for (let i = ranges.length - 1; i >= 0; i -= 1) {
    code = code.slice(0, ranges[i][0]) + code.slice(ranges[i][1]);
  }
  // 2) 删该 pkg 的 static import 整条声明
  masked = maskCommentsAndStrings(code);
  const stmt = [];
  eachModuleSpecifier(code, ({ content, open, close, kind }) => {
    if (content !== pkg || kind !== 'static') return;
    let start = -1;
    const re = /\b(?:import|export)\b/g;
    let km = re.exec(masked);
    while (km !== null) {
      if (km.index >= open) break;
      start = km.index;
      km = re.exec(masked);
    }
    if (start === -1) return;
    while (start > 0 && (code[start - 1] === ' ' || code[start - 1] === '\t')) {
      start -= 1;
    }
    let end = close + 1;
    while (end < code.length && /[ \t]/.test(code[end])) end += 1;
    if (code[end] === ';') end += 1;
    if (code[end] === '\r') end += 1;
    if (code[end] === '\n') end += 1;
    stmt.push([start, end]);
  });
  stmt.sort((a, b) => b[0] - a[0]);
  for (const [s, e] of stmt) code = code.slice(0, s) + code.slice(e);
  return code;
}

function migrateV3ConfigKeys(dir) {
  const configFile = [
    'modern.config.ts',
    'modern.config.js',
    'modern.config.mjs',
  ].find(f => exists(dir, f));
  if (!configFile) return;
  const file = path.join(dir, configFile);
  let code = readText(file);
  const before = code;

  // output：字段改名（依据 config.mdx）。负向布尔需取反；非布尔字面量进 manual 不乱改。
  const negKeys = {
    disableFilenameHash: 'filenameHash',
    disableMinimize: 'minify',
    disableSourceMap: 'sourceMap',
  };
  const directKeys = {
    disableCssExtract: 'injectStyles',
    enableInlineScripts: 'inlineScripts',
    enableInlineStyles: 'inlineStyles',
  };
  code = transformConfigBlock(code, 'output', prop => {
    const sp = splitProp(prop);
    if (!sp) return undefined;
    if (sp.key === 'cssModuleLocalIdentName') {
      return `cssModules: { localIdentName: ${sp.val} }`;
    }
    if (directKeys[sp.key]) return `${directKeys[sp.key]}: ${sp.val}`;
    if (negKeys[sp.key]) {
      const n = negateBoolLiteral(sp.val);
      if (n === null) {
        note(
          manual,
          `output.${sp.key} 值非布尔字面量：请手动改为 output.${negKeys[sp.key]}（取反）`,
        );
        return undefined;
      }
      return `${negKeys[sp.key]}: ${n}`;
    }
    if (sp.key === 'enableLatestDecorators') {
      if (/^false$/.test(sp.val.trim())) return null; // 默认值，直接移除
      note(
        manual,
        'output.enableLatestDecorators=true → 改用 source.decorators: { version: "2022-03" }（见 config.mdx）',
      );
      return null;
    }
    return undefined;
  });

  // source：废弃字段。直接移除类；语义迁移类（resolve*）移除并记 manual。
  code = transformConfigBlock(code, 'source', prop => {
    const sp = splitProp(prop);
    if (!sp) return undefined;
    if (
      ['moduleScopes', 'enableCustomEntry', 'disableEntryDirs'].includes(sp.key)
    ) {
      return null;
    }
    if (sp.key === 'resolveMainFields') {
      note(
        manual,
        'source.resolveMainFields 已废弃 → 改用 resolve.mainFields（见 config.mdx）',
      );
      return null;
    }
    if (sp.key === 'resolveExtensionPrefix') {
      note(
        manual,
        'source.resolveExtensionPrefix 已废弃 → 改用 resolve.extensions（语义不同，请人工确认，见 config.mdx）',
      );
      return null;
    }
    return undefined;
  });

  // html：appIcon 字符串→对象；disableHtmlFolder→outputStructure；xxxByEntries→函数（复杂，记 manual）
  code = transformConfigBlock(code, 'html', prop => {
    const sp = splitProp(prop);
    if (!sp) return undefined;
    if (sp.key === 'appIcon' && /^['"`]/.test(sp.val.trim())) {
      return `appIcon: { icons: [{ src: ${sp.val.trim()}, size: 180 }] }`;
    }
    if (sp.key === 'disableHtmlFolder') {
      const v = sp.val.trim();
      if (/^true$/.test(v)) return `outputStructure: 'flat'`;
      if (/^false$/.test(v)) return `outputStructure: 'nested'`;
      note(
        manual,
        'html.disableHtmlFolder 值非布尔字面量 → 请手动改为 html.outputStructure',
      );
      return undefined;
    }
    if (/ByEntries$/.test(sp.key) || /ByEnties$/.test(sp.key)) {
      note(
        manual,
        `html.${sp.key} 已废弃 → 改用 html.${sp.key.replace(/By(Entries|Enties)$/, '')}({ entryName }) 函数语法（见 config.mdx）`,
      );
      return null;
    }
    return undefined;
  });

  // tools：webpack→rspack、webpackChain→bundlerChain（方法简写，改首个标识符）；devServer 拆分记 manual
  code = transformConfigBlock(code, 'tools', prop => {
    const mt = maskCommentsAndStrings(prop).trimStart();
    if (/^webpackChain\b/.test(mt)) {
      return prop.replace(/^(\s*)webpackChain/, '$1bundlerChain');
    }
    if (/^webpack\b/.test(mt)) {
      return prop.replace(/^(\s*)webpack/, '$1rspack');
    }
    if (/^devServer\b/.test(mt)) {
      note(
        manual,
        'tools.devServer 已废弃 → client/hot/compress/headers/historyApiFallback/devMiddleware 等需拆到 dev.* / dev.server.*（见 config.mdx）',
      );
      return null;
    }
    return undefined;
  });

  // 移除 v3 已废的 serverPlugin() 调用 + @modern-js/plugin-server import
  const maskedAll = maskCommentsAndStrings(code);
  if (
    /\bserverPlugin\s*\(/.test(maskedAll) ||
    importSpecifiers(code).includes('@modern-js/plugin-server')
  ) {
    code = removeNamedPluginAndImport(
      code,
      'serverPlugin',
      '@modern-js/plugin-server',
    );
    note(
      changed,
      `配置 ${configFile}：移除 v3 已废的 serverPlugin()（自定义 server 改用 server/modern.server.ts）`,
    );
  }

  if (code !== before) {
    fs.writeFileSync(file, code);
    note(
      changed,
      `配置 ${configFile}：v3 配置项改名（output/source/html/tools，见 config.mdx）`,
    );
  }
}

// 从 `appTools(...)` 调用里**只删 bundler 参数**（v3 默认 Rspack，不再接受 bundler），
// 保留其它选项与别的 plugin 参数；返回 {code, changed}
function stripAppToolsBundler(code) {
  const masked = maskCommentsAndStrings(code);
  const m = masked.match(/\bappTools\s*\(/);
  if (!m) return { code, changed: false };
  const open = m.index + m[0].length - 1; // '(' 的下标
  let depth = 0;
  let close = -1;
  for (let i = open; i < masked.length; i++) {
    if (masked[i] === '(') depth += 1;
    else if (masked[i] === ')') {
      depth -= 1;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  if (close === -1) return { code, changed: false };
  const argText = code.slice(open + 1, close).trim();
  if (!argText.startsWith('{')) return { code, changed: false }; // 空参/函数式 → 不动
  const props = topLevelProps(argText);
  const kept = props.filter(p => !/^['"]?bundler['"]?\s*:/.test(p));
  if (kept.length === props.length) return { code, changed: false }; // 无 bundler
  const newArg = kept.length ? `{ ${kept.join(', ')} }` : '';
  return {
    code: code.slice(0, open + 1) + newArg + code.slice(close),
    changed: true,
  };
}

// 把 runtime 配置对象合并进 src/modern.runtime.ts。
// 返回 'created'（新建）| 'ok'（合并进空的 defineRuntimeConfig({})）| 'conflict'（已有非空配置，需人工）
function mergeIntoRuntime(dir, rtValue) {
  const src = path.join(dir, 'src');
  if (!fs.existsSync(src)) fs.mkdirSync(src, { recursive: true });
  const rtFile = [
    'modern.runtime.ts',
    'modern.runtime.js',
    'modern.runtime.tsx',
  ]
    .map(f => path.join(src, f))
    .find(fs.existsSync);
  if (!rtFile) {
    fs.writeFileSync(
      path.join(src, 'modern.runtime.ts'),
      [
        `import { defineRuntimeConfig } from '@modern-js/runtime';`,
        '',
        `export default defineRuntimeConfig(${rtValue});`,
        '',
      ].join('\n'),
    );
    return 'created';
  }
  let code = readText(rtFile);
  // 仅当现有是空的 defineRuntimeConfig({}) 时才安全合并；否则交人工
  const empty = code.match(/defineRuntimeConfig\(\s*\{\s*\}\s*\)/);
  if (empty) {
    code = code.replace(empty[0], `defineRuntimeConfig(${rtValue})`);
    fs.writeFileSync(rtFile, code);
    return 'ok';
  }
  return 'conflict';
}

// ---- 3b) v2 主路径配置：appTools({ bundler }) → appTools()；顶层 runtime 块 → modern.runtime.ts ----
// v3 不再支持在 modern.config 配 runtime（见 guides/upgrade/entry），必须迁到 modern.runtime.ts
function migrateRuntimeBlock(dir) {
  const configFile = [
    'modern.config.ts',
    'modern.config.js',
    'modern.config.mjs',
  ].find(f => exists(dir, f));
  if (!configFile) return;
  const file = path.join(dir, configFile);
  let code = readText(file);
  let touched = false;

  // applyBaseConfig 是仓库 integration 测试 helper / 非标准用户配置包装：结构性迁移
  // （runtime / plugins / dev.port / appTools bundler）一律交人工，避免半自动改坏。
  // 文件级安全改写（依赖升级 / import 路径 / tailwind 移除）仍由其它步骤完成。
  // 检测一律在 masked（剥离注释/字符串）上做，避免注释里的 applyBaseConfig/runtime 误触发。
  if (/\bapplyBaseConfig\s*\(/.test(maskCommentsAndStrings(code))) {
    note(
      manual,
      '⚠️ 结构迁移未完成：modern.config 用 applyBaseConfig(...)（integration 测试 helper / 非标准配置包装）包裹。runtime / plugins / dev.port / appTools({ bundler }) 等结构性迁移需先人工展开为 defineConfig 再处理；本次仅完成依赖升级 / import 路径 / tailwind 等文件级安全改写，配置结构尚未迁移到 v3。',
    );
    return;
  }

  // (a) appTools({ bundler }) → appTools()
  const at = stripAppToolsBundler(code);
  if (at.changed) {
    code = at.code;
    touched = true;
    note(changed, '配置：appTools({ bundler }) → appTools()（v3 默认 Rspack）');
  }

  // (b) 顶层 runtime 块 → modern.runtime.ts
  // locateConfigObjStart 兼容 defineConfig({ / defineConfig<...>({ / export default { / module.exports = {
  const masked = maskCommentsAndStrings(code);
  const objStart = locateConfigObjStart(code, masked);
  if (objStart === -1) {
    // 函数式 / 动态 defineConfig(() => ({...}))：runtime 无法安全静态搬运
    if (/\bruntime\s*:/.test(masked)) {
      note(
        manual,
        'modern.config 使用函数式/动态配置且含 runtime：需人工迁到 modern.runtime.ts（见 references/migrate-entry.md）',
      );
    }
    if (touched) fs.writeFileSync(file, code);
    return;
  }
  const obj = extractBalanced(code, objStart, masked);
  if (!obj) {
    if (touched) fs.writeFileSync(file, code);
    return;
  }
  const props = topLevelProps(obj.body);
  const rtIdx = props.findIndex(p => /^runtime\s*:/.test(p));
  if (rtIdx === -1) {
    if (touched) fs.writeFileSync(file, code);
    return;
  }
  const rtProp = props[rtIdx];
  const rtValue = rtProp.slice(rtProp.indexOf(':') + 1).trim();
  if (!rtValue.startsWith('{')) {
    // runtime 为函数式/非对象字面量 → 人工，保留在 config
    note(
      manual,
      'modern.config 的 runtime 为函数式/非对象：需人工迁到 src/modern.runtime.ts',
    );
    if (touched) fs.writeFileSync(file, code);
    return;
  }
  const merged = mergeIntoRuntime(dir, rtValue);
  if (merged === 'conflict') {
    // v3 config 类型不接受顶层 runtime（留在 config 会 TS2353 build fail）。已存在非空
    // modern.runtime.ts 无法安全自动合并 → 把原 runtime 作为注释参考追加到 modern.runtime.ts，
    // 进 manual 待人工合并，但**仍从 config 移除**以保证可 build。
    appendRuntimeReference(dir, rtValue);
    note(
      manual,
      'src/modern.runtime.ts 已存在非空配置：已从 modern.config 移除顶层 runtime（v3 不接受），原 runtime 作为注释追加到 modern.runtime.ts 末尾，请人工合并（见 references/migrate-entry.md）',
    );
  }
  // 从 config 移除 runtime 块（merged 与 conflict 都执行——v3 一律不能留 runtime 在 config）
  const restProps = props.filter((_, i) => i !== rtIdx);
  const newObj = restProps.length
    ? `{\n  ${restProps.join(',\n  ')},\n}`
    : '{}';
  code = code.slice(0, objStart) + newObj + code.slice(obj.end);
  fs.writeFileSync(file, code);
  note(
    changed,
    merged === 'conflict'
      ? 'modern.config 顶层 runtime 块已移除（v3 不接受；内容已注释进 modern.runtime.ts 待人工合并）'
      : `modern.config 的 runtime 块 → src/modern.runtime.ts（${merged === 'created' ? '新建' : '合并进空配置'}）`,
  );
}

// 把 config 顶层 runtime（无法安全自动合并的情况）作为注释参考追加到已存在的 modern.runtime.*，
// 供人工合并。原值作注释，避免 build 时生效或语法冲突。
function appendRuntimeReference(dir, rtValue) {
  const rtFile = [
    'modern.runtime.ts',
    'modern.runtime.js',
    'modern.runtime.tsx',
    'modern.runtime.jsx',
  ]
    .map(f => path.join(dir, 'src', f))
    .find(fs.existsSync);
  if (!rtFile) return;
  const safe = rtValue.replace(/\*\//g, '* /');
  fs.appendFileSync(
    rtFile,
    `\n// TODO(v3 迁移)：以下为原 modern.config 顶层 runtime，需人工合并进上方 defineRuntimeConfig：\n/*\nruntime: ${safe}\n*/\n`,
  );
}

// 把 v2 自定义入口 bootstrap（箭头 `(App, bootstrap) => {}` 或函数声明
// `export default [async] function name(App, bootstrap) {}`）改写为 v3 的 createRoot()/render()。
// 用括号/花括号配平解析，能处理带类型注解（含 `() => void` 这种内含 `)` 的参数）。
// 返回新文件内容，或 null（不是可识别的 bootstrap 入口）。
function rewriteBootstrapEntry(code) {
  const masked = maskCommentsAndStrings(code);
  const sig = masked.match(
    /export\s+default\s+(?:async\s+)?(?:function\s+\w+\s*)?\(/,
  );
  if (!sig) return null;
  const parenOpen = sig.index + sig[0].length - 1;
  let d = 0;
  let parenClose = -1;
  for (let i = parenOpen; i < masked.length; i += 1) {
    if (masked[i] === '(') d += 1;
    else if (masked[i] === ')') {
      d -= 1;
      if (d === 0) {
        parenClose = i;
        break;
      }
    }
  }
  if (parenClose === -1) return null;
  const params = code.slice(parenOpen + 1, parenClose);
  let j = parenClose + 1;
  while (j < masked.length && /\s/.test(masked[j])) j += 1;
  if (masked.slice(j, j + 2) === '=>') {
    j += 2;
    while (j < masked.length && /\s/.test(masked[j])) j += 1;
  }
  if (masked[j] !== '{') return null; // 非块体（箭头返回表达式等）
  const bodyOpen = j;
  let bd = 0;
  let bodyClose = -1;
  for (let i = bodyOpen; i < masked.length; i += 1) {
    if (masked[i] === '{') bd += 1;
    else if (masked[i] === '}') {
      bd -= 1;
      if (bd === 0) {
        bodyClose = i;
        break;
      }
    }
  }
  if (bodyClose === -1) return null;
  // 第二个顶层参数名即 bootstrap 回调（复用 topLevelProps 切顶层逗号，处理泛型/箭头类型）
  const paramParts = topLevelProps(`{${params}}`);
  if (paramParts.length < 2) return null;
  const bootstrapName = (paramParts[1].match(/^\s*(\w+)/) || [])[1];
  if (!bootstrapName) return null;
  const body = code
    .slice(bodyOpen + 1, bodyClose)
    .replace(
      new RegExp(`\\b${bootstrapName}\\s*\\(\\s*\\)`, 'g'),
      'render(<ModernRoot />)',
    );
  return [
    `import { createRoot } from '@modern-js/runtime/react';`,
    `import { render } from '@modern-js/runtime/browser';`,
    '',
    `const ModernRoot = createRoot();`,
    '',
    `async function beforeRender() {${body}}`,
    '',
    `beforeRender();`,
    '',
  ].join('\n');
}

// ---- 4) 入口：index→entry（含 bootstrap 改写）、App.config 抽取 ----
function flagRoutesLayoutConfigInit(src) {
  const layout = ['routes/layout.tsx', 'routes/layout.jsx']
    .map(f => path.join(src, f))
    .find(fs.existsSync);
  if (layout && /export\s+const\s+(config|init)\b/.test(readText(layout))) {
    note(
      manual,
      'routes/layout 的 config/init 导出：需迁到 modern.runtime.ts（见 references/migrate-entry.md）',
    );
  }
}

function migrateEntry(dir, entryType) {
  const src = path.join(dir, 'src');
  if (entryType === 'routes') {
    if (firstExistingFile(src, 'index')) {
      note(
        manual,
        'routes 入口同时存在 src/index.*：未自动改为 entry.*，请人工确认是否仍需要自定义入口（见 references/migrate-entry.md）',
      );
    }
    if (exists(src, 'App.tsx') || exists(src, 'App.jsx')) {
      note(
        manual,
        'routes 入口同时存在 App.tsx/App.jsx：未自动抽取 App.config，请人工确认入口形态（见 references/migrate-entry.md）',
      );
    }
    flagRoutesLayoutConfigInit(src);
    return;
  }
  // 4a. 自定义入口 index.* -> entry.*
  for (const ext of ENTRY_EXTS) {
    const idx = path.join(src, `index.${ext}`);
    if (fs.existsSync(idx)) {
      let code = readText(idx);
      // bootstrap 入口：箭头 或 函数声明形态都改写为 createRoot()/render()
      const rewritten = rewriteBootstrapEntry(code);
      if (rewritten) {
        code = rewritten;
        note(changed, 'bootstrap 入口改写为 createRoot()/render()');
      } else if (
        /export\s+default\s+(?:async\s+)?(?:function|\()/.test(
          maskCommentsAndStrings(code),
        )
      ) {
        // 是默认导出函数/箭头但无法识别为标准 bootstrap：不假装成功，进 manual
        note(
          manual,
          `src/index.${ext} 是自定义入口但 bootstrap 形态无法自动改写：请手动改为 createRoot()/render()（见 references/migrate-entry.md、guides/upgrade/entry）`,
        );
      }
      const entry = path.join(src, `entry.${ext}`);
      fs.writeFileSync(entry, code);
      fs.rmSync(idx);
      note(changed, `入口重命名：src/index.${ext} → src/entry.${ext}`);
      break;
    }
  }

  // 4b. App.config 抽取到 modern.runtime.ts
  const appFile = ['App.tsx', 'App.jsx']
    .map(f => path.join(src, f))
    .find(fs.existsSync);
  let runtimeConfigBody = null;
  const rtExists = fs.existsSync(path.join(src, 'modern.runtime.ts'));
  if (appFile) {
    let code = readText(appFile);
    const cfgMatch = code.match(/App\.config\s*=\s*\{/);
    if (cfgMatch && rtExists) {
      // 已有 modern.runtime.ts：不覆盖，App.config 留给人工合并
      note(
        manual,
        '已存在 src/modern.runtime.ts：App.config 需人工合并进现有 defineRuntimeConfig（不自动覆盖，见 references/migrate-entry.md）',
      );
    } else if (cfgMatch) {
      const braceStart = cfgMatch.index + cfgMatch[0].length - 1;
      const ext = extractBalanced(code, braceStart);
      if (ext) {
        runtimeConfigBody = ext.body;
        // 删除整条 App.config = {...};
        const full = code.slice(cfgMatch.index, ext.end).replace(/;?\s*$/, '');
        code = code.replace(full, '').replace(/App\.config\s*=\s*;?/g, '');
        code = code.replace(/\n{3,}/g, '\n\n');
        fs.writeFileSync(appFile, code);
        note(changed, 'App.config 抽取到 src/modern.runtime.ts');
      }
    }
    if (/\bApp\.init\b/.test(readText(appFile))) {
      note(
        manual,
        'App.init：需改为运行时插件（defineRuntimeConfig.plugins，见 references/migrate-entry.md）',
      );
    }
  }
  if (runtimeConfigBody) {
    const rtFile = path.join(src, 'modern.runtime.ts');
    const content = [
      `import { defineRuntimeConfig } from '@modern-js/runtime';`,
      '',
      `export default defineRuntimeConfig(${runtimeConfigBody});`,
      '',
    ].join('\n');
    fs.writeFileSync(rtFile, content);
    note(changed, '生成 src/modern.runtime.ts');
  }

  // 4c. routes/layout 的 config/init 导出 → 人工
  flagRoutesLayoutConfigInit(src);
}

// ---- 5) useRuntimeContext → use(RuntimeContext) ----
function migrateRuntimeContext(files, reactMajor) {
  // React 19+ 用 use(RuntimeContext)；<19（v2 app 常见 17/18）用 useContext，避免生成不可用代码
  const api = reactMajor >= 19 ? 'use' : 'useContext';
  const hit = [];
  const ctxFieldHits = [];
  const aliasHits = [];
  for (const f of files) {
    let code = readText(f);
    if (!/\buseRuntimeContext\b/.test(code)) continue;
    // alias（useRuntimeContext as X）：本地名不确定、调用点改写有歧义，不做文本改写，交人工
    if (/\buseRuntimeContext\s+as\s+\w+/.test(code)) {
      aliasHits.push(path.basename(f));
      continue;
    }
    // 返回值结构变化：isBrowser 移到顶层，context 简化为 request/response（other.md）
    if (/\bcontext\.(isBrowser|logger|metrics)\b/.test(code)) {
      ctxFieldHits.push(path.basename(f));
    }
    // 1) @modern-js/runtime import：去掉 useRuntimeContext，补 RuntimeContext（去重）
    code = code.replace(
      /import\s*\{([^}]*)\}\s*from\s*(['"])@modern-js\/runtime\2\s*;?/,
      (m, specs, q) => {
        if (!/\buseRuntimeContext\b/.test(specs)) return m;
        const names = specs
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .filter(n => n !== 'useRuntimeContext');
        if (!names.includes('RuntimeContext')) names.push('RuntimeContext');
        return `import { ${names.join(', ')} } from ${q}@modern-js/runtime${q};`;
      },
    );
    // 2) react import：合并 hook 到已有 react import，没有才新建（避免重复声明）
    //    捕获 default / namespace 前缀（import React, {...} / import * as React, {...}）并保留，
    //    否则会把 default import React 丢掉（项目里 React.memo / <React.Fragment> 会报错）
    const reactImp = code.match(
      /import\s+(?:(\*\s+as\s+[\w$]+|[\w$]+(?:\s+as\s+[\w$]+)?)\s*,\s*)?\{([^}]*)\}\s*from\s*(['"])react\3\s*;?/,
    );
    if (reactImp) {
      const prefix = reactImp[1];
      const names = reactImp[2]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (!names.includes(api)) {
        names.push(api);
        const head = prefix ? `${prefix}, ` : '';
        code = code.replace(
          reactImp[0],
          `import ${head}{ ${names.join(', ')} } from ${reactImp[3]}react${reactImp[3]};`,
        );
      }
    } else {
      code = `import { ${api} } from 'react';\n${code}`;
    }
    // 3) 调用点
    code = code.replace(
      /\buseRuntimeContext\s*\(\s*\)/g,
      `${api}(RuntimeContext)`,
    );
    fs.writeFileSync(f, code);
    hit.push(path.basename(f));
  }
  if (hit.length) {
    note(
      changed,
      `useRuntimeContext → ${api}(RuntimeContext)（React ${reactMajor >= 19 ? '19+' : '<19'}）：${hit.join(', ')}`,
    );
  }
  if (ctxFieldHits.length) {
    note(
      manual,
      `RuntimeContext 返回值结构变化：isBrowser 移到顶层、context 仅含 request/response，需人工调整 context.isBrowser/logger/metrics 用法（见 guides/upgrade/other.md）：${ctxFieldHits.join(', ')}`,
    );
  }
  if (aliasHits.length) {
    note(
      manual,
      `useRuntimeContext 使用了别名（as），未自动改写：请手动改为 ${api}(RuntimeContext)（见 references/migrate-entry.md）：${aliasHits.join(', ')}`,
    );
  }
}

// ---- 6) pages → routes ----
function posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

function stripKnownExt(file) {
  const ext = path.posix.extname(file);
  return SRC_EXT.has(ext) ? file.slice(0, -ext.length) : file;
}

function pageFileTargetRel(rel) {
  const parsed = path.posix.parse(rel);
  if (!SRC_EXT.has(parsed.ext) || rel.endsWith('.d.ts')) return rel;
  if (parsed.name === 'index') {
    return path.posix.join(parsed.dir, `page${parsed.ext}`);
  }
  if (['page', 'layout'].includes(parsed.name) || parsed.name.startsWith('_')) {
    return rel;
  }
  return path.posix.join(parsed.dir, parsed.name, `page${parsed.ext}`);
}

function collectFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) collectFiles(full, files);
    else files.push(full);
  }
  return files;
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) removeEmptyDirs(path.join(dir, e.name));
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

function addImportMove(moveMap, fromRel, toRel) {
  moveMap.set(fromRel, toRel);
  moveMap.set(stripKnownExt(fromRel), stripKnownExt(toRel));
  const parsed = path.posix.parse(fromRel);
  if (parsed.name === 'index') {
    moveMap.set(parsed.dir, stripKnownExt(toRel));
  }
}

// 纯计算（只读、不落盘）：在给定路由文件目录上算出 pages→routes 的相对移动列表 + import moveMap，
// 并在**任何写盘前**检出冲突（两个源映射到同一 page.*、或目标已被非源文件占用）即抛错。
// baseDir 用 pages 目录（rename 前）算，相对路径与 rename 后的 routes 目录一致，故可提前预检。
function planPagesMoves(baseDir) {
  const moveMap = new Map();
  const relMoves = collectFiles(baseDir)
    .map(file => {
      const fromRel = posixRel(baseDir, file);
      return { fromRel, toRel: pageFileTargetRel(fromRel) };
    })
    .filter(m => m.fromRel !== m.toRel);
  const sourceRels = new Set(relMoves.map(m => m.fromRel));
  const targets = new Map();
  for (const m of relMoves) {
    const existing = targets.get(m.toRel);
    if (existing) {
      throw new Error(
        `pages→routes 迁移冲突：${existing} 与 ${m.fromRel} 都会映射到 ${m.toRel}，请人工合并`,
      );
    }
    targets.set(m.toRel, m.fromRel);
    const targetExists = fs.existsSync(
      path.join(baseDir, ...m.toRel.split('/')),
    );
    if (targetExists && !sourceRels.has(m.toRel)) {
      throw new Error(
        `pages→routes 迁移冲突：${m.fromRel} 与 ${m.toRel} 目标冲突，请人工合并`,
      );
    }
    addImportMove(moveMap, m.fromRel, m.toRel);
  }
  return { relMoves, moveMap };
}

// 写盘前预检：pages→routes 若有冲突，在 main 改任何文件（依赖/scripts/config）之前就抛错中止，
// 保证失败时 src/pages、package.json、report 全部保持未改（事务性）。
function assertPagesMigrationSafe(dir) {
  const src = path.join(dir, 'src');
  if (exists(src, 'pages') && !exists(src, 'routes')) {
    planPagesMoves(path.join(src, 'pages'));
  }
}

function migratePagesToRoutes(dir) {
  const src = path.join(dir, 'src');
  if (exists(src, 'pages') && !exists(src, 'routes')) {
    const routesDir = path.join(src, 'routes');
    // 先在原 src/pages 上算移动计划 + 冲突预检（无冲突才落盘）
    const { relMoves, moveMap } = planPagesMoves(path.join(src, 'pages'));
    fs.renameSync(path.join(src, 'pages'), routesDir);
    const tmp = path.join(routesDir, `.modernjs-migrate-${Date.now()}`);
    if (relMoves.length) fs.mkdirSync(tmp, { recursive: true });
    relMoves.forEach((m, i) =>
      fs.renameSync(
        path.join(routesDir, ...m.fromRel.split('/')),
        path.join(tmp, String(i)),
      ),
    );
    relMoves.forEach((m, i) => {
      const to = path.join(routesDir, ...m.toRel.split('/'));
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.renameSync(path.join(tmp, String(i)), to);
    });
    if (relMoves.length) {
      fs.rmSync(tmp, { recursive: true, force: true });
      removeEmptyDirs(routesDir);
    }
    note(
      changed,
      `src/pages → src/routes（约定式路由，index.* 映射为 page.*）`,
    );
    // 更新相对引用 ../pages → ../routes；残留（别名等非相对）引用进人工清单
    let rewrote = 0;
    const residual = [];
    for (const f of collectSources(src)) {
      const { code: updated, changed: c } = mapImportSpecifiers(
        readText(f),
        spec => {
          const m = spec.match(/^((?:\.\.?\/)+)pages(?:\/(.*))?$/);
          if (!m) return null;
          const tail = m[2] ?? '';
          const mappedTail = moveMap.get(tail) ?? tail;
          return `${m[1]}routes${mappedTail ? `/${mappedTail}` : ''}`;
        },
      );
      if (c) {
        fs.writeFileSync(f, updated);
        rewrote += 1;
      }
      if (
        /(?:from\s+|import\(\s*|require\(\s*)['"][^'"]*\bpages\b[^'"]*['"]/.test(
          updated,
        )
      ) {
        residual.push(path.relative(dir, f));
      }
    }
    if (rewrote) note(changed, `更新 ${rewrote} 处 pages→routes 相对引用`);
    if (residual.length) {
      note(
        manual,
        `仍有 pages 引用需人工核对（别名/非相对路径）：${residual.join(', ')}`,
      );
    }
    // v3 约定式路由需要根 layout（缺失会报 "The root layout component is required"）；语义确定，自动补最小 Outlet 布局
    if (!firstExistingFile(routesDir, 'layout')) {
      const pageFile = firstExistingFile(routesDir, 'page');
      const lext = pageFile?.endsWith('.jsx') ? 'jsx' : 'tsx';
      fs.writeFileSync(
        path.join(routesDir, `layout.${lext}`),
        `import { Outlet } from '@modern-js/runtime/router';\n\nexport default function Layout() {\n  return <Outlet />;\n}\n`,
      );
      note(
        changed,
        `生成最小 src/routes/layout.${lext}（v3 约定式路由需根布局）`,
      );
    }
  } else if (exists(src, 'pages')) {
    note(manual, 'src/pages 与 src/routes 并存：需人工合并');
  }
}

// ---- 6b) 自定义 Web Server：server/index.* → server/modern.server.*（生成可构建骨架）----
// v3 约定式自定义 server 是 server/modern.server.ts 的 defineServerConfig。v2 的 unstableMiddleware/
// afterRender 用 Modern.js Server Context，语义到 Hono Context 的转换需人工（见 web-server 文档）。
// 这里生成**可 build**的空 defineServerConfig 骨架，并把原逻辑作为注释保留 + 进 manual 提示补语义。
function migrateCustomServer(dir) {
  const serverFile = ['server/index.ts', 'server/index.js']
    .map(f => path.join(dir, f))
    .find(fs.existsSync);
  if (!serverFile) return;
  const old = readText(serverFile);
  const masked = maskCommentsAndStrings(old);
  if (!/\b(unstableMiddleware|afterRender|hook)\b/.test(masked)) return;
  const ext = serverFile.endsWith('.js') ? 'js' : 'ts';
  const target = path.join(dir, 'server', `modern.server.${ext}`);
  if (fs.existsSync(target)) return; // 已有 modern.server.*，不覆盖
  const ref = old.replace(/\*\//g, '* /'); // 避免注释块提前闭合
  const content = [
    `import { defineServerConfig } from '@modern-js/server-runtime';`,
    '',
    `// TODO(v3 迁移)：原 server/index.${ext} 的 v2 自定义 server 逻辑需按 guides/upgrade/web-server 手动迁移：`,
    '//  - unstableMiddleware[] → defineServerConfig({ middlewares: [{ name, handler }] })，handler 必须 await next()',
    '//  - afterRender hook → renderMiddlewares；Context API：Modern.js Server Context → Hono Context（c.req / c.res）',
    `// 补全后删除下方原始逻辑参考。原 server/index.${ext}：`,
    '/*',
    ref,
    '*/',
    '',
    'export default defineServerConfig({});',
    '',
  ].join('\n');
  fs.writeFileSync(target, content);
  fs.rmSync(serverFile);
  note(
    changed,
    `server/index.${ext} → server/modern.server.${ext}（生成可构建骨架，原逻辑作为注释保留）`,
  );
  note(
    manual,
    `自定义 Web Server 语义需人工补全：server/modern.server.${ext} 现为空 defineServerConfig（可 build），unstableMiddleware/afterRender 的 Hono Context 迁移见 references/migrate-custom-server.md`,
  );
}

// ---- 7) tailwind postcss ----
function writePostcss(dir, hadTailwind) {
  if (!hadTailwind) return;
  const file = path.join(dir, 'postcss.config.cjs');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      `module.exports = {\n  plugins: {\n    tailwindcss: {},\n  },\n};\n`,
    );
    note(changed, '生成 postcss.config.cjs（Tailwind 改 Rsbuild 原生）');
  }
}

// ---- 8) 其余人工项 ----
function flagManual(dir, reactMajor) {
  const configFile = [
    'modern.config.ts',
    'modern.config.js',
    'modern.config.mjs',
    'modern.config.cjs',
  ].find(f => exists(dir, f));
  const rawConfig = configFile ? readText(path.join(dir, configFile)) : '';
  // 结构/标识符（appIcon 键、ssr 键、webpack）用 maskCommentsAndStrings，普通字符串不触发；
  // 需要字符串「值」的判断（ssr.mode: 'string'/'stream'）用 maskComments（保留字符串、去注释）
  const configText = maskCommentsAndStrings(rawConfig);
  const configWithStr = maskComments(rawConfig);
  if (exists(dir, 'server', 'index.ts') || exists(dir, 'server', 'index.js')) {
    note(
      manual,
      '自定义 Web Server：server/index.ts→modern.server.ts + Hono Context + 必须 next()（见 references/migrate-custom-server.md）',
    );
  }
  if (/appIcon\s*:\s*['"]/.test(configText)) {
    note(manual, 'html.appIcon 字符串 → 对象 { icons:[{src,size}] }');
  }
  // SSR：v3 默认 stream。只在「显式 string」「React<18 启用 SSR」「模式/版本无法判断」时提示；
  // mode:'stream' + React18+ 是 v3 默认安全形态，不报（避免污染报告边界）
  if (/\bssr\b/.test(configText)) {
    const hasStream = /mode\s*:\s*['"]stream['"]/.test(configWithStr);
    const hasString = /mode\s*:\s*['"]string['"]/.test(configWithStr);
    if (hasString) {
      note(
        manual,
        'server.ssr.mode 显式为 "string"：确认 v3 下是否仍需 string 渲染（默认已改 stream）',
      );
    } else if (!hasStream && reactMajor > 0 && reactMajor < 18) {
      note(
        manual,
        'SSR + React<18：v3 默认 stream 渲染，React17 需手动把 server.ssr.mode 设回 "string"',
      );
    } else if (!hasStream && reactMajor === 0) {
      note(
        manual,
        'SSR 已启用但无法判断 React 版本/渲染模式：确认 server.ssr.mode（v3 默认 stream）',
      );
    }
  }
  if (/\bwebpack\b|webpackChain/.test(configText)) {
    note(manual, 'webpack 自定义配置 → 确认 Rspack 兼容');
  }
  // v2 支持在 package.json 的 modernConfig.runtime 配运行时；v3 必须迁到 modern.runtime.ts
  const pkg = JSON.parse(readText(path.join(dir, 'package.json')));
  if (pkg.modernConfig?.runtime) {
    note(
      manual,
      'package.json 的 modernConfig.runtime 需人工迁到 src/modern.runtime.ts（见 references/migrate-entry.md）',
    );
  }
}

// v2-only 结构信号（v3 不再有）：用于在 workspace 协议下区分 v2 待迁移 vs 已是 v3。
// 明确排除 routes / modern.runtime.ts / appTools()（v3 也有，不算信号）。
function detectV2Signals(dir, pkg) {
  const configFile = [
    'modern.config.ts',
    'modern.config.js',
    'modern.config.mjs',
    'modern.config.cjs',
  ].find(f => exists(dir, f));
  // 结构/标识符信号：用 maskCommentsAndStrings（字符串一并 mask），普通字符串示例文本不算信号。
  // import 信号：单独从真实模块 specifier 提取，不在任意字符串里裸搜包名。
  const configText = configFile
    ? maskCommentsAndStrings(readText(path.join(dir, configFile)))
    : '';
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
  const files = collectSources(path.join(dir, 'src'))
    .concat(collectSources(path.join(dir, 'server')))
    .concat(collectSources(path.join(dir, 'api')));
  const anyCode = re =>
    files.some(f => re.test(maskCommentsAndStrings(readText(f))));
  const anyImport = mod =>
    files.some(f => importSpecifiers(readText(f)).some(s => s.startsWith(mod)));
  const signals = [];
  if (/\bruntime\s*:/.test(configText))
    signals.push('modern.config 顶层 runtime');
  if (/appTools\s*\(\s*\{[^)]*\bbundler\b/.test(configText)) {
    signals.push('appTools({ bundler })');
  }
  if (/\bapplyBaseConfig\s*\(/.test(configText))
    signals.push('applyBaseConfig');
  if (
    deps['@modern-js/plugin-tailwindcss'] ||
    /\btailwindcssPlugin\b/.test(configText)
  ) {
    signals.push('plugin-tailwindcss');
  }
  if (anyImport('@modern-js/runtime/bff'))
    signals.push('@modern-js/runtime/bff import');
  if (anyImport('@modern-js/runtime/server')) {
    signals.push('@modern-js/runtime/server import');
  }
  if (anyCode(/\bApp\.config\b/)) signals.push('App.config');
  if (anyCode(/\bApp\.init\b/)) signals.push('App.init');
  if (anyCode(/export\s+const\s+(config|init)\b/))
    signals.push('layout config/init');
  if (anyCode(/\buseRuntimeContext\b/)) signals.push('useRuntimeContext');
  if (exists(dir, 'src', 'pages') && !exists(dir, 'src', 'routes')) {
    signals.push('src/pages');
  }
  if (exists(dir, 'server', 'index.ts') || exists(dir, 'server', 'index.js')) {
    signals.push('自定义 server (server/index)');
  }
  return signals;
}

// modern.config 是否用 dynamic import / require（非 static）引用 @modern-js/plugin-tailwindcss
function hasUnsafeTailwindUsage(dir) {
  const configFile = [
    'modern.config.ts',
    'modern.config.js',
    'modern.config.mjs',
    'modern.config.cjs',
  ].find(f => exists(dir, f));
  if (!configFile) return false;
  const code = readText(path.join(dir, configFile));
  let unsafe = false;
  eachModuleSpecifier(code, ({ content, kind }) => {
    if (content === '@modern-js/plugin-tailwindcss' && kind !== 'static') {
      unsafe = true;
    }
  });
  return unsafe;
}

function main() {
  const args = process.argv.slice(2);
  const dir = path.resolve(args.find(a => !a.startsWith('--')) || '.');
  let target;
  try {
    target = resolveTargetVersion(args);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
  const toVersion = target.version;
  const json = args.includes('--json');

  if (!exists(dir, 'package.json')) {
    console.error(`未找到 package.json: ${dir}`);
    process.exit(1);
  }

  const pkg = JSON.parse(readText(path.join(dir, 'package.json')));
  const reactMajor =
    Number(String(pkg.dependencies?.react ?? '').match(/(\d+)/)?.[1]) || 0;
  const entryType = detectEntryType(dir);
  const routesGuard = createRoutesGuard(dir, entryType);
  assertRouteConventions(dir, routesGuard);
  // pages→routes 冲突预检（写盘前）：有冲突立即中止，src/pages、package.json、report 均保持未改
  assertPagesMigrationSafe(dir);

  // 二次保护（不依赖 scan）：workspace/monorepo 协议 + 无任何 v2-only 信号 → ambiguous，
  // 可能已是 v3 workspace 应用，拒绝迁移、不改任何文件
  const appToolsVer =
    pkg.devDependencies?.['@modern-js/app-tools'] ??
    pkg.dependencies?.['@modern-js/app-tools'] ??
    null;
  if (isWorkspaceProto(appToolsVer)) {
    const signals = detectV2Signals(dir, pkg);
    if (!signals.length) {
      console.error(
        [
          '⛔ 迁移已中止（未改写任何文件）：',
          `检测到 @modern-js/app-tools 使用 workspace/monorepo 协议（${appToolsVer}）但无任何 v2-only 信号，`,
          '无法确认这是待迁移的 v2 项目——很可能已经是 v3 workspace 应用。',
          '请人工确认项目确为 v2 后再迁移（先跑 scan-project.mjs 核对）。',
        ].join('\n'),
      );
      process.exit(1);
    }
  }

  // config 用 dynamic import / require 引用 plugin-tailwindcss 时无法安全自动迁移：保留依赖（交 manual）
  migrateDeps(dir, toVersion, {
    keepTailwindDep: hasUnsafeTailwindUsage(dir),
  });
  removeRemovedModernScripts(dir);
  const files = collectSources(path.join(dir, 'src'))
    .concat(collectSources(path.join(dir, 'server')))
    .concat(collectSources(path.join(dir, 'api')));
  const importFlags = migrateImportPaths(files);
  ensureMappedDeps(dir, toVersion, importFlags);
  const hadTailwind = migrateConfig(dir);
  migrateV3ConfigKeys(dir);
  // runtime 块 → modern.runtime.ts、appTools({ bundler }) → appTools()（applyBaseConfig 走 manual）
  // 须在 migrateEntry 之前：若它新建/填充了 modern.runtime.ts，App.config 抽取会识别为已存在而走 merge/manual
  migrateRuntimeBlock(dir);
  addBffPlugin(dir, importFlags);
  migrateEntry(dir, entryType);
  // entry/runtime 改完后再扫一次最新文件做 runtime-context
  migrateRuntimeContext(
    collectSources(path.join(dir, 'src')).concat(
      collectSources(path.join(dir, 'api')),
    ),
    reactMajor,
  );
  migratePagesToRoutes(dir);
  migrateCustomServer(dir);
  assertRouteConventions(dir, routesGuard);
  writePostcss(dir, hadTailwind);
  flagManual(dir, reactMajor);

  const report = {
    projectDir: dir,
    toVersion,
    targetVersionSource: target.source,
    changed,
    manual,
  };
  const outDir = path.join(dir, '.agents', 'runs', 'modernjs-migrate');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`🚚 Modern.js v2→v3 自动迁移：${dir}`);
  console.log(`目标版本：${toVersion}（${target.source}）`);
  console.log(`\n✅ 已自动改写 ${changed.length} 项：`);
  for (const c of changed) console.log(`  - ${c}`);
  console.log(`\n🔴 人工清单 ${manual.length} 项：`);
  for (const m of manual) console.log(`  - ${m}`);
  console.log(
    '\n下一步：pnpm install → modern build；按人工清单处理复杂项。报告见 .agents/runs/modernjs-migrate/report.json',
  );
}

main();
