// T04 (L1/code, build_check): output root moved to build_output — behavioral:
// build passes and build_output/ really contains .html and .js artifacts.
import fs from 'node:fs';
import path from 'node:path';

export default async function grade(ctx, c) {
  const b = await ctx.build();
  if (
    !c.add(
      'build',
      b.ok,
      b.ok
        ? ''
        : `pnpm build exit ${b.code}${b.timedOut ? ' (timeout)' : ''}: ${b.tail.slice(-300)}`,
    )
  )
    return;
  const root = path.join(ctx.runDir, 'build_output');
  if (
    !c.add(
      'build_output-exists',
      fs.existsSync(root),
      'build_output/ directory not produced by build',
    )
  )
    return;
  let html = false;
  let js = false;
  const rec = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) rec(full);
      else if (e.name.endsWith('.html')) html = true;
      else if (e.name.endsWith('.js')) js = true;
    }
  };
  rec(root);
  c.add(
    'build_output-artifacts',
    html && js,
    `html=${html} js=${js} under build_output/`,
  );
}
