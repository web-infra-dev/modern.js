// T03 (L1/code, build_check): SSR enabled — behavioral evidence: build passes
// AND the build emits an SSR server bundle (bundles/ dir with .js) under the
// output root. Any correct config spelling produces it; a misplaced config
// doesn't.
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
  let found = false;
  for (const root of ['dist', 'build', 'build_output']) {
    const dir = path.join(ctx.runDir, root, 'bundles');
    if (fs.existsSync(dir) && fs.readdirSync(dir).some(f => f.endsWith('.js')))
      found = true;
  }
  c.add(
    'ssr-server-bundle',
    found,
    found
      ? ''
      : 'no <outputRoot>/bundles/*.js emitted — SSR not actually enabled',
  );
}
