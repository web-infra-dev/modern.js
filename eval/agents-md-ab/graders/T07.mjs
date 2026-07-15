// T07 (L2/qa, answer_keywords): enable BFF on an existing project.
// Trap kept from the pilot: any line recommending `modern new` / `pnpm new`
// without removal context = fail (v3 removed the command).
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
  const recommendsNew = ctx.recommendsWithoutNegation(
    t,
    /\b(modern|pnpm|npm run|yarn)\s+new\b/i,
    /(移除|不再|不能|removed|no longer|deprecated|不要|别用|不支持|不可用)/i,
  );
  c.add(
    'no-modern-new-recommendation',
    !recommendsNew,
    'recommends removed `modern new` / `pnpm new` without removal context',
  );
  c.add(
    'manual-enable-signals',
    /plugin-bff|bffPlugin|api\/lambda|skills add|手动|manually|安装.*插件|install/i.test(
      t,
    ),
    'expects manual/official-skill enable steps (plugin-bff install+register, api/lambda, tsconfig, or skills add)',
  );
}
