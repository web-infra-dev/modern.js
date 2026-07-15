// L1-03 (build_check): output root dist→build, JS subdir assets/js.
// output.path / distDir / outputPath spellings = 0. Build must really emit
// build/**/assets/js/*.js.
import fs from 'node:fs';
import path from 'node:path';

export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  if (!c.add('config-exists', !!conf, 'modern.config.ts missing')) return;
  const distPath = ctx.extractBlock(conf, 'distPath');
  c.add(
    'distpath-config',
    !!distPath &&
      /root\s*:\s*['"]build['"]/.test(distPath) &&
      /\bjs\s*:\s*['"]assets\/js['"]/.test(distPath),
    "expects output.distPath { root: 'build', js: 'assets/js' }",
  );
  c.add(
    'no-foreign-spelling',
    !/\boutput\s*:\s*\{[\s\S]*?\bpath\s*:/.test(conf) &&
      !/\bdistDir\b|\boutputPath\b/.test(conf),
    'output.path / distDir / outputPath are not Modern.js options',
  );
  if (c.checks.some(x => !x.ok)) return;
  const b = await ctx.build();
  if (
    !c.add(
      'build',
      b.ok,
      b.ok ? '' : `pnpm build exit ${b.code}: ${b.tail.slice(-300)}`,
    )
  )
    return;
  const buildRoot = path.join(ctx.runDir, 'build');
  if (
    !c.add('build-dir-exists', fs.existsSync(buildRoot), 'build/ not produced')
  )
    return;
  let jsFound = false;
  const rec = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) rec(full);
      else if (
        /assets\/js\/[^/]+\.js$/.test(
          path.relative(ctx.runDir, full).split(path.sep).join('/'),
        )
      )
        jsFound = true;
    }
  };
  rec(buildRoot);
  c.add('assets-js-artifacts', jsFound, 'no .js under build/**/assets/js/');
}
