#!/usr/bin/env node
// 验证 modernjs-migrate-to-v3 的 tsconfig 迁移（scripts/migrate-tsconfig.mjs，以及 migrate.mjs 中的调用）。
// 输入以 fixtures/v3-legacy-tsconfig-bff（旧创建模板的 tsconfig）为基础，按用例改写后复制到临时目录。
//   node tests/skill/migrate-tsconfig.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const SCRIPTS = path.join(REPO, 'skills/modernjs-migrate-to-v3/scripts');
const CODEMOD = path.join(SCRIPTS, 'migrate-tsconfig.mjs');
const FIXTURE = path.join(HERE, 'fixtures', 'v3-legacy-tsconfig-bff');
const SERVER_TSCONFIG = {
  extends: './tsconfig.json',
  compilerOptions: {
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    noEmit: false,
    declaration: false,
  },
  include: ['api', 'server', 'shared'],
};
const tmpDirs = [];

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

// 复制 fixture 到临时目录，再用 mutate 改出各用例的项目形态
function prepare(mutate = () => {}) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mj-tsconfig-'));
  tmpDirs.push(work);
  fs.cpSync(FIXTURE, work, { recursive: true });
  fs.rmSync(path.join(work, 'PROVENANCE.md'));
  const p = {
    work,
    file: rel => path.join(work, rel),
    has: rel => fs.existsSync(path.join(work, rel)),
    read: rel => fs.readFileSync(path.join(work, rel), 'utf8'),
    json: rel => JSON.parse(fs.readFileSync(path.join(work, rel), 'utf8')),
    write: (rel, content) => {
      fs.mkdirSync(path.dirname(path.join(work, rel)), { recursive: true });
      fs.writeFileSync(
        path.join(work, rel),
        typeof content === 'string'
          ? content
          : `${JSON.stringify(content, null, 2)}\n`,
      );
    },
    run: () =>
      JSON.parse(
        execFileSync('node', [CODEMOD, work, '--json'], { encoding: 'utf8' }),
      ),
    report: () =>
      JSON.parse(
        fs.readFileSync(
          path.join(work, '.agents/runs/modernjs-migrate/report.json'),
          'utf8',
        ),
      ),
  };
  mutate(p);
  return p;
}

try {
  console.log('== 1. 旧创建模板 + BFF + CommonJS ==');
  const legacy = prepare();
  const r1 = legacy.run();
  const ts1 = legacy.json('tsconfig.json');
  check(
    '[auto] 删除 baseUrl "./"',
    !('baseUrl' in ts1.compilerOptions) &&
      r1.changed.some(c => /删除 compilerOptions\.baseUrl/.test(c)),
  );
  check(
    '[auto] 保留原有 paths 与其他字段',
    ts1.compilerOptions.paths['@/*'][0] === './src/*' &&
      ts1.compilerOptions.paths['@shared/*'][0] === './shared/*' &&
      ts1.compilerOptions.jsx === 'preserve' &&
      ts1.extends === '@modern-js/tsconfig/base',
  );
  check(
    '[auto] 补 "@api/*": ["./api/lambda/*"]',
    JSON.stringify(ts1.compilerOptions.paths['@api/*']) ===
      JSON.stringify(['./api/lambda/*']),
  );
  check(
    '[auto] 生成标准 tsconfig.server.json',
    legacy.has('tsconfig.server.json') &&
      JSON.stringify(legacy.json('tsconfig.server.json')) ===
        JSON.stringify(SERVER_TSCONFIG),
  );
  check('[auto] 无人工项', r1.manual.length === 0);
  check(
    '[format] 短数组保持单行',
    /"@api\/\*": \["\.\/api\/lambda\/\*"\]/.test(legacy.read('tsconfig.json')),
  );
  const rep1 = legacy.report();
  check(
    '[report] 写入 report.json 的 changed',
    rep1.changed.length === 3 && Array.isArray(rep1.manual),
  );

  console.log('== 2. 幂等 ==');
  const before = {
    ts: legacy.read('tsconfig.json'),
    server: legacy.read('tsconfig.server.json'),
  };
  const r2 = legacy.run();
  check(
    '[idempotent] 第二次执行无改写、无人工项',
    r2.changed.length === 0 && r2.manual.length === 0,
  );
  check(
    '[idempotent] 文件内容不变',
    legacy.read('tsconfig.json') === before.ts &&
      legacy.read('tsconfig.server.json') === before.server,
  );
  check(
    '[report] 重复执行不会重复写入 report 条目',
    legacy.report().changed.length === 3,
  );

  console.log('== 3. type: module 项目 ==');
  const esm = prepare(p => {
    p.write('package.json', { ...p.json('package.json'), type: 'module' });
  });
  const r3 = esm.run();
  check('[esm] 不生成 tsconfig.server.json', !esm.has('tsconfig.server.json'));
  check(
    '[esm] baseUrl 仍删除、@api/* 仍补充',
    r3.changed.length === 2 &&
      !('baseUrl' in esm.json('tsconfig.json').compilerOptions),
  );

  console.log('== 4. 自定义 baseUrl ==');
  const custom = prepare(p => {
    const ts = p.json('tsconfig.json');
    ts.compilerOptions.baseUrl = './src';
    ts.compilerOptions.paths = { '@/*': ['*'], '@shared/*': ['../shared/*'] };
    p.write('tsconfig.json', ts);
  });
  const customBefore = custom.read('tsconfig.json');
  const r4 = custom.run();
  const manual4 = r4.manual.join('\n');
  check(
    '[manual] 不删除自定义 baseUrl，tsconfig.json 不改写',
    custom.read('tsconfig.json') === customBefore,
  );
  check(
    '[manual] 给出加前缀后的 paths 写法',
    /"\.\/src"/.test(manual4) &&
      manual4.includes('"@/*": ["./src/*"]') &&
      manual4.includes('"@shared/*": ["./shared/*"]'),
  );
  check(
    '[manual] @api/* 放进人工清单（依赖 baseUrl 改写后再加）',
    /@api\/\*/.test(manual4),
  );
  check(
    '[auto] tsconfig.server.json 仍生成',
    custom.has('tsconfig.server.json'),
  );

  console.log('== 4b. baseUrl "./" 但没有 paths ==');
  const noPaths = prepare(p => {
    const ts = p.json('tsconfig.json');
    delete ts.compilerOptions.paths;
    p.write('tsconfig.json', ts);
  });
  const noPathsBefore = noPaths.read('tsconfig.json');
  const r4b = noPaths.run();
  const manual4b = r4b.manual.join('\n');
  check(
    '[manual] 没有 paths 时保留 baseUrl，tsconfig.json 不改写',
    noPaths.read('tsconfig.json') === noPathsBefore,
  );
  check(
    '[manual] 提示先用 paths "*": ["./*"] 映射裸导入再删 baseUrl',
    manual4b.includes('"*": ["./*"]') && /baseUrl/.test(manual4b),
  );
  check(
    '[manual] 保留 baseUrl 时 @api/* 不自动补、进人工清单',
    /@api\/\*/.test(manual4b) &&
      !r4b.changed.some(c => /@api/.test(c)) &&
      !('paths' in noPaths.json('tsconfig.json').compilerOptions),
  );
  const r4b2 = noPaths.run();
  check(
    '[idempotent] 再次执行仍不删 baseUrl、不改 tsconfig.json',
    r4b2.changed.length === 0 &&
      noPaths.read('tsconfig.json') === noPathsBefore,
  );

  console.log('== 4c. baseUrl "." + paths ==');
  const dot = prepare(p => {
    const ts = p.json('tsconfig.json');
    ts.compilerOptions.baseUrl = '.';
    p.write('tsconfig.json', ts);
  });
  const r4c = dot.run();
  check(
    '[auto] baseUrl "." 与 "./" 同样删除，并补 @api/*',
    !('baseUrl' in dot.json('tsconfig.json').compilerOptions) &&
      '@api/*' in dot.json('tsconfig.json').compilerOptions.paths &&
      r4c.manual.length === 0,
  );

  console.log('== 5. 含注释的 tsconfig.json ==');
  const jsonc = prepare(p => {
    p.write(
      'tsconfig.json',
      p
        .read('tsconfig.json')
        .replace('"baseUrl": "./",', '// legacy\n    "baseUrl": "./",'),
    );
  });
  const jsoncBefore = jsonc.read('tsconfig.json');
  const r5 = jsonc.run();
  check(
    '[jsonc] 不改写 tsconfig.json',
    jsonc.read('tsconfig.json') === jsoncBefore,
  );
  check(
    '[jsonc] baseUrl 删除与 @api/* 补充进人工清单',
    r5.manual.some(m => /删除 compilerOptions\.baseUrl/.test(m)) &&
      r5.manual.some(m => /@api\/\*/.test(m)),
  );

  console.log('== 6. 已有 server.tsconfigPath / tsconfig.server.json ==');
  const explicit = prepare(p => {
    p.write(
      'modern.config.ts',
      p
        .read('modern.config.ts')
        .replace(
          'plugins:',
          "server: { tsconfigPath: './tsconfig.node.json' },\n  plugins:",
        ),
    );
  });
  explicit.run();
  check(
    '[explicit] 配置了 server.tsconfigPath 时不生成 tsconfig.server.json',
    !explicit.has('tsconfig.server.json'),
  );
  const commented = prepare(p => {
    p.write(
      'modern.config.ts',
      `// server: { tsconfigPath: './x.json' }\n${p.read('modern.config.ts')}`,
    );
  });
  commented.run();
  check(
    '[explicit] 注释里的 tsconfigPath 不算配置',
    commented.has('tsconfig.server.json'),
  );
  const existing = prepare(p => {
    p.write('tsconfig.server.json', '{ "extends": "./tsconfig.json" }\n');
  });
  existing.run();
  check(
    '[existing] 不覆盖已有 tsconfig.server.json',
    existing.read('tsconfig.server.json') ===
      '{ "extends": "./tsconfig.json" }\n',
  );

  console.log('== 7. 无 api/ 与 server/ ==');
  const web = prepare(p => {
    fs.rmSync(p.file('api'), { recursive: true });
  });
  const r7 = web.run();
  check(
    '[web] 只删除 baseUrl，不补 @api/*、不生成 server 文件',
    r7.changed.length === 1 &&
      !web.has('tsconfig.server.json') &&
      !('@api/*' in web.json('tsconfig.json').compilerOptions.paths),
  );

  console.log('== 8. migrate.mjs 主流程（v3 续迁移）调用 tsconfig 步骤 ==');
  const flow = prepare();
  execFileSync(
    'node',
    [path.join(SCRIPTS, 'migrate.mjs'), flow.work, '--to=3.0.0'],
    { encoding: 'utf8' },
  );
  const flowReport = flow.report();
  check(
    '[flow] report.changed 含 tsconfig 改写',
    flowReport.changed.some(c => /tsconfig\.json：删除/.test(c)) &&
      flowReport.changed.some(c => /tsconfig\.server\.json/.test(c)),
  );
  check(
    '[flow] 文件已改写',
    flow.has('tsconfig.server.json') &&
      !('baseUrl' in flow.json('tsconfig.json').compilerOptions),
  );

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  if (fail > 0) process.exit(1);
  console.log('✅ migrate-tsconfig 验证通过');
} finally {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
}
