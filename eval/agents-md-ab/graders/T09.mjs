// T09 (L3/code, file_ast + build): custom web server at the v3 conventional
// path with a middleware setting the x-eval response header; build must pass.
// NOTE: template lacks @modern-js/server-runtime — importing it fails tsc, so
// the grader requires the file convention + middleware semantics, not that
// specific import (known template/doc inconsistency, recorded in the bank).
export default async function grade(ctx, c) {
  const rel = ['server/modern.server.ts', 'server/modern.server.js'].find(p =>
    ctx.exists(p),
  );
  if (
    !c.add(
      'server-file-exists',
      !!rel,
      'server/modern.server.ts missing (v3 custom web server convention)',
    )
  )
    return;
  const src = ctx.stripComments(ctx.read(rel));
  const okMw = c.add(
    'declares-middleware',
    /middlewares/.test(src) && /next\s*\(/.test(src),
    'expects a middlewares entry whose handler calls next()',
  );
  const okHeader = c.add(
    'sets-x-eval-header',
    /x-eval(?![\w-])/.test(src),
    "expects the middleware to set the 'x-eval' response header",
  );
  if (!(okMw && okHeader)) return;
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok
      ? ''
      : `pnpm build exit ${b.code}${b.timedOut ? ' (timeout)' : ''}: ${b.tail.slice(-300)}`,
  );
}
