// 配置改写公共库（从 modernjs-migrate-to-v3 已收敛实现移植，保证对真实文件的健壮性）。
// 所有结构定位都基于「剥离注释与字符串」后的 masked 文本，改写落原文同索引。

import fs from 'node:fs';
import path from 'node:path';

export const readText = f => fs.readFileSync(f, 'utf8');
export const exists = (...p) => fs.existsSync(path.join(...p));

// 把注释和字符串内容替换为等长空白（保留换行/引号/长度与索引 1:1），用于结构定位
export function maskCommentsAndStrings(code) {
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

// 只剥离注释、保留字符串原样（等长），用于需要字符串「值」（如 import 路径）的匹配
export function maskComments(code) {
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

// 单一扫描器：对每个真实模块 specifier（import/export-from/side-effect/dynamic/require）回调
export function eachModuleSpecifier(code, visit) {
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
      i = Math.min(i + 2, n);
      continue;
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
      const close = j;
      let kind = null;
      if (/\bimport\s*\(\s*$/.test(acc)) kind = 'dynamic';
      else if (/\brequire\s*\(\s*$/.test(acc)) kind = 'require';
      else if (/\bfrom\s*$/.test(acc) || /\bimport\s*$/.test(acc))
        kind = 'static';
      if (kind) visit({ content, open, close, quote, kind });
      i = j + 1;
      acc = '';
      continue;
    }
    acc += c;
    if (acc.length > 32) acc = acc.slice(-32);
    i += 1;
  }
}

export function importSpecifiers(code) {
  const specs = [];
  eachModuleSpecifier(code, ({ content }) => specs.push(content));
  return specs;
}

// 对象字面量 `{...}` 顶层属性片段（忽略嵌套/注释/字符串）
export function topLevelProps(body) {
  const inner = body.slice(1, -1);
  const masked = maskCommentsAndStrings(inner);
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

// 从 `{` 处做花括号配平（忽略注释/字符串），返回对象字面量文本与结束位置
export function extractBalanced(text, startIdx, maskedText) {
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

// 定位顶层配置对象起始 `{`：defineConfig({ / defineConfig<...>({ / export default { / module.exports = {
export function locateConfigObjStart(code, maskedText) {
  const masked = maskedText ?? maskCommentsAndStrings(code);
  const dcObj = masked.match(/defineConfig\s*(?:<[^>]*>)?\s*\(\s*\{/);
  if (dcObj) return dcObj.index + dcObj[0].length - 1;
  const ed = masked.match(/export\s+default\s*\{/);
  if (ed) return ed.index + ed[0].length - 1;
  const me = masked.match(/module\.exports\s*=\s*\{/);
  if (me) return me.index + me[0].length - 1;
  return -1;
}

// 把 call 追加到顶层 plugins 数组末尾（保留原顺序、去尾随逗号）
export function appendToPluginsArray(prop, call) {
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
  const inner = prop
    .slice(arrStart + 1, arrEnd)
    .trim()
    .replace(/,\s*$/, '');
  const newInner = inner ? `${inner}, ${call}` : call;
  return `${prop.slice(0, arrStart)}[${newInner}]${prop.slice(arrEnd + 1)}`;
}

const reEsc = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

// 解析 importPkg 的命名绑定。**只承认真实 import/export-from/require 语句**（用 eachModuleSpecifier
// 锚定真实 specifier，再在 maskCommentsAndStrings 上定位其解构 `{...}`），普通字符串里的伪 import 不算。
// 返回 { localName, hasBinding, hasRealImport }：
//   hasBinding=true 表示 name 已绑定（localName 为其本地名，含 alias）；
//   hasRealImport=true 表示 importPkg 有真实 import/require（即使没解构出 name）。
// 是否 `import type ...`（整条 type-only import，运行时被擦除，不是 value 绑定）。
// beforeMasked：masked 代码到 specifier 路径之前；cut：`{` 或路径下标。
function isTypeOnlyStaticImport(beforeMasked, cut) {
  const li = beforeMasked.slice(0, cut).lastIndexOf('import');
  if (li === -1) return false;
  return /\bimport\s+type\b/.test(beforeMasked.slice(li, cut + 1));
}

export function resolvePluginBinding(code, importPkg, name) {
  const masked = maskCommentsAndStrings(code); // 注释+字符串都抹，定位真实代码括号
  let result = { localName: null, hasBinding: false, hasRealImport: false };
  eachModuleSpecifier(code, ({ content, open, kind }) => {
    if (result.hasBinding) return;
    if (content !== importPkg) return;
    if (kind !== 'static' && kind !== 'require') return;
    const beforeMasked = masked.slice(0, open);
    const braceClose = beforeMasked.lastIndexOf('}');
    const braceOpen =
      braceClose === -1 ? -1 : beforeMasked.lastIndexOf('{', braceClose);
    const between =
      braceClose === -1 ? '' : beforeMasked.slice(braceClose + 1, open);
    const isDestructured =
      braceOpen !== -1 &&
      (/^\s*from\s*$/.test(between) ||
        /^\s*=\s*require\s*\(\s*$/.test(between));
    // 整条 type-only import（仅 static 可能）→ 不是 value import，忽略（hasRealImport 不置位）
    const cut = braceOpen !== -1 ? braceOpen : open;
    if (kind === 'static' && isTypeOnlyStaticImport(beforeMasked, cut)) return;
    result.hasRealImport = true; // value 形式的真实 import（默认/副作用/解构）
    if (!isDestructured) return;
    const names = code.slice(braceOpen + 1, braceClose); // 真实代码片段
    // inline type 说明符 `{ type bffPlugin }` 也不是 value 绑定
    if (new RegExp(`\\btype\\s+${reEsc(name)}\\b`).test(names)) return;
    const m = names.match(
      new RegExp(`\\b${reEsc(name)}\\b\\s*(?:(?:as|:)\\s*(\\w+))?`),
    );
    if (m)
      result = {
        localName: m[1] || name,
        hasBinding: true,
        hasRealImport: true,
      };
  });
  return result;
}

// 确保 code 里有 `name`（来自 importPkg）的命名绑定，返回 { code, localName } | { manual }。
// 已绑定 → 直接返回本地名；包已 import/require 但缺 name → 把 name 加进现有解构大括号；
// 包未引入 → 按模块风格插入一条（ESM import / CJS require）。插入后用 resolvePluginBinding 复核。
export function ensureNamedImport(code, importPkg, name) {
  const found = resolvePluginBinding(code, importPkg, name);
  if (found.hasBinding) return { code, localName: found.localName };

  const masked = maskCommentsAndStrings(code);
  const pkg = reEsc(importPkg);

  // 包已有真实 **value** 解构 import/require 但缺 name → 把 name 加进大括号（跳过 type-only）
  if (found.hasRealImport) {
    let next = null;
    eachModuleSpecifier(code, ({ content, open, kind }) => {
      if (next || content !== importPkg) return;
      if (kind !== 'static' && kind !== 'require') return;
      const beforeMasked = masked.slice(0, open);
      const braceClose = beforeMasked.lastIndexOf('}');
      if (braceClose === -1) return;
      const braceOpen = beforeMasked.lastIndexOf('{', braceClose);
      if (braceOpen === -1) return;
      const between = beforeMasked.slice(braceClose + 1, open);
      if (
        !/^\s*from\s*$/.test(between) &&
        !/^\s*=\s*require\s*\(\s*$/.test(between)
      ) {
        return;
      }
      // type-only import 不能塞 value 绑定
      if (
        kind === 'static' &&
        isTypeOnlyStaticImport(beforeMasked, braceOpen)
      ) {
        return;
      }
      const inner = code.slice(braceOpen + 1, braceClose).trim();
      const merged = inner ? `${inner.replace(/,\s*$/, '')}, ${name}` : name;
      next = `${code.slice(0, braceOpen + 1)} ${merged} ${code.slice(braceClose)}`;
    });
    if (next) {
      const verify = resolvePluginBinding(next, importPkg, name);
      if (verify.hasBinding) return { code: next, localName: name };
    }
    // type-only / 默认 / 副作用 import 或无法安全合并 → 退到「另插一条 value import」
  }

  // 包未引入（或无法合并）：按模块风格新插一条
  const isCjs =
    /\bmodule\.exports\b/.test(masked) ||
    (!/\bimport\b[^\n]*\bfrom\b/.test(masked) &&
      new RegExp(`require\\(\\s*['"]${pkg}['"]`).test(masked)) ||
    (!/\bimport\b[^\n]*\bfrom\b/.test(masked) && /\brequire\s*\(/.test(masked));
  const stmt = isCjs
    ? `const { ${name} } = require('${importPkg}');`
    : `import { ${name} } from '${importPkg}';`;
  const lines = code.split('\n');
  const maskedLines = masked.split('\n');
  let lastImp = -1;
  for (let i = 0; i < maskedLines.length; i++) {
    if (
      /^\s*import\b/.test(maskedLines[i]) ||
      /=\s*require\s*\(/.test(maskedLines[i])
    ) {
      lastImp = i;
    }
  }
  let at = 0;
  if (lastImp !== -1) {
    at = lastImp + 1;
  } else {
    for (let i = 0; i < maskedLines.length; i++) {
      const t = maskedLines[i].trim();
      if (
        t === '' ||
        t.startsWith('//') ||
        t.startsWith('/*') ||
        t.startsWith('*') ||
        t.startsWith('#!')
      ) {
        at = i + 1;
        continue;
      }
      break;
    }
  }
  lines.splice(at, 0, stmt);
  const next = lines.join('\n');
  if (resolvePluginBinding(next, importPkg, name).hasBinding) {
    return { code: next, localName: name };
  }
  return {
    manual: `无法自动插入 ${name} 的 import/require：请手动添加后再使用 ${name}()`,
  };
}

// 顶层 plugins 数组里是否有 `${localName}()` 调用（限定在配置对象顶层 plugins 内）
export function topLevelPluginsHasCall(code, localName) {
  if (!localName) return false;
  const masked = maskCommentsAndStrings(code);
  const objStart = locateConfigObjStart(code, masked);
  if (objStart === -1) return false;
  const obj = extractBalanced(code, objStart, masked);
  if (!obj) return false;
  const props = topLevelProps(obj.body);
  const pluginsProp = props.find(p => /^plugins\s*:/.test(p));
  if (!pluginsProp) return false;
  return new RegExp(`\\b${reEsc(localName)}\\s*\\(`).test(
    maskCommentsAndStrings(pluginsProp),
  );
}

// 功能是否已启用：存在真实绑定，且顶层 plugins 调用了其本地名
export function isPluginEnabled(code, importPkg, exportName) {
  const b = resolvePluginBinding(code, importPkg, exportName);
  if (!b.hasBinding) return false;
  return topLevelPluginsHasCall(code, b.localName);
}

// 把 ssg 的值（masked）归类：'enabling'（true / 对象）| 'off'（false/undefined/null/0/空串）|
// 'invalid'（数组等非 boolean|object 的字面量，类型不接受）| 'dynamic'（标识符/调用/三元等无法静态确认）。
// 依据 output/ssg.mdx 与类型 `boolean | SSGConfig`：只有 boolean true 或对象才是合法静态开启形态，数组不是。
function classifySsgValue(maskedVal) {
  const v = maskedVal.trim();
  if (v.startsWith('{') || /^true\b/.test(v)) return 'enabling';
  if (v.startsWith('[')) return 'invalid';
  if (
    /^(false|undefined|null)\b/.test(v) ||
    /^0(\b|$)/.test(v) ||
    v === "''" ||
    v === '""' ||
    v === '``'
  ) {
    return 'off';
  }
  return 'dynamic';
}

// 把 ssgByEntries 的值（原始片段）按源码语义归类：
//   依据 `packages/cli/plugin-ssg/src/libs/util.ts:117`（`Object.keys(...).length > 0` 才激活，空对象忽略回落普通 ssg）
//   与 `builderPlugins/adapterSSR.ts:214`（按 `ssgByEntries[name]` 逐入口判真值）；类型 `Record<string, boolean | SSGOptions>`，false 是合法关闭值。
//   返回：'enabling'（任一 entry 为 true/对象）| 'off'（非空但所有 entry 都是 false/0/null/undefined/空串）|
//        'empty'（空对象 {} → 源码忽略，回落普通 ssg）| 'dynamic'（含动态/无法静态确认的 entry 值，且无任一静态启用）|
//        'not-object'（ssgByEntries 值本身不是对象字面量，动态表达式）。
function classifyByEntries(rawVal) {
  const masked = maskCommentsAndStrings(rawVal);
  const t = masked.trim();
  if (!t.startsWith('{')) return 'not-object';
  const start = masked.indexOf('{');
  const bal = extractBalanced(rawVal, start);
  if (!bal) return 'not-object';
  const entries = topLevelProps(bal.body);
  if (entries.length === 0) return 'empty';
  let hasEnabling = false;
  let hasUnknown = false;
  for (const entry of entries) {
    const em = maskCommentsAndStrings(entry);
    const colon = em.indexOf(':');
    if (colon === -1) {
      // 展开/简写（...spread、shorthand）等无法静态确认
      hasUnknown = true;
      continue;
    }
    const cls = classifySsgValue(
      maskCommentsAndStrings(entry.slice(colon + 1)),
    );
    if (cls === 'enabling') hasEnabling = true;
    else if (cls !== 'off') hasUnknown = true; // 'dynamic' / 'invalid'
  }
  if (hasEnabling) return 'enabling';
  if (hasUnknown) return 'dynamic';
  return 'off';
}

// 结构化解析顶层 output.ssg 状态（只看 **output 对象字面量的顶层属性**，不吃字符串/注释/嵌套字段/动态表达式）。
// state：'no-output' | 'output-not-object'（output 值非对象字面量）| 'byEntries' |
//        'none'（无顶层 ssg）| 'ssg-enabling' | 'ssg-off' | 'ssg-invalid'（数组等非法字面量）| 'ssg-dynamic'
//        | 'byEntries-enabling' | 'byEntries-off'（非空但全关）| 'byEntries-dynamic'（含动态值/值非对象）
//   注：空 ssgByEntries({}) 源码忽略，回落普通 ssg 分类。
export function outputSsgState(code) {
  const masked = maskCommentsAndStrings(code);
  const objStart = locateConfigObjStart(code, masked);
  if (objStart === -1) return { state: 'no-output' };
  const obj = extractBalanced(code, objStart, masked);
  if (!obj) return { state: 'no-output' };
  const props = topLevelProps(obj.body);
  const outIdx = props.findIndex(p => /^output\s*:/.test(p));
  if (outIdx === -1) return { state: 'no-output', props, outIdx: -1 };
  const outProp = props[outIdx];
  const om = maskCommentsAndStrings(outProp);
  // **output 的值本身必须是对象字面量**（冒号后第一个非空白字符是 `{`），否则不解析（动态表达式）
  const colon = om.indexOf(':');
  let vs = colon + 1;
  while (vs < om.length && /\s/.test(om[vs])) vs += 1;
  if (om[vs] !== '{') return { state: 'output-not-object', props, outIdx };
  const outBody = extractBalanced(outProp, vs);
  if (!outBody) return { state: 'output-not-object', props, outIdx };
  const outProps = topLevelProps(outBody.body);
  const base = { props, outIdx, outProps };
  const byIdx = outProps.findIndex(p => /^ssgByEntries\s*:/.test(p));
  const ssgIdx = outProps.findIndex(p => /^ssg\s*:/.test(p));
  if (byIdx !== -1) {
    const byVal = outProps[byIdx].slice(outProps[byIdx].indexOf(':') + 1);
    const b = classifyByEntries(byVal);
    if (b === 'enabling')
      return { state: 'byEntries-enabling', byIdx, ssgIdx, ...base };
    if (b === 'off') return { state: 'byEntries-off', byIdx, ssgIdx, ...base };
    if (b === 'dynamic' || b === 'not-object')
      return { state: 'byEntries-dynamic', byIdx, ssgIdx, ...base };
    // b === 'empty'：源码忽略空 ssgByEntries，回落到普通 ssg 分类
  }
  if (ssgIdx === -1) return { state: 'none', byIdx, ...base };
  const val = outProps[ssgIdx].slice(outProps[ssgIdx].indexOf(':') + 1);
  const cls = classifySsgValue(maskCommentsAndStrings(val));
  return { state: `ssg-${cls}`, ssgIdx, byIdx, ...base };
}

// 顶层 output 是否**真正开启** SSG（任一入口启用的 ssgByEntries 或顶层 ssg 为 true/对象；
// false/undefined/动态/空对象/全关都不算）
export function hasOutputSsg(code) {
  const s = outputSsgState(code).state;
  return s === 'byEntries-enabling' || s === 'ssg-enabling';
}

// 定位 modern.config 文件
export function findConfigFile(dir) {
  return ['modern.config.ts', 'modern.config.js', 'modern.config.mjs'].find(f =>
    exists(dir, f),
  );
}

// ---- 版本协议（与 migrate-to-v3 收敛逻辑一致）----
// 非语义化协议：不能当固定版本处理
export const WORKSPACE_PROTO =
  /^(workspace:|link:|catalog:|file:|portal:|npm:|\*$)/;
// 名称无关、可安全复用给别的包的协议（由 key 决定包）
export const REUSABLE_PROTO = /^(workspace:|catalog:)/;
export const isWorkspaceProto = v =>
  v != null && WORKSPACE_PROTO.test(String(v).trim());

function collectSources(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (
        !['node_modules', '.git', 'dist', 'build', '.agents'].includes(e.name)
      ) {
        collectSources(full, files);
      }
    } else if (
      /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(e.name) &&
      !e.name.endsWith('.d.ts')
    ) {
      files.push(full);
    }
  }
  return files;
}

// v2-only 结构信号（v3 不再有）。明确排除 routes / modern.runtime.ts / appTools()（v3 也有）。
// 用于在 workspace/link 等非语义版本下区分 v2 待迁移 vs 已是 v3。
export function detectV2Signals(dir) {
  const configFile = findConfigFile(dir) || 'modern.config.cjs';
  const cfgPath = path.join(dir, configFile);
  const configText = fs.existsSync(cfgPath)
    ? maskCommentsAndStrings(readText(cfgPath))
    : '';
  const pkg = exists(dir, 'package.json')
    ? JSON.parse(readText(path.join(dir, 'package.json')))
    : {};
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
  const files = collectSources(path.join(dir, 'src'))
    .concat(collectSources(path.join(dir, 'server')))
    .concat(collectSources(path.join(dir, 'api')));
  const anyImport = mod =>
    files.some(f => importSpecifiers(readText(f)).some(s => s.startsWith(mod)));
  const anyCode = re =>
    files.some(f => re.test(maskCommentsAndStrings(readText(f))));
  const signals = [];
  if (/\bruntime\s*:/.test(configText)) signals.push('config.runtime');
  if (/appTools\s*\(\s*\{[^)]*\bbundler\b/.test(configText))
    signals.push('appTools({ bundler })');
  if (/\bapplyBaseConfig\s*\(/.test(configText))
    signals.push('applyBaseConfig');
  if (
    deps['@modern-js/plugin-tailwindcss'] ||
    /\btailwindcssPlugin\b/.test(configText)
  ) {
    signals.push('plugin-tailwindcss');
  }
  if (anyImport('@modern-js/runtime/bff')) signals.push('runtime/bff import');
  if (anyImport('@modern-js/runtime/server'))
    signals.push('runtime/server import');
  if (anyCode(/\bApp\.config\b/)) signals.push('App.config');
  if (anyCode(/\bApp\.init\b/)) signals.push('App.init');
  if (anyCode(/\buseRuntimeContext\b/)) signals.push('useRuntimeContext');
  if (exists(dir, 'src', 'pages') && !exists(dir, 'src', 'routes'))
    signals.push('src/pages');
  if (exists(dir, 'server', 'index.ts') || exists(dir, 'server', 'index.js'))
    signals.push('自定义 server (server/index)');
  return signals;
}

// 判定项目可启用性。返回 { state: 'v2'|'v3'|'unknown', reason, signals, appTools }
export function classifyProject(dir) {
  const pkg = JSON.parse(readText(path.join(dir, 'package.json')));
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
  const appTools = deps['@modern-js/app-tools'] ?? null;
  if (appTools == null) {
    return {
      state: 'unknown',
      reason:
        '未检测到 @modern-js/app-tools：feature-enable 仅用于 Modern.js（app-tools）应用',
      signals: [],
      appTools: null,
    };
  }
  const major = Number(String(appTools).match(/(\d+)/)?.[1]);
  if (major === 2) {
    return {
      state: 'v2',
      reason:
        '检测到 Modern.js v2：请先用 modernjs-migrate-to-v3 升级到 v3 再启用功能',
      signals: [],
      appTools,
    };
  }
  if (major === 3) return { state: 'v3', reason: '', signals: [], appTools };
  // 非语义协议（workspace/link/catalog/...）：用 v2-only 信号判定，命中即按 v2 处理
  if (isWorkspaceProto(appTools)) {
    const signals = detectV2Signals(dir);
    if (signals.length) {
      return {
        state: 'v2',
        reason: `检测到 v2-only 信号（${signals.join(', ')}）：请先用 modernjs-migrate-to-v3 升级到 v3 再启用功能`,
        signals,
        appTools,
      };
    }
    return { state: 'v3', reason: '', signals: [], appTools };
  }
  return {
    state: 'unknown',
    reason: `无法判定 Modern.js 版本（@modern-js/app-tools = ${appTools}）：请人工确认为 v3 后再启用`,
    signals: [],
    appTools,
  };
}

// 当前已知的废弃命令（stale doc），供 report/scan 输出，避免引导用户走旧命令
export const DEPRECATED = {
  removedCommands: ['modern new', 'modern upgrade'],
  evidence:
    'guides/upgrade/other.md:107,111 —— Modern.js 3.0 已移除 modern new / modern upgrade，需按文档手动操作',
  staleDocs: [
    'packages/document/docs/{zh,en}/apis/app/commands.mdx 仍残留 `## modern new`，为 stale doc，不可作为现行依据',
  ],
  note: '本 skill 即「按文档手动启用功能」的自动化等价物；不要执行 modern new。',
};

// 功能能力矩阵（scan 与 enable 共用单一事实源）。tier：
//   'auto'     —— 插件式可全自动闭环（装依赖 + modern.config 插件 + 必要文件/示例）
//   'scaffold' —— 配置/脚手架式可自动化：生成可构建骨架 + 依赖/配置，但业务语义需人工补（report 说明）
//   'manual'   —— 需架构决策，v3 无足够源码/文档依据自动化 → 输出可执行 checklist + 原因，不静默假启用
// 依据：bff/ssg=cli/plugin-bff·plugin-ssg；styled-components=cli/plugin-styled-components；
//   tailwind=v3 改 Rsbuild 原生（guides/basic-features/css/tailwindcss.mdx）；server=server-runtime + server/modern.server.ts；
//   microFrontend=v3 无 plugin-garfish，按 module federation / masterApp 架构决策。
export const FEATURE_CATALOG = [
  {
    key: 'bff',
    label: 'BFF（一体化后端）',
    tier: 'auto',
    doc: 'references/enable-bff.md',
  },
  {
    key: 'ssg',
    label: '静态站点生成 SSG',
    tier: 'auto',
    doc: 'references/enable-ssg.md',
  },
  {
    key: 'styled-components',
    label: 'styled-components（CSS-in-JS）',
    tier: 'auto',
    doc: 'references/other-features.md',
  },
  {
    key: 'tailwindcss',
    label: 'Tailwind CSS（v3，Rsbuild 原生）',
    tier: 'scaffold',
    doc: 'references/other-features.md',
  },
  {
    key: 'server',
    label: '自定义 Web Server',
    tier: 'scaffold',
    doc: 'references/other-features.md',
  },
  // 微前端不在本矩阵的「可启用项」里（v3 无 plugin-garfish，是 module federation / masterApp 的架构决策）。
  // 仍保留能力知识：references/other-features.md 有说明，enable.mjs microFrontend 会给独立方案指引（非静默缺失）。
];

export const TIER_LABEL = {
  auto: '可自动启用',
  scaffold: '可脚手架（骨架自动 + 语义人工）',
  manual: '需架构决策（输出 checklist）',
};

function hasTailwindConfig(dir) {
  return [
    'tailwind.config.ts',
    'tailwind.config.js',
    'tailwind.config.cjs',
    'tailwind.config.mjs',
  ].some(f => exists(dir, f));
}

// src 下是否有文件 import 了 tailwind.css（接入完成的标志；未接入则 tailwind 只是「骨架/部分」）
function tailwindCssWired(dir) {
  const src = path.join(dir, 'src');
  const walk = d => {
    if (!fs.existsSync(d)) return [];
    return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
      const p = path.join(d, e.name);
      return e.isDirectory() ? walk(p) : [p];
    });
  };
  return walk(src).some(
    f => /\.(ts|tsx|js|jsx)$/.test(f) && /tailwind\.css/.test(readText(f)),
  );
}

// 功能「是否已启用」探测（只读）。返回 true | false | 'unknown'
export function featureEnabled(key, dir) {
  const configFile = findConfigFile(dir);
  const configText = configFile ? readText(path.join(dir, configFile)) : '';
  const pkg = exists(dir, 'package.json')
    ? JSON.parse(readText(path.join(dir, 'package.json')))
    : {};
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };
  switch (key) {
    case 'bff':
      return isPluginEnabled(configText, '@modern-js/plugin-bff', 'bffPlugin');
    case 'ssg':
      return (
        isPluginEnabled(configText, '@modern-js/plugin-ssg', 'ssgPlugin') &&
        hasOutputSsg(configText)
      );
    case 'styled-components':
      // 插件 + peer（styled-components 库）都在才算完整启用；缺 peer 运行时缺库、不算
      return (
        isPluginEnabled(
          configText,
          '@modern-js/plugin-styled-components',
          'styledComponentsPlugin',
        ) && Boolean(deps['styled-components'])
      );
    case 'tailwindcss':
      // 装了 tailwindcss + 有 config 才算「骨架就绪」；只有 CSS 也被 import 接入了才算完整启用，
      // 否则返回 'partial'（骨架已生成、CSS 接入待确认）——不误报「已启用」。
      if (!(Boolean(deps.tailwindcss) && hasTailwindConfig(dir))) return false;
      return tailwindCssWired(dir) ? true : 'partial';
    case 'server':
      return (
        exists(dir, 'server', 'modern.server.ts') ||
        exists(dir, 'server', 'modern.server.js')
      );
    case 'microFrontend':
      return 'unknown';
    default:
      return false;
  }
}

// 功能状态汇总（scan/enable 共用）：[{ key,label,tier,enabled }]
export function featureMatrix(dir) {
  return FEATURE_CATALOG.map(f => ({
    ...f,
    enabled: featureEnabled(f.key, dir),
  }));
}
