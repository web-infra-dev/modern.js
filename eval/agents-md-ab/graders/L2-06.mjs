// L2-06 (answer_keywords): SSR active fallback — all three required:
// (1) server.ssr.forceCSR (prose or code form); (2) ?csr=true;
// (3) x-modern-ssr-fallback header.
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
  const proseForm = ctx.positively(t, /server\.ssr\.forceCSR/);
  const codeForm =
    ctx.positively(t, /forceCSR/) && /server/.test(t) && /ssr/i.test(t);
  c.add(
    'force-csr-config',
    proseForm || codeForm,
    'expects server.ssr.forceCSR asserted positively (full path or equivalent code form)',
  );
  c.add(
    'query-csr-true',
    ctx.positively(t, /csr=true/),
    'expects ?csr=true query way',
  );
  c.add(
    'fallback-header',
    ctx.positively(t, /x-modern-ssr-fallback/),
    'expects the x-modern-ssr-fallback request header way',
  );
}
