// L2-05 (file_ast, no build): SSG enablement — ssgPlugin imported from
// '@modern-js/plugin-ssg' + registered in plugins + output.ssg true/object;
// package.json **dependencies** has "@modern-js/plugin-ssg": "3.6.0"
// (devDependencies = secondary only, not primary pass — v2.1 final review).
export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  if (!c.add('config-exists', !!conf, 'modern.config.ts missing')) return;
  c.add(
    'ssg-plugin-import',
    /import\s*\{[^}]*ssgPlugin[^}]*\}\s*from\s*['"]@modern-js\/plugin-ssg['"]/.test(
      conf,
    ),
    "expects import { ssgPlugin } from '@modern-js/plugin-ssg'",
  );
  const plugins =
    ctx.extractBlock(conf, 'plugins') ??
    conf.match(/plugins\s*:\s*\[([^\]]*)\]/s)?.[1] ??
    '';
  c.add(
    'ssg-plugin-registered',
    /ssgPlugin\s*\(/.test(plugins) ||
      /plugins\s*:\s*\[[^\]]*ssgPlugin\s*\(/s.test(conf),
    'plugins array must contain ssgPlugin()',
  );
  const output = ctx.extractBlock(conf, 'output') ?? '';
  c.add(
    'output-ssg',
    /ssg\s*:\s*(true|\{)/.test(output),
    'expects output.ssg = true (or a valid object)',
  );
  let pkg;
  try {
    pkg = JSON.parse(ctx.read('package.json'));
  } catch {
    pkg = null;
  }
  const inDeps = pkg?.dependencies?.['@modern-js/plugin-ssg'] === '3.6.0';
  const inDev = pkg?.devDependencies?.['@modern-js/plugin-ssg'];
  c.add(
    'dependency-position',
    inDeps,
    inDev
      ? '"@modern-js/plugin-ssg" placed in devDependencies — official step is pnpm add → dependencies (secondary completeness only, not primary pass)'
      : 'package.json dependencies must contain "@modern-js/plugin-ssg": "3.6.0"',
  );
}
