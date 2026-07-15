// L0-02 (answer_keywords): enabling optional features in v3 — must give a
// correct path (official skills OR manual plugin install+register) AND
// explicitly negate `modern new`. Recommending modern new = 0.
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
  const skillsPath = /skills add|modernjs-feature-enable|官方 ?[Ss]kill/.test(
    t,
  );
  const manualPath =
    /(pnpm add|npm i|install|手动)[\s\S]{0,40}(plugin|插件)/.test(t) &&
    /modern\.config/.test(t);
  c.add(
    'correct-path',
    skillsPath || manualPath,
    'expects official skills path or manual plugin install + modern.config registration',
  );
  c.add(
    'negates-modern-new',
    /(不能|不可|已移除|removed)[\s\S]{0,12}modern new|modern new[\s\S]{0,12}(不能|已移除|不支持|removed)/i.test(
      t,
    ),
    'expects explicit negation of `modern new`',
  );
  c.add(
    'no-modern-new-recommendation',
    !ctx.recommendsWithoutNegation(
      t,
      /\b(modern|pnpm|npm run|yarn)\s+new\b/i,
      /(移除|不再|不能|不可|removed|no longer|deprecated|不要|别用|不支持)/i,
    ),
    'recommends removed `modern new` as a usable command',
  );
}
