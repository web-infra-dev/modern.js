// T01 (L0/code, build_check): <h2>Hello Eval</h2> in src/routes/page.tsx + build passes.
export default async function grade(ctx, c) {
  const page =
    ctx.read('src/routes/page.tsx') ?? ctx.read('src/routes/page.jsx');
  const okH2 = c.add(
    'h2-hello-eval',
    page && /<h2[^>]*>\s*Hello Eval\s*<\/h2>/.test(page),
    page
      ? 'expects <h2>Hello Eval</h2> in src/routes/page.tsx'
      : 'src/routes/page.tsx missing',
  );
  if (!okH2) return; // static already failed — skip expensive build
  const b = await ctx.build();
  c.add(
    'build',
    b.ok,
    b.ok
      ? ''
      : `pnpm build exit ${b.code}${b.timedOut ? ' (timeout)' : ''}: ${b.tail.slice(-300)}`,
  );
}
