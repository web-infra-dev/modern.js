#!/usr/bin/env node
// 验证 modernjs-feature-enable skill：把 v3-app-no-bff fixture 复制到临时目录，跑
// scan.mjs + enable.mjs bff，断言从「未启用 BFF」迁到「可安装/可构建的 BFF 已启用」形态。
//   node tests/skill/feature-enable.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const SCRIPTS = path.join(REPO, 'skills/modernjs-feature-enable/scripts');
const tmpDirs = [];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name}`);
  }
}

function prepare(fixture) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mj-feat-'));
  tmpDirs.push(work);
  copyDir(path.join(HERE, 'fixtures', fixture), work);
  return {
    work,
    read: rel => fs.readFileSync(path.join(work, rel), 'utf8'),
    has: rel => fs.existsSync(path.join(work, rel)),
    report: () =>
      JSON.parse(
        fs.readFileSync(
          path.join(work, '.agents/runs/modernjs-feature-enable/report.json'),
          'utf8',
        ),
      ),
  };
}

try {
  // ===== BFF：未启用 → 启用 =====
  console.log('== feature-enable bff (v3-app-no-bff) ==');
  const a = prepare('v3-app-no-bff');
  check(
    '[provenance] 含 PROVENANCE.md（裁剪自 create 模板）',
    a.has('PROVENANCE.md'),
  );

  const scanOut = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), a.work],
    {
      encoding: 'utf8',
    },
  );
  check('scan 判定 v3', /\(v3\)/.test(scanOut));
  check('scan: bff 在能力矩阵且未启用', /bff（.*）：未启用/.test(scanOut));
  check(
    'scan: 能力矩阵含 server/tailwindcss/styled-components（不再只 bff/ssg）',
    /server（/.test(scanOut) &&
      /tailwindcss（/.test(scanOut) &&
      /styled-components（/.test(scanOut),
  );
  check(
    'scan: microFrontend 不在「可启用项」矩阵里（按张翔反馈移除）',
    !/microFrontend（/.test(scanOut),
  );

  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', a.work], {
    encoding: 'utf8',
  });

  const pkg = JSON.parse(a.read('package.json'));
  const appToolsVer = pkg.devDependencies['@modern-js/app-tools'];
  check(
    '[auto] 新增 @modern-js/plugin-bff，且版本与 app-tools 一致',
    pkg.dependencies['@modern-js/plugin-bff'] === appToolsVer,
  );

  const cfg = a.read('modern.config.ts');
  check(
    '[auto] config plugins 追加 bffPlugin()（顺序 appTools 在前）',
    /plugins\s*:\s*\[\s*appTools\(\)\s*,\s*bffPlugin\(\)\s*\]/.test(cfg),
  );
  check(
    '[auto] import bffPlugin 只 1 处（不重复声明）',
    (cfg.match(/@modern-js\/plugin-bff/g) || []).length === 1 &&
      /import\s*\{\s*bffPlugin\s*\}\s*from\s*['"]@modern-js\/plugin-bff['"]/.test(
        cfg,
      ),
  );

  const tsconfig = JSON.parse(a.read('tsconfig.json'));
  check(
    '[auto] tsconfig 加 @api/* 别名',
    JSON.stringify(tsconfig.compilerOptions.paths['@api/*']) ===
      JSON.stringify(['./api/lambda/*']),
  );
  check(
    '[auto] tsconfig include 加 api（保留原有 src 等）',
    tsconfig.include.includes('api') && tsconfig.include.includes('src'),
  );
  check(
    '[provenance] tsconfig 原有 @/* 别名保留',
    JSON.stringify(tsconfig.compilerOptions.paths['@/*']) ===
      JSON.stringify(['./src/*']),
  );

  check(
    '[auto] scaffold api/lambda/hello.ts（export const get）',
    a.has('api/lambda/hello.ts') &&
      /export\s+const\s+get\b/.test(a.read('api/lambda/hello.ts')),
  );
  // v3-app-no-bff 的首页是自定义页（非默认模板）→ 不改首页、新建 bff-demo 路由示例
  check(
    '[auto] 自定义首页未改动 → 新建 src/routes/bff-demo/page.tsx',
    a.has('src/routes/bff-demo/page.tsx'),
  );
  check(
    '[e2e] bff-demo 页真实 import @api/hello + useEffect 调用',
    /import\s*\{\s*get as hello\s*\}\s*from\s*['"]@api\/hello['"]/.test(
      a.read('src/routes/bff-demo/page.tsx'),
    ) &&
      /useEffect\(/.test(a.read('src/routes/bff-demo/page.tsx')) &&
      /hello\(\)\.then\(/.test(a.read('src/routes/bff-demo/page.tsx')),
  );

  const report = a.report();
  check('report.changed 含 5 项自动改写', report.changed.length === 5);
  check(
    'report.manual 为空（干净 v3 app 可全自动）',
    report.manual.length === 0,
  );
  check(
    '默认不带 --install：report.install 为 null（install 不无条件默认）',
    report.install === null || report.install === undefined,
  );

  // ===== 幂等：再次 enable 不重复改写 =====
  console.log('== feature-enable bff idempotent (re-run) ==');
  const re = execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'bff', a.work, '--json'],
    { encoding: 'utf8' },
  );
  const reReport = JSON.parse(re);
  check('幂等：第二次 enable 无 changed', reReport.changed.length === 0);
  check(
    '幂等：提示已启用、未重复改写',
    /已启用/.test(reReport.manual.join('\n')),
  );
  const cfg2 = a.read('modern.config.ts');
  check(
    '幂等：bffPlugin() 不重复',
    (cfg2.match(/bffPlugin\(\)/g) || []).length === 1,
  );

  // report 含 deprecated（stale-doc）分层
  check(
    '[stale-doc] report.deprecated 标注 modern new/upgrade 已移除',
    Boolean(
      report.deprecated?.removedCommands?.includes('modern new') &&
        /other\.md/.test(report.deprecated?.evidence ?? ''),
    ),
  );

  // ===== 负向 1：v2 项目（semver 2.x）→ enable 中止、零改动 =====
  console.log('== guard: v2 app (semver 2.x) must abort ==');
  const v2 = prepare('v2-app-needs-migrate');
  let v2Blocked = false;
  try {
    execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', v2.work], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch {
    v2Blocked = true;
  }
  check('[guard] v2 项目 enable 非 0 中止', v2Blocked);
  check('[guard] v2 项目未生成 api/（零改动）', !v2.has('api/lambda/index.ts'));
  check(
    '[guard] v2 项目未写 plugin-bff 依赖',
    !JSON.parse(v2.read('package.json')).dependencies['@modern-js/plugin-bff'],
  );
  check(
    '[guard] v2 项目无 report（未执行）',
    !v2.has('.agents/runs/modernjs-feature-enable/report.json'),
  );

  // ===== 负向 2：workspace:* + v2-only 信号 → 按 v2 中止 =====
  console.log('== guard: workspace + v2 signal must abort ==');
  const wv2 = prepare('v2-workspace-signal');
  let wv2Blocked = false;
  try {
    execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', wv2.work], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch {
    wv2Blocked = true;
  }
  check('[guard] workspace+v2信号 enable 中止（不误判 v3）', wv2Blocked);

  // ===== 负向 3：link: 协议 → enable 放行，但 plugin-bff 进 manual（不照搬错路径）=====
  console.log('== link: protocol → mapped dep manual ==');
  const lk = prepare('v3-app-bff-link');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', lk.work], {
    encoding: 'utf8',
  });
  const lkPkg = JSON.parse(lk.read('package.json'));
  check(
    '[guard] link: 协议未把 app-tools 路径写给 plugin-bff',
    !lkPkg.dependencies['@modern-js/plugin-bff'],
  );
  check(
    '[guard] link: 协议补依赖进 manual',
    /link:.*手动添加.*plugin-bff/s.test(lk.report().manual.join('\n')),
  );
  check(
    '[guard] link: 既有依赖仍可被改 config（plugins 加 bffPlugin）',
    /bffPlugin\(\)/.test(lk.read('modern.config.ts')),
  );

  // ===== SSG：未启用 → 启用（clean v3 app）=====
  console.log('== feature-enable ssg (v3-app-no-bff) ==');
  const s = prepare('v3-app-no-bff');
  const sScan = execFileSync('node', [path.join(SCRIPTS, 'scan.mjs'), s.work], {
    encoding: 'utf8',
  });
  check('scan: ssg 在能力矩阵且未启用', /ssg（.*）：未启用/.test(sScan));
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', s.work], {
    encoding: 'utf8',
  });
  const sPkg = JSON.parse(s.read('package.json'));
  check(
    '[auto] 新增 @modern-js/plugin-ssg，版本与 app-tools 一致',
    sPkg.dependencies['@modern-js/plugin-ssg'] ===
      sPkg.devDependencies['@modern-js/app-tools'],
  );
  const sCfg = s.read('modern.config.ts');
  check(
    '[auto] plugins 追加 ssgPlugin()',
    /plugins\s*:\s*\[\s*appTools\(\)\s*,\s*ssgPlugin\(\)\s*\]/.test(sCfg),
  );
  check(
    '[auto] output 合并 ssg: true',
    /output\s*:\s*\{[^}]*ssg:\s*true/.test(sCfg),
  );
  check(
    '[auto] import ssgPlugin 只 1 处',
    (sCfg.match(/@modern-js\/plugin-ssg/g) || []).length === 1,
  );

  // SSG：已有 output 块 → 合并 ssg、保留其它 key
  console.log('== feature-enable ssg (existing output → merge) ==');
  const so = prepare('v3-app-ssg-output');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', so.work], {
    encoding: 'utf8',
  });
  const soCfg = so.read('modern.config.ts');
  check(
    '[auto] 既有 output.polyfill 保留 + 合并 ssg: true',
    /ssg:\s*true/.test(soCfg) && /polyfill:\s*'usage'/.test(soCfg),
  );

  // ===== CJS：module.exports/require 配置插 require 绑定（梅长苏 blocker）=====
  console.log('== feature-enable bff (CJS module.exports config) ==');
  const cjs = prepare('v3-app-cjs-config');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', cjs.work], {
    encoding: 'utf8',
  });
  const cjsCfg = cjs.read('modern.config.js');
  check(
    '[auto] CJS 配置插入 require 绑定（非 ESM import）',
    /const\s*\{\s*bffPlugin\s*\}\s*=\s*require\(\s*['"]@modern-js\/plugin-bff['"]\s*\)/.test(
      cjsCfg,
    ),
  );
  check(
    '[auto] CJS plugins 追加 bffPlugin()',
    /plugins\s*:\s*\[[^\]]*bffPlugin\(\)/.test(cjsCfg),
  );
  check(
    '[auto] CJS 未引入 ESM import（保持 module.exports 风格）',
    !/^import\s/m.test(cjsCfg),
  );
  check(
    '[auto] CJS config report.manual 无「绑定缺失」类残留',
    !/undefined|未导入/.test(cjs.report().manual.join('\n')),
  );

  // ===== call 但缺绑定（半启用坏态）→ 补齐绑定、不重复加调用 =====
  console.log('== feature-enable bff (call without binding → repair) ==');
  const nb = prepare('v3-app-bff-no-binding');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', nb.work], {
    encoding: 'utf8',
  });
  const nbCfg = nb.read('modern.config.ts');
  check(
    '[repair] 补齐缺失的 bffPlugin import 绑定',
    /import\s*\{\s*bffPlugin\s*\}\s*from\s*['"]@modern-js\/plugin-bff['"]/.test(
      nbCfg,
    ),
  );
  check(
    '[repair] bffPlugin() 调用不重复（仍只 1 处）',
    (nbCfg.match(/bffPlugin\(\)/g) || []).length === 1,
  );

  // ===== 绑定解析 blocker（刺儿头 + 梅长苏）=====
  // B1：普通字符串里的伪 import 不算绑定 → 必须插入真实 import，字符串原样
  console.log('== binding: string fake import ≠ real binding ==');
  const sf = prepare('v3-app-string-fake-import');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', sf.work], {
    encoding: 'utf8',
  });
  const sfCfg = sf.read('modern.config.ts');
  check(
    '插入真实 import { bffPlugin } from ...（非依赖字符串伪 import）',
    /^import\s*\{\s*bffPlugin\s*\}\s*from\s*['"]@modern-js\/plugin-bff['"]/m.test(
      sfCfg,
    ),
  );
  check('普通字符串伪 import 原样保留', sfCfg.includes('const doc ='));

  // B2：specifier 在但缺 export + 有调用 → 把 export 加进现有大括号，调用不重复
  console.log(
    '== binding: specifier present, export missing → add to braces ==',
  );
  const sm = prepare('v3-app-bff-specifier-missing');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', sm.work], {
    encoding: 'utf8',
  });
  const smCfg = sm.read('modern.config.ts');
  check(
    'bffPlugin 加进现有 import 大括号（{ other, bffPlugin }）',
    /import\s*\{[^}]*\bother\b[^}]*\bbffPlugin\b[^}]*\}\s*from\s*['"]@modern-js\/plugin-bff['"]/.test(
      smCfg,
    ),
  );
  check(
    'bffPlugin() 调用不重复（仍 1 处）',
    (smCfg.match(/bffPlugin\(\)/g) || []).length === 1,
  );

  // B3：ESM alias 已启用 → 幂等（不重复 append alias 调用）
  console.log('== idempotent: ESM alias already enabled ==');
  const al = prepare('v3-app-bff-alias');
  const alOut = execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'bff', al.work, '--json'],
    { encoding: 'utf8' },
  );
  check(
    'alias 已启用：插件部分进 manual（已启用），不重复改 config',
    /已启用/.test(JSON.parse(alOut).manual.join('\n')),
  );
  check(
    'alias 调用不重复（bff() 仍 1 处，未误判 alias 而重复 append）',
    (al.read('modern.config.ts').match(/\bbff\(\)/g) || []).length === 1,
  );

  // B4：SSG 半启用（有 plugin、缺 output.ssg）→ 补齐 output.ssg
  console.log(
    '== ssg: half-enabled (plugin, no output.ssg) → add output.ssg ==',
  );
  const sh = prepare('v3-app-ssg-half');
  const shScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), sh.work],
    {
      encoding: 'utf8',
    },
  );
  check('scan: 半启用 SSG 不被标为已启用', /ssg（.*）：未启用/.test(shScan));
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', sh.work], {
    encoding: 'utf8',
  });
  const shCfg = sh.read('modern.config.ts');
  check('补齐 output.ssg: true', /output\s*:\s*\{[^}]*ssg:\s*true/.test(shCfg));
  check(
    'ssgPlugin() 调用不重复（仍 1 处）',
    (shCfg.match(/ssgPlugin\(\)/g) || []).length === 1,
  );

  // B5：type-only import 不算 value 绑定 → 另插一条 value import，type import 原样
  console.log('== binding: import type ≠ value binding ==');
  const ti = prepare('v3-app-bff-type-import');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', ti.work], {
    encoding: 'utf8',
  });
  const tiCfg = ti.read('modern.config.ts');
  check(
    'import type 原样保留（未被塞入 bffPlugin）',
    /import\s+type\s*\{\s*BffConfig\s*\}\s*from\s*['"]@modern-js\/plugin-bff['"]/.test(
      tiCfg,
    ),
  );
  check(
    '另插一条 value import { bffPlugin }',
    /^import\s*\{\s*bffPlugin\s*\}\s*from\s*['"]@modern-js\/plugin-bff['"]/m.test(
      tiCfg,
    ),
  );
  check(
    'plugins 追加 bffPlugin()',
    /plugins\s*:\s*\[[^\]]*bffPlugin\(\)/.test(tiCfg),
  );

  // B6：output.ssg: false 不算已启用 → scan 未启用 + enable 翻成 true
  console.log('== ssg: output.ssg false ≠ enabled → flip to true ==');
  const sff = prepare('v3-app-ssg-false');
  const sffScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), sff.work],
    { encoding: 'utf8' },
  );
  check(
    'scan: output.ssg:false 不被标为已启用',
    /ssg（.*）：未启用/.test(sffScan),
  );
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', sff.work], {
    encoding: 'utf8',
  });
  const sffCfg = sff.read('modern.config.ts');
  check(
    'output.ssg: false → true（按启用意图）',
    /\bssg\s*:\s*true\b/.test(sffCfg),
  );
  check('未残留 ssg: false', !/\bssg\s*:\s*false\b/.test(sffCfg));

  // B7：output.ssg 结构化改写——只翻顶层真实 ssg，不动字符串/注释/嵌套 experimental.ssg
  console.log(
    '== ssg: structural output.ssg (string/comment/nested untouched) ==',
  );
  const to = prepare('v3-app-ssg-tricky-output');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', to.work], {
    encoding: 'utf8',
  });
  const toCfg = to.read('modern.config.ts');
  check('顶层 output.ssg false → true', /\bssg\s*:\s*true\b/.test(toCfg));
  check(
    '字符串 "ssg: false in a string" 原样保留',
    toCfg.includes('ssg: false in a string'),
  );
  check(
    '注释 // ssg: false 原样保留',
    toCfg.includes('// ssg: false in a comment'),
  );
  check(
    '嵌套 experimental: { ssg: false } 原样保留',
    /experimental\s*:\s*\{\s*ssg\s*:\s*false\s*\}/.test(toCfg),
  );
  check(
    'output.ssg true 仅 1 处（未误翻其它）',
    (toCfg.match(/\bssg\s*:\s*true\b/g) || []).length === 1,
  );

  // B8：output 值非对象字面量（动态表达式）→ 进 manual，不改坏表达式
  console.log('== ssg: output value is expression → manual (untouched) ==');
  const oe = prepare('v3-app-ssg-output-expr');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', oe.work], {
    encoding: 'utf8',
  });
  const oeCfg = oe.read('modern.config.ts');
  check(
    '动态 output 表达式原样保留',
    oeCfg.includes('makeOutput({ ssg: false })'),
  );
  check(
    'output 非对象字面量进 manual',
    /output 值不是对象字面量/.test(oe.report().manual.join('\n')),
  );

  // B9：output.ssg 值为 undefined（非启用字面量）→ scan 未启用 + enable 翻 true
  console.log('== ssg: output.ssg undefined ≠ enabled → flip ==');
  const su = prepare('v3-app-ssg-undefined');
  const suScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), su.work],
    { encoding: 'utf8' },
  );
  check(
    'scan: output.ssg undefined 不被标已启用',
    /ssg（.*）：未启用/.test(suScan),
  );
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', su.work], {
    encoding: 'utf8',
  });
  const suCfg = su.read('modern.config.ts');
  check('output.ssg undefined → true', /\bssg\s*:\s*true\b/.test(suCfg));
  check('未残留 ssg: undefined', !/\bssg\s*:\s*undefined\b/.test(suCfg));

  // B10：output 值是数组字面量（非对象）→ 同样进 manual、不下钻改写
  console.log('== ssg: output value is array literal → manual (untouched) ==');
  const oa = prepare('v3-app-ssg-output-array');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', oa.work], {
    encoding: 'utf8',
  });
  const oaCfg = oa.read('modern.config.ts');
  check(
    '数组 output 原样保留',
    /output:\s*\[\{\s*ssg:\s*false\s*\}\]/.test(oaCfg),
  );
  check(
    'output 数组进 manual（未误改成对象）',
    /output 值不是对象字面量/.test(oa.report().manual.join('\n')) &&
      !/\bssg\s*:\s*true\b/.test(oaCfg),
  );

  // B11：output.ssg 值为数组（类型非法 boolean|object）→ scan 不算已启用 + enable 进 manual
  console.log('== ssg: output.ssg array value is invalid → manual ==');
  const av = prepare('v3-app-ssg-array-value');
  const avScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), av.work],
    { encoding: 'utf8' },
  );
  check('scan: output.ssg 数组值不算已启用', /ssg（.*）：未启用/.test(avScan));
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', av.work], {
    encoding: 'utf8',
  });
  const avCfg = av.read('modern.config.ts');
  check('output.ssg 数组值原样保留（未误翻 true）', /ssg:\s*\[\]/.test(avCfg));
  check(
    'output.ssg 数组值进 manual（非法字面量）',
    /非法字面量/.test(av.report().manual.join('\n')),
  );

  // B12：ssgByEntries 值语义（与 ssg 同一套）—— 源码 util.ts:117 / adapterSSR.ts:214
  console.log('== ssg: ssgByEntries value semantics ==');
  // (a) 空对象 {} → 源码忽略，回落普通 ssg → scan 未启用 + enable 补 ssg: true（保留空 ssgByEntries）
  const be = prepare('v3-app-ssg-byentries-empty');
  const beScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), be.work],
    { encoding: 'utf8' },
  );
  check('scan: ssgByEntries:{} 不算已启用', /ssg（.*）：未启用/.test(beScan));
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', be.work], {
    encoding: 'utf8',
  });
  const beCfg = be.read('modern.config.ts');
  check(
    'ssgByEntries:{} → 补 output.ssg: true（保留空对象）',
    /\bssg\s*:\s*true\b/.test(beCfg) && /ssgByEntries:\s*\{\s*\}/.test(beCfg),
  );

  // (b) 全 false → scan 未启用 + enable 进 manual、原样不动
  const bf = prepare('v3-app-ssg-byentries-false');
  const bfScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), bf.work],
    { encoding: 'utf8' },
  );
  check(
    'scan: ssgByEntries 全 false 不算已启用',
    /ssg（.*）：未启用/.test(bfScan),
  );
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', bf.work], {
    encoding: 'utf8',
  });
  const bfCfg = bf.read('modern.config.ts');
  check(
    'ssgByEntries 全 false → manual、不静默改写',
    /所有入口均为非启用值/.test(bf.report().manual.join('\n')) &&
      /main:\s*false,\s*home:\s*false/.test(bfCfg) &&
      !/\bssg\s*:\s*true\b/.test(bfCfg),
  );

  // (c) 动态 entry 值 → scan 未启用 + enable 进 manual 要求人工确认
  const bd = prepare('v3-app-ssg-byentries-dynamic');
  const bdScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), bd.work],
    { encoding: 'utf8' },
  );
  check(
    'scan: ssgByEntries 动态值不算已启用',
    /ssg（.*）：未启用/.test(bdScan),
  );
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'ssg', bd.work], {
    encoding: 'utf8',
  });
  check(
    'ssgByEntries 动态值 → manual（要求人工确认）',
    /含动态\/无法静态确认/.test(bd.report().manual.join('\n')),
  );

  // (d) 任一 entry 为 true → 算已启用
  const bt = prepare('v3-app-ssg-byentries-true');
  const btScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), bt.work],
    { encoding: 'utf8' },
  );
  check(
    'scan: ssgByEntries 含 true 算已启用',
    /ssg（.*）：已启用/.test(btScan),
  );
  // 已启用文案按实际字段精确化：ssgByEntries 启用时不写成 output.ssg
  const btRe = execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'ssg', bt.work, '--json'],
    { encoding: 'utf8' },
  );
  check(
    'ssgByEntries 已启用文案点名 ssgByEntries（不误写 output.ssg）',
    /ssgByEntries（已有入口启用）/.test(JSON.parse(btRe).manual.join('\n')),
  );

  // ===== D. BFF 端到端示例：默认模板首页 → 安全接首页 =====
  console.log('== D1. bff e2e: default template homepage → patch 首页 ==');
  const dp = prepare('v3-app-default-page');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', dp.work], {
    encoding: 'utf8',
  });
  const dpPage = dp.read('src/routes/page.tsx');
  check(
    '默认模板首页被接入 BFF 调用（import @api/hello + useEffect，未走 bff-demo）',
    /import\s*\{\s*get as hello\s*\}\s*from\s*['"]@api\/hello['"]/.test(
      dpPage,
    ) &&
      /useEffect\(/.test(dpPage) &&
      /hello\(\)\.then\(/.test(dpPage) &&
      !dp.has('src/routes/bff-demo/page.tsx'),
  );
  check(
    'api/lambda/hello.ts 生成（export const get）',
    /export\s+const\s+get\b/.test(dp.read('api/lambda/hello.ts')),
  );
  // 幂等：再跑一次首页不重复改、不报 changed
  const dpRe = execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'bff', dp.work, '--json'],
    { encoding: 'utf8' },
  );
  check(
    '幂等：默认页已接入后再跑 changed 为空',
    JSON.parse(dpRe).changed.length === 0,
  );

  // ===== D2. BFF：已有 api 不覆盖，复用真实函数 =====
  console.log('== D2. bff e2e: existing api reused (no overwrite) ==');
  const ea = prepare('v3-app-bff-existing-api');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', ea.work], {
    encoding: 'utf8',
  });
  check(
    '已有 api/lambda/hello.ts 未被覆盖（仍是用户内容）',
    /existing api response/.test(ea.read('api/lambda/hello.ts')),
  );
  check(
    '复用已有 api 进 manual（说明未改用户 API）',
    /复用已有 api\/lambda\/hello/.test(ea.report().manual.join('\n')),
  );
  check(
    '默认首页接入复用的 @api/hello 调用',
    /@api\/hello/.test(ea.read('src/routes/page.tsx')),
  );

  // ===== D3. server 骨架化 =====
  console.log('== D3. enable server (scaffold) ==');
  const sv = prepare('v3-app-no-bff');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'server', sv.work], {
    encoding: 'utf8',
  });
  const svServer = sv.has('server/modern.server.ts')
    ? sv.read('server/modern.server.ts')
    : '';
  check(
    'server: 加 @modern-js/server-runtime + modern.server.ts 含 middlewares/renderMiddlewares/plugins/onError 字段',
    JSON.parse(sv.read('package.json')).dependencies[
      '@modern-js/server-runtime'
    ] &&
      /defineServerConfig\(\{/.test(svServer) &&
      /middlewares:/.test(svServer) &&
      /renderMiddlewares:/.test(svServer) &&
      /plugins:/.test(svServer) &&
      /onError:/.test(svServer),
  );
  check(
    'server: 骨架仍可 build（示例都在注释里，字段给空数组/no-op，无半成品 handler 引用）',
    !/handler:\s*requestTiming|handler:\s*renderTiming/.test(
      svServer.replace(/\/\/[^\n]*/g, ''),
    ),
  );
  check(
    'server: 骨架无 TS 类型语法（import type / : MiddlewareHandler）——未必转译加载，取消注释示例也不会 SyntaxError',
    !/\bimport\s+type\b/.test(svServer) &&
      !/:\s*MiddlewareHandler\b/.test(svServer),
  );
  check(
    'server: 业务语义进 manual（不声称已迁好）',
    /业务语义需人工补全/.test(sv.report().manual.join('\n')),
  );
  const svRe = execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'server', sv.work, '--json'],
    { encoding: 'utf8' },
  );
  check('server 幂等：再跑不重复生成', JSON.parse(svRe).changed.length === 0);

  // ===== D4. styled-components（插件式自动化）=====
  console.log('== D4. enable styled-components ==');
  const sc = prepare('v3-app-no-bff');
  execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'styled-components', sc.work],
    { encoding: 'utf8' },
  );
  const scCfg = sc.read('modern.config.ts');
  check(
    'styled-components: 加依赖 + plugins 追加 styledComponentsPlugin()',
    JSON.parse(sc.read('package.json')).dependencies[
      '@modern-js/plugin-styled-components'
    ] && /styledComponentsPlugin\(\)/.test(scCfg),
  );

  // ===== D5. tailwindcss（Rsbuild 原生脚手架）=====
  console.log('== D5. enable tailwindcss (Rsbuild-native scaffold) ==');
  const tw = prepare('v3-app-no-bff');
  execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'tailwindcss', tw.work],
    {
      encoding: 'utf8',
    },
  );
  const twPkg = JSON.parse(tw.read('package.json'));
  check(
    'tailwindcss: 装 tailwindcss/postcss/autoprefixer + tailwind.config + postcss.config + @tailwind css',
    twPkg.devDependencies.tailwindcss &&
      tw.has('tailwind.config.ts') &&
      tw.has('postcss.config.cjs') &&
      /@tailwind base/.test(tw.read('src/tailwind.css')),
  );
  // 关键：CSS 自动接入根布局，用正确相对路径 `../tailwind.css`（不是会 build 失败的 './tailwind.css'）
  check(
    "tailwindcss: 自动 import '../tailwind.css' 进 src/routes/layout（路径正确、可 build）",
    /import\s*['"]\.\.\/tailwind\.css['"]/.test(
      tw.read('src/routes/layout.tsx'),
    ),
  );
  check(
    'tailwindcss: v4 分支说明进 manual',
    /Tailwind v4/.test(tw.report().manual.join('\n')),
  );
  // 接入后 scan 视为已启用；未接入（无 layout 自动接入路径）则应是 partial 而非已启用
  const twScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), tw.work],
    {
      encoding: 'utf8',
    },
  );
  check(
    'tailwindcss: CSS 已接入 → scan 已启用（接入前为 partial 而非误报已启用）',
    /tailwindcss（.*）：已启用/.test(twScan),
  );

  // ===== D6. microFrontend：不自动化 → 可执行 checklist + 原因，不改文件 =====
  console.log('== D6. enable microFrontend (manual plan checklist) ==');
  const mf = prepare('v3-app-no-bff');
  const mfOut = execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'microFrontend', mf.work, '--json'],
    { encoding: 'utf8' },
  );
  const mfReport = JSON.parse(mfOut);
  check(
    'microFrontend: tier=manual、changed 为空（未改文件）',
    mfReport.tier === 'manual' && mfReport.changed.length === 0,
  );
  check(
    'microFrontend: 输出原因 + 可执行 checklist（非 unsupported）',
    /架构决策/.test(mfReport.manual.join('\n')) &&
      mfReport.manual.some(m => /\[1\]/.test(m)),
  );
  check(
    'microFrontend: 明确「未改任何文件 + 架构方案」、complete=false、不报启用成功',
    /未改任何文件/.test(mfReport.manual.join('\n')) &&
      mfReport.complete === false,
  );
  check(
    'microFrontend: 未改写 modern.config / package.json',
    !/garfish|masterApp/.test(mf.read('modern.config.ts')),
  );

  // ===== D7. BFF：已有 api/lambda/index.ts → import @api/index（不是裸 @api，alias 才解析得到）=====
  console.log('== D7. bff e2e: existing index.ts → @api/index import ==');
  const ix = prepare('v3-app-bff-index-api');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', ix.work], {
    encoding: 'utf8',
  });
  const ixPage = ix.read('src/routes/page.tsx');
  check(
    'index.ts 复用且 import 用 @api/index（非裸 @api）',
    /from\s*['"]@api\/index['"]/.test(ixPage) &&
      !/from\s*['"]@api['"]/.test(ixPage),
  );
  check(
    'index.ts 未被覆盖（仍是用户内容）',
    /index api response/.test(ix.read('api/lambda/index.ts')),
  );

  // ===== D8. BFF 页面：自定义业务首页（非 generator 模板）不被覆盖 → 走 bff-demo =====
  console.log('== D8. bff e2e: custom welcome homepage NOT overwritten ==');
  const cw = prepare('v3-app-custom-welcome');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', cw.work], {
    encoding: 'utf8',
  });
  check(
    '自定义 welcome 首页未被覆盖（Welcome to my app 仍在、无 @api 注入）',
    /Welcome to my app/.test(cw.read('src/routes/page.tsx')) &&
      !/@api\//.test(cw.read('src/routes/page.tsx')),
  );
  check(
    '改走 src/routes/bff-demo/page.tsx（含 @api/hello 调用）',
    cw.has('src/routes/bff-demo/page.tsx') &&
      /@api\/hello/.test(cw.read('src/routes/bff-demo/page.tsx')),
  );

  // ===== D9. styled-components：补 peer styled-components；缺 peer 不算完整启用 =====
  console.log('== D9. styled-components peer + completeness ==');
  const scp = prepare('v3-app-no-bff');
  execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'styled-components', scp.work],
    { encoding: 'utf8' },
  );
  const scpPkg = JSON.parse(scp.read('package.json'));
  check(
    'styled-components: 补装 peer styled-components 到 dependencies',
    Boolean(scpPkg.dependencies['styled-components']),
  );
  // scan：缺 peer 时不算完整启用（删掉 peer 再扫）
  const scpNoPeer = prepare('v3-app-no-bff');
  execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'styled-components', scpNoPeer.work],
    { encoding: 'utf8' },
  );
  const noPeerPkgPath = path.join(scpNoPeer.work, 'package.json');
  const noPeerPkg = JSON.parse(scpNoPeer.read('package.json'));
  delete noPeerPkg.dependencies['styled-components'];
  fs.writeFileSync(noPeerPkgPath, `${JSON.stringify(noPeerPkg, null, 2)}\n`);
  const noPeerScan = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), scpNoPeer.work],
    { encoding: 'utf8' },
  );
  check(
    'scan: 缺 styled-components peer → 不标已启用',
    /styled-components（.*）：未启用/.test(noPeerScan),
  );

  // ===== D10. scaffold tier（tailwind/server）：依赖进 changed、report.tier=scaffold（非完整 auto）=====
  console.log('== D10. scaffold tier + deps in changed ==');
  const tw2 = prepare('v3-app-no-bff');
  const tw2Out = execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'tailwindcss', tw2.work, '--json'],
    { encoding: 'utf8' },
  );
  const tw2Report = JSON.parse(tw2Out);
  check(
    'tailwindcss: 依赖改动进 changed（tailwindcss/postcss/autoprefixer）',
    tw2Report.changed.some(c => /tailwindcss@/.test(c)) &&
      tw2Report.changed.some(c => /autoprefixer@/.test(c)),
  );
  check(
    'tailwindcss: report.tier=scaffold、complete=false（非完整 auto 启用）',
    tw2Report.tier === 'scaffold' && tw2Report.complete === false,
  );
  const sv2 = prepare('v3-app-no-bff');
  const sv2Out = execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'server', sv2.work, '--json'],
    { encoding: 'utf8' },
  );
  check(
    'server: report.tier=scaffold（非 auto）',
    JSON.parse(sv2Out).tier === 'scaffold',
  );

  // ===== D11. styled-components 半启用：config 有插件但缺 peer → 仍补 peer（不直接 return）=====
  console.log(
    '== D11. styled-components half-enabled (plugin present, peer missing) ==',
  );
  const shc = prepare('v3-app-styled-half');
  const shScan1 = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), shc.work],
    {
      encoding: 'utf8',
    },
  );
  check(
    'scan: 有插件但缺 peer → 未启用（半启用不算完整）',
    /styled-components（.*）：未启用/.test(shScan1),
  );
  const shOut = execFileSync(
    'node',
    [path.join(SCRIPTS, 'enable.mjs'), 'styled-components', shc.work, '--json'],
    { encoding: 'utf8' },
  );
  const shReport = JSON.parse(shOut);
  check(
    'enable: 半启用态补 peer（changed 含 styled-components）',
    shReport.changed.some(c => /styled-components@/.test(c)) &&
      Boolean(
        JSON.parse(shc.read('package.json')).dependencies['styled-components'],
      ),
  );
  check(
    'enable: 插件未重复 append（styledComponentsPlugin() 仍 1 处）',
    (shc.read('modern.config.ts').match(/styledComponentsPlugin\(\)/g) || [])
      .length === 1,
  );
  const shScan2 = execFileSync(
    'node',
    [path.join(SCRIPTS, 'scan.mjs'), shc.work],
    {
      encoding: 'utf8',
    },
  );
  check(
    'scan: 补 peer 后 → 已启用',
    /styled-components（.*）：已启用/.test(shScan2),
  );

  // ===== D12. BFF：已有 `export async function get` 也要复用（不只 export const get）=====
  console.log(
    '== D12. bff e2e: existing `export async function get` reused ==',
  );
  const fg = prepare('v3-app-bff-fn-get');
  execFileSync('node', [path.join(SCRIPTS, 'enable.mjs'), 'bff', fg.work], {
    encoding: 'utf8',
  });
  check(
    '函数声明 export async function get 被复用（未新建 bff-demo.ts）',
    /fn-get api response/.test(fg.read('api/lambda/hello.ts')) &&
      !fg.has('api/lambda/bff-demo.ts'),
  );
  check(
    '默认首页接入复用的 @api/hello（import { get as hello }）',
    /import\s*\{\s*get as hello\s*\}\s*from\s*['"]@api\/hello['"]/.test(
      fg.read('src/routes/page.tsx'),
    ),
  );

  // ===== D13. --install 失败要诚实：非 0 退出 + report 给 stderr/补救命令，不报「一步到位完成」=====
  console.log(
    '== D13. --install honest failure (broken dep → non-zero + hint) ==',
  );
  const inf = prepare('v3-app-install-fail');
  let infThrew = false;
  let infOut = '';
  try {
    infOut = execFileSync(
      'node',
      [
        path.join(SCRIPTS, 'enable.mjs'),
        'styled-components',
        inf.work,
        '--install',
        '--json',
      ],
      { encoding: 'utf8', stdio: 'pipe' },
    );
  } catch (e) {
    infThrew = true; // execFileSync 在非 0 退出时抛错 → 验证「失败非 0」
    infOut = e.stdout || '';
  }
  check('[install] 安装失败时进程非 0 退出（不把失败当完成）', infThrew);
  let infReport = null;
  try {
    infReport = JSON.parse(infOut);
  } catch {
    infReport = inf.report();
  }
  check(
    '[install] report.install.ok=false 且带补救提示（approve-builds / 手动安装）',
    infReport.install &&
      infReport.install.ok === false &&
      /approve-builds|手动安装/.test(infReport.install.hint || ''),
  );
  check(
    '[install] 安装失败进 manual（含 stderr），但源文件改动已落盘',
    /依赖安装失败/.test(infReport.manual.join('\n')) &&
      /styledComponentsPlugin\(\)/.test(inf.read('modern.config.ts')),
  );
  // 重试/幂等：插件已启用(enable 此次幂等)，再跑 --install 仍会装（不被 changed=0 门控），失败仍非 0
  let infRetryThrew = false;
  let infRetryOut = '';
  try {
    infRetryOut = execFileSync(
      'node',
      [
        path.join(SCRIPTS, 'enable.mjs'),
        'styled-components',
        inf.work,
        '--install',
        '--json',
      ],
      { encoding: 'utf8', stdio: 'pipe' },
    );
  } catch (e) {
    infRetryThrew = true;
    infRetryOut = e.stdout || '';
  }
  let infRetry = null;
  try {
    infRetry = JSON.parse(infRetryOut);
  } catch {
    infRetry = inf.report();
  }
  check(
    '[install] 重试路径：enable 已幂等仍跑 --install（install 非 null）且失败仍非 0',
    infRetryThrew && infRetry.install && infRetry.install.ok === false,
  );

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  if (fail > 0) process.exit(1);
  console.log('✅ feature-enable skill 验证通过');
} finally {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
}
