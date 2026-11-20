#!/usr/bin/env node
// 验证 modernjs-migrate-tsconfig skill（scripts/migrate-tsconfig.mjs）。
// 输入以 fixtures/v3-legacy-tsconfig-bff（旧创建模板的 tsconfig）为基础，按用例改写后复制到临时目录。
//   node tests/skill/migrate-tsconfig.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const SCRIPTS = path.join(REPO, 'skills/modernjs-migrate-tsconfig/scripts');
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
          path.join(work, '.agents/runs/modernjs-migrate-tsconfig/report.json'),
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
    '[auto] 删除 baseUrl "./"；没有裸导入时不补 "*"',
    !('baseUrl' in ts1.compilerOptions) &&
      r1.changed.some(c => /删除 compilerOptions\.baseUrl/.test(c)) &&
      !('*' in ts1.compilerOptions.paths),
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
  const r4 = custom.run();
  const ts4 = custom.json('tsconfig.json');
  check(
    '[auto] paths 加上原 baseUrl 前缀后删除 baseUrl',
    !('baseUrl' in ts4.compilerOptions) &&
      JSON.stringify(ts4.compilerOptions.paths['@/*']) ===
        JSON.stringify(['./src/*']) &&
      JSON.stringify(ts4.compilerOptions.paths['@shared/*']) ===
        JSON.stringify(['./shared/*']),
  );
  check(
    '[auto] @api/* 直接补充、无人工项',
    '@api/*' in ts4.compilerOptions.paths && r4.manual.length === 0,
  );
  check(
    '[auto] tsconfig.server.json 仍生成',
    custom.has('tsconfig.server.json'),
  );

  console.log('== 4b. baseUrl "./" + 裸导入 ==');
  const bare = prepare(p => {
    p.write(
      'src/index.ts',
      "import { greeting } from 'shared/greeting';\nexport const app = greeting;\n",
    );
  });
  const r4b = bare.run();
  const ts4b = bare.json('tsconfig.json');
  check(
    '[auto] 检测到裸导入时补 "*": ["./*"]',
    JSON.stringify(ts4b.compilerOptions.paths['*']) ===
      JSON.stringify(['./*']) && !('baseUrl' in ts4b.compilerOptions),
  );
  check(
    '[auto] changed 中写明触发 "*" 的导入',
    r4b.changed.some(c => c.includes("'shared/greeting'")),
  );
  check(
    '[auto] 已被 paths 覆盖的导入不算裸导入',
    (() => {
      const covered = prepare(p => {
        p.write(
          'src/index.ts',
          "import { greeting } from '@shared/greeting';\nexport const app = greeting;\n",
        );
      });
      covered.run();
      return !('*' in covered.json('tsconfig.json').compilerOptions.paths);
    })(),
  );

  console.log('== 4c. baseUrl "." 且没有 paths ==');
  const dot = prepare(p => {
    const ts = p.json('tsconfig.json');
    ts.compilerOptions.baseUrl = '.';
    delete ts.compilerOptions.paths;
    p.write('tsconfig.json', ts);
    p.write(
      'src/index.ts',
      "import { greeting } from 'shared/greeting';\nexport const app = greeting;\n",
    );
  });
  const r4c = dot.run();
  const ts4c = dot.json('tsconfig.json');
  check(
    '[auto] 删除 baseUrl，补 "*" 与 @api/*',
    !('baseUrl' in ts4c.compilerOptions) &&
      JSON.stringify(ts4c.compilerOptions.paths['*']) ===
        JSON.stringify(['./*']) &&
      '@api/*' in ts4c.compilerOptions.paths &&
      r4c.manual.length === 0,
  );

  console.log('== 4d. baseUrl 写在父配置 ==');
  const inherited = prepare(p => {
    const ts = p.json('tsconfig.json');
    const { baseUrl } = ts.compilerOptions;
    delete ts.compilerOptions.baseUrl;
    ts.extends = './tsconfig.base.json';
    p.write('tsconfig.json', ts);
    p.write('tsconfig.base.json', { compilerOptions: { baseUrl } });
  });
  const r4d = inherited.run();
  check(
    '[manual] 父配置里的 baseUrl 进人工清单，父配置不改',
    r4d.manual.some(m => m.includes('tsconfig.base.json')) &&
      'baseUrl' in inherited.json('tsconfig.base.json').compilerOptions,
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

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  if (fail > 0) process.exit(1);
  console.log('✅ migrate-tsconfig 验证通过');
} finally {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
}
