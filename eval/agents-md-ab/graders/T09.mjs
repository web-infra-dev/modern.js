// T09 (L3/code, file_ast + build): custom web server at the v3 conventional
// path with a middleware setting the x-eval response header; build must pass.
// NOTE: @modern-js/server-runtime is PREINSTALLED in both templates (earlier
// revisions lacked it and the doc-canonical import failed tsc with TS2307 —
// fixed). The grader keeps the historical lenient scope for this pilot task:
// file convention + middleware semantics + build; the defineServerConfig
// import is allowed but not required (the 35-task bank's L3-02 requires it).
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
