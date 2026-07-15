// L2-02 (answer_keywords): (1) api/lambda/user/[username]/info.ts export get →
// /api/user/:username/info; (2) prefix change → bff.prefix. Both required.
export default async function grade(ctx, c) {
  const a = ctx.answer();
  if (
    !c.add(
      'answer-present',
      !!a,
      a ? `source=${a.source}` : 'no ANSWER.md nor .final-answer.txt',
    )
  )
    return;
  const t = a.text;
  c.add(
    'url-mapping',
    ctx.positively(t, /\/api\/user\/:username\/info/),
    'expects /api/user/:username/info asserted positively (default /api prefix + [username]→:username)',
  );
  c.add(
    'bff-prefix-config',
    ctx.positively(t, /bff\.prefix/) || /bff\s*:\s*\{[^}]*prefix/s.test(t),
    "expects bff.prefix (modern.config.ts bff: { prefix: '/api-v2' })",
  );
}
